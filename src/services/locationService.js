import LocationPing from '../models/LocationPing.js';
import TukTuk from '../models/TukTuk.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';
import { parseSLT } from '../utils/dateHelper.js';

export const recordPing = async (tukTukId, { latitude, longitude, speed, heading, batteryLevel, signalStrength, isEngineOn, passengerCount }) => {
  const tukTuk = await TukTuk.findById(tukTukId);
  if (!tukTuk) throw new APIError(404, 'Not Found', 'TukTuk not found');
  if (!tukTuk.isActive) throw new APIError(400, 'Bad Request', 'TukTuk is not active');
  return LocationPing.create({ tukTuk: tukTukId, latitude, longitude, speed: speed || 0, heading: heading || 0, timestamp: new Date(), batteryLevel, signalStrength, isEngineOn, passengerCount });
};

export const getLastLocation = async (tukTukId) => {
  const tukTuk = await TukTuk.findById(tukTukId)
    .populate('province', 'name code').populate('district', 'name code').populate('station', 'name code');
  if (!tukTuk) throw new APIError(404, 'Not Found', 'TukTuk not found');
  const lastPing = await LocationPing.findOne({ tukTuk: tukTukId }).sort({ timestamp: -1 });
  if (!lastPing) throw new APIError(404, 'Not Found', 'No location data found for this tukTuk');
  return { tukTuk, lastPing };
};

export const getLocationHistory = async (tukTukId, query) => {
  const tukTuk = await TukTuk.findById(tukTukId);
  if (!tukTuk) throw new APIError(404, 'Not Found', 'TukTuk not found');
  const { from, to, fields } = query;
  const filter = { tukTuk: tukTukId };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = parseSLT(from);
    if (to)   filter.timestamp.$lte = parseSLT(to);
  }

  // Build field projection from ?fields=lat,lng,timestamp (whitelist only)
  const ALLOWED_FIELDS = ['latitude', 'longitude', 'speed', 'heading', 'timestamp',
    'batteryLevel', 'signalStrength', 'isEngineOn', 'passengerCount'];
  let projection = null;
  if (fields) {
    const requested = fields.split(',').map(f => f.trim()).filter(f => ALLOWED_FIELDS.includes(f));
    if (requested.length > 0) {
      projection = requested.join(' ');
    }
  }

  const paginatedData = await getPaginationData(LocationPing, query, filter, null, 100, { timestamp: -1 }, projection);
  return { tukTuk, ...paginatedData };
};

