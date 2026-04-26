import * as LocationService from '../services/locationService.js';

export const postPing = async (req, res, next) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    const ping = await LocationService.recordPing(req.params.id, { latitude, longitude, speed, heading });
    res.status(201).json(ping);
  } catch (error) { next(error); }
};

export const getLastLocation = async (req, res, next) => {
  try {
    const { tukTuk, lastPing } = await LocationService.getLastLocation(req.params.id);
    res.json({
      tukTuk: { _id: tukTuk._id, registrationNumber: tukTuk.registrationNumber,
        driverName: tukTuk.driverName, province: tukTuk.province, district: tukTuk.district, station: tukTuk.station },
      lastLocation: { latitude: lastPing.latitude, longitude: lastPing.longitude,
        speed: lastPing.speed, heading: lastPing.heading, timestamp: lastPing.timestamp }
    });
  } catch (error) { next(error); }
};

export const getLocationHistory = async (req, res, next) => {
  try {
    const result = await LocationService.getLocationHistory(req.params.id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getTukTukSummary = async (req, res, next) => {
  try {
    const result = await LocationService.getTukTukSummary(req.params.id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getLiveLocations = async (req, res, next) => {
  try {
    const { province, district, station } = req.query;
    const tukTukFilter = { isActive: true };
    if (province) tukTukFilter.province = province;
    if (district) tukTukFilter.district = district;
    if (station)  tukTukFilter.station  = station;
    const result = await LocationService.getLiveLocations(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getInactiveTukTuks = async (req, res, next) => {
  try {
    const { province, district, hours } = req.query;
    const tukTukFilter = { isActive: true };
    if (province) tukTukFilter.province = province;
    if (district) tukTukFilter.district = district;
    const result = await LocationService.getInactiveTukTuks(tukTukFilter, parseInt(hours, 10) || 6);
    res.json(result);
  } catch (error) { next(error); }
};

export const getAllLocationHistory = async (req, res, next) => {
  try {
    const { province, district, station } = req.query;
    const tukTukFilter = {};
    if (province) tukTukFilter.province = province;
    if (district) tukTukFilter.district = district;
    if (station)  tukTukFilter.station  = station;
    const result = await LocationService.getAllLocationHistory(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getSpeedAnomalies = async (req, res, next) => {
  try {
    const { province, district } = req.query;
    const tukTukFilter = {};
    if (province) tukTukFilter.province = province;
    if (district) tukTukFilter.district = district;
    const result = await LocationService.getSpeedAnomalies(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getLocationSummary = async (req, res, next) => {
  try {
    const result = await LocationService.getLocationSummary();
    res.json(result);
  } catch (error) { next(error); }
};