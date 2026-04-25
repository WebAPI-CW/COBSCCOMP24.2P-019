import LocationPing from '../models/LocationPing.js';
import Vehicle from '../models/Vehicle.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

/**
 * Record a new GPS ping for a vehicle.
 * Throws APIError 404 if vehicle not found, 400 if vehicle is inactive.
 */
export const recordPing = async (vehicleId, { latitude, longitude, speed, heading }) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }
  if (!vehicle.isActive) {
    throw new APIError(400, 'Bad Request', 'Vehicle is not active');
  }

  return LocationPing.create({
    vehicle: vehicleId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    timestamp: new Date()
  });
};

/**
 * Return the last known location for a vehicle.
 * Throws APIError 404 if vehicle not found or no pings exist.
 */
export const getLastLocation = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId)
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station', 'name code');
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }

  const lastPing = await LocationPing.findOne({ vehicle: vehicleId })
    .sort({ timestamp: -1 });
  if (!lastPing) {
    throw new APIError(404, 'Not Found', 'No location data found for this vehicle');
  }

  return { vehicle, lastPing };
};

/**
 * Return paginated location history for a vehicle within an optional time window.
 * Throws APIError 404 if vehicle not found.
 */
export const getLocationHistory = async (vehicleId, query) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }

  const { from, to } = query;
  const filter = { vehicle: vehicleId };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to)   filter.timestamp.$lte = new Date(to);
  }

  const paginatedData = await getPaginationData(
    LocationPing,
    query,
    filter,
    null,   // no populate needed on ping documents
    100,    // default 100 pings per page for history
    { timestamp: -1 }
  );

  return { vehicle, ...paginatedData };
};

/**
 * Return the latest ping for every active vehicle, with optional province/district/station filters.
 * Uses a single aggregation pipeline to avoid N separate queries.
 */
export const getLiveLocations = async (vehicleFilter) => {
  const vehicles = await Vehicle.find(vehicleFilter)
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station', 'name code');

  const vehicleIds = vehicles.map(v => v._id);

  const latestPings = await LocationPing.aggregate([
    { $match:  { vehicle: { $in: vehicleIds } } },
    { $sort:   { timestamp: -1 } },
    { $group:  { _id: '$vehicle', lastPing: { $first: '$$ROOT' } } }
  ]);

  const data = vehicles.map(vehicle => {
    const pingDoc = latestPings.find(p => p._id.toString() === vehicle._id.toString());
    const lastPing = pingDoc ? pingDoc.lastPing : null;
    return {
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: vehicle.driverName,
        province: vehicle.province,
        district: vehicle.district,
        station: vehicle.station
      },
      lastLocation: lastPing ? {
        latitude:  lastPing.latitude,
        longitude: lastPing.longitude,
        speed:     lastPing.speed,
        heading:   lastPing.heading,
        timestamp: lastPing.timestamp
      } : null
    };
  });

  return { total: data.length, data };
};