export const getLiveLocations = async (tukTukFilter, query) => {
  const page   = parseInt(query.page,  10) || 1;
  const limit  = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const total  = await TukTuk.countDocuments(tukTukFilter);
  
  const pipeline = [
    { $match: tukTukFilter },
    { $lookup: {
        from: 'locationpings',
        let: { tukTukId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$tukTuk', '$$tukTukId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: 'latestPingInfo'
      }
    },
    { $unwind: { path: '$latestPingInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { 'latestPingInfo.timestamp': -1, _id: 1 } },
    { $skip: offset },
    { $limit: limit },
    { $lookup: { from: 'provinces', localField: 'province', foreignField: '_id', as: 'province' } },
    { $unwind: { path: '$province', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'districts', localField: 'district', foreignField: '_id', as: 'district' } },
    { $unwind: { path: '$district', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'policestations', localField: 'station', foreignField: '_id', as: 'station' } },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } }
  ];

  const results = await TukTuk.aggregate(pipeline);

  const data = results.map(tukTuk => ({
    tukTuk: {
      _id: tukTuk._id,
      registrationNumber: tukTuk.registrationNumber,
      driverName: tukTuk.driverName,
      province: tukTuk.province ? { _id: tukTuk.province._id, name: tukTuk.province.name, code: tukTuk.province.code } : null,
      district: tukTuk.district ? { _id: tukTuk.district._id, name: tukTuk.district.name, code: tukTuk.district.code } : null,
      station: tukTuk.station ? { _id: tukTuk.station._id, name: tukTuk.station.name, code: tukTuk.station.code } : null
    },
    lastLocation: tukTuk.latestPingInfo ? {
      latitude: tukTuk.latestPingInfo.latitude,
      longitude: tukTuk.latestPingInfo.longitude,
      speed: tukTuk.latestPingInfo.speed,
      heading: tukTuk.latestPingInfo.heading,
      timestamp: tukTuk.latestPingInfo.timestamp
    } : null
  }));

  const filterQs = Object.entries(query)
    .filter(([k]) => k !== 'page' && k !== 'limit').map(([k, v]) => `${k}=${v}`).join('&');
  const qsSuffix = filterQs ? `&${filterQs}` : '';
  return {
    page, limit, total,
    next:     offset + limit < total ? `?page=${page + 1}&limit=${limit}${qsSuffix}` : null,
    previous: offset > 0             ? `?page=${page - 1}&limit=${limit}${qsSuffix}` : null,
    data
  };
};

export const getInactiveTukTuks = async (tukTukFilter, hours = 6) => {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const tukTuks = await TukTuk.find(tukTukFilter)
    .populate('province', 'name code').populate('district', 'name code').populate('station', 'name code');
  const tukTukIds = tukTuks.map(v => v._id);
  const latestPings = await LocationPing.aggregate([
    { $match:  { tukTuk: { $in: tukTukIds } } },
    { $sort:   { timestamp: -1 } },
    { $group:  { _id: '$tukTuk', lastPing: { $first: '$$ROOT' } } }
  ]);
  const data = tukTuks
    .filter(tukTuk => {
      const pingDoc = latestPings.find(p => p._id.toString() === tukTuk._id.toString());
      return !pingDoc || pingDoc.lastPing.timestamp < cutoffTime;
    })
    .map(tukTuk => {
      const pingDoc  = latestPings.find(p => p._id.toString() === tukTuk._id.toString());
      const lastPing = pingDoc ? pingDoc.lastPing : null;
      const hoursSince = lastPing
        ? parseFloat(((Date.now() - new Date(lastPing.timestamp)) / 3600000).toFixed(1)) : null;
      return {
        tukTuk: { _id: tukTuk._id, registrationNumber: tukTuk.registrationNumber,
          driverName: tukTuk.driverName, province: tukTuk.province, district: tukTuk.district, station: tukTuk.station },
        lastLocation: lastPing
          ? { latitude: lastPing.latitude, longitude: lastPing.longitude, timestamp: lastPing.timestamp } : null,
        hoursSinceLastPing: hoursSince,
        status: lastPing ? 'signal_lost' : 'never_pinged'
      };
    });
  return { cutoffHours: hours, total: data.length, data };
};

export const getAllLocationHistory = async (tukTukFilter, query) => {
  const { from, to } = query;
  if (!from || !to) throw new APIError(400, 'Bad Request', 'from and to query parameters are required');
  const tukTuks = await TukTuk.find(tukTukFilter).select('_id');
  const filter = {
    tukTuk:   { $in: tukTuks.map(v => v._id) },
    timestamp: { $gte: parseSLT(from), $lte: parseSLT(to) }
  };
  const paginatedData = await getPaginationData(LocationPing, query, filter, null, 50, { timestamp: -1 });
  return { timeWindow: { from, to }, ...paginatedData };
};

export const getTukTukSummary = async (tukTukId, query) => {
  const tukTuk = await TukTuk.findById(tukTukId)
    .populate('province', 'name code').populate('district', 'name code').populate('station', 'name code');
  if (!tukTuk) throw new APIError(404, 'Not Found', 'TukTuk not found');
  const { from, to } = query;
  const filter = { tukTuk: tukTukId };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = parseSLT(from);
    if (to)   filter.timestamp.$lte = parseSLT(to);
  }
  const pings = await LocationPing.find(filter).sort({ timestamp: 1 });
  if (pings.length === 0) {
    return {
      tukTuk: { registrationNumber: tukTuk.registrationNumber, driverName: tukTuk.driverName },
      summary: { totalPings: 0, message: 'No location data in this time window' }
    };
  }
  let totalDistance = 0;
  for (let i = 1; i < pings.length; i++) {
    const prev = pings[i - 1]; const curr = pings[i]; const R = 6371;
    const dLat = (curr.latitude  - prev.latitude)  * Math.PI / 180;
    const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(prev.latitude*Math.PI/180)*Math.cos(curr.latitude*Math.PI/180)*Math.sin(dLon/2)**2;
    totalDistance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  const first = pings[0]; const last = pings[pings.length - 1];
  const avgSpeed = pings.reduce((s, p) => s + p.speed, 0) / pings.length;
  return {
    tukTuk: { _id: tukTuk._id, registrationNumber: tukTuk.registrationNumber, driverName: tukTuk.driverName,
      province: tukTuk.province, district: tukTuk.district, station: tukTuk.station },
    summary: {
      totalPings: pings.length, firstSeen: first.timestamp, lastSeen: last.timestamp,
      durationHours: parseFloat(((new Date(last.timestamp) - new Date(first.timestamp)) / 3600000).toFixed(1)),
      approximateDistanceKm: parseFloat(totalDistance.toFixed(2)),
      averageSpeedKmph: parseFloat(avgSpeed.toFixed(1)),
      maxSpeedKmph: parseFloat(Math.max(...pings.map(p => p.speed)).toFixed(1)),
      firstLocation: { latitude: first.latitude, longitude: first.longitude },
      lastLocation:  { latitude: last.latitude,  longitude: last.longitude }
    }
  };
};

export const getSpeedAnomalies = async (tukTukFilter, query) => {
  const { speedThreshold = 70, from, to } = query;
  const tukTuks = await TukTuk.find(tukTukFilter).select('_id registrationNumber driverName');
  const pingFilter = { tukTuk: { $in: tukTuks.map(v => v._id) }, speed: { $gte: parseFloat(speedThreshold) } };
  if (from || to) {
    pingFilter.timestamp = {};
    if (from) pingFilter.timestamp.$gte = parseSLT(from);
    if (to)   pingFilter.timestamp.$lte = parseSLT(to);
  }
  const paginatedData = await getPaginationData(LocationPing, query, pingFilter, null, 50, { speed: -1 });
  const enrichedData = paginatedData.data.map(ping => {
    const v = tukTuks.find(v => v._id.toString() === ping.tukTuk.toString());
    return { ...ping.toObject(), tukTukInfo: v ? { registrationNumber: v.registrationNumber, driverName: v.driverName } : null };
  });
  return { speedThreshold: parseFloat(speedThreshold), ...paginatedData, data: enrichedData };
};

export const getTukTukAnomalies = async (tukTukId, query) => {
  const { speedThreshold = 70, from, to } = query;
  const tukTuk = await TukTuk.findById(tukTukId).select('_id registrationNumber driverName');
  if (!tukTuk) throw new APIError(404, 'Not Found', 'TukTuk not found');
  const pingFilter = { tukTuk: tukTukId, speed: { $gte: parseFloat(speedThreshold) } };
  if (from || to) {
    pingFilter.timestamp = {};
    if (from) pingFilter.timestamp.$gte = parseSLT(from);
    if (to)   pingFilter.timestamp.$lte = parseSLT(to);
  }
  const paginatedData = await getPaginationData(LocationPing, query, pingFilter, null, 50, { speed: -1 });
  return { speedThreshold: parseFloat(speedThreshold), tukTuk, ...paginatedData };
};

export const getLocationSummary = async (scopeFilter = {}) => {
  const matchStage = { isActive: true, ...scopeFilter };
  const summary = await TukTuk.aggregate([
    { $match: matchStage },
    { $group: { _id: '$province', activeTukTuks: { $sum: 1 } } },
    { $lookup: { from: 'provinces', localField: '_id', foreignField: '_id', as: 'province' } },
    { $unwind: '$province' },
    { $project: { province: '$province.name', code: '$province.code', activeTukTuks: 1 } },
    { $sort: { activeTukTuks: -1 } }
  ]);
  return { total: summary.reduce((acc, s) => acc + s.activeTukTuks, 0), byProvince: summary };
};
