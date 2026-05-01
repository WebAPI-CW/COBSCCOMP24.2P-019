import * as LocationService from '../services/locationService.js';
import * as TukTukService from '../services/tuktukService.js';
import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import * as StationService from '../services/stationService.js';
import { APIError } from '../utils/apiError.js';
import { injectScopeFilter, assertScope } from '../utils/scopeHelper.js';

export const postPing = async (req, res, next) => {
  try {
    const { latitude, longitude, speed, heading, batteryLevel, signalStrength, isEngineOn, passengerCount } = req.body;
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    if (req.user.registrationNumber?.toUpperCase() !== tukTuk.registrationNumber) {
      return next(new APIError(403, 'Forbidden', 'This device is not authorized to post pings for this tuk-tuk'));
    }
    const ping = await LocationService.recordPing(tukTuk._id, { latitude, longitude, speed, heading, batteryLevel, signalStrength, isEngineOn, passengerCount });
    res.status(201).json(ping);
  } catch (error) { next(error); }
};

export const getLastLocation = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, tukTuk, 'tuktuk');
    const { tukTuk: tt, lastPing } = await LocationService.getLastLocation(tukTuk._id);
    res.json({
      tukTuk: { _id: tt._id, registrationNumber: tt.registrationNumber,
        driverName: tt.driverName, province: tt.province, district: tt.district, station: tt.station },
      lastLocation: { latitude: lastPing.latitude, longitude: lastPing.longitude,
        speed: lastPing.speed, heading: lastPing.heading, timestamp: lastPing.timestamp,
        batteryLevel: lastPing.batteryLevel, signalStrength: lastPing.signalStrength,
        isEngineOn: lastPing.isEngineOn, passengerCount: lastPing.passengerCount }
    });
  } catch (error) { next(error); }
};

export const getLocationHistory = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, tukTuk, 'tuktuk');
    const result = await LocationService.getLocationHistory(tukTuk._id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getTukTukSummary = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, tukTuk, 'tuktuk');
    const result = await LocationService.getTukTukSummary(tukTuk._id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getLiveLocations = async (req, res, next) => {
  try {
    const { province, district, station } = req.query;
    const tukTukFilter = { isActive: true };
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      tukTukFilter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      tukTukFilter.district = dist._id;
    }
    if (station) {
      const sta = await StationService.getStationByCode(station);
      tukTukFilter.station = sta._id;
    }
    injectScopeFilter(req.user, tukTukFilter, 'tuktuk');
    const result = await LocationService.getLiveLocations(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getInactiveTukTuks = async (req, res, next) => {
  try {
    const { province, district, hours } = req.query;
    const tukTukFilter = { isActive: true };
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      tukTukFilter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      tukTukFilter.district = dist._id;
    }
    injectScopeFilter(req.user, tukTukFilter, 'tuktuk');
    const result = await LocationService.getInactiveTukTuks(tukTukFilter, parseInt(hours, 10) || 6);
    res.json(result);
  } catch (error) { next(error); }
};

export const getAllLocationHistory = async (req, res, next) => {
  try {
    const { province, district, station } = req.query;
    const tukTukFilter = {};
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      tukTukFilter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      tukTukFilter.district = dist._id;
    }
    if (station) {
      const sta = await StationService.getStationByCode(station);
      tukTukFilter.station = sta._id;
    }
    injectScopeFilter(req.user, tukTukFilter, 'tuktuk');
    const result = await LocationService.getAllLocationHistory(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getSpeedAnomalies = async (req, res, next) => {
  try {
    const threshold = parseFloat(req.query.speedThreshold ?? 70);
    if (isNaN(threshold) || threshold <= 0) {
      return next(new APIError(400, 'Bad Request', 'speedThreshold must be a positive number'));
    }
    req.query.speedThreshold = threshold;
    const { province, district } = req.query;
    const tukTukFilter = {};
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      tukTukFilter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      tukTukFilter.district = dist._id;
    }
    injectScopeFilter(req.user, tukTukFilter, 'tuktuk');
    const result = await LocationService.getSpeedAnomalies(tukTukFilter, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getTukTukAnomalies = async (req, res, next) => {
  try {
    const threshold = parseFloat(req.query.speedThreshold ?? 70);
    if (isNaN(threshold) || threshold <= 0) {
      return next(new APIError(400, 'Bad Request', 'speedThreshold must be a positive number'));
    }
    req.query.speedThreshold = threshold;
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, tukTuk, 'tuktuk');
    const result = await LocationService.getTukTukAnomalies(tukTuk._id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

export const getLocationSummary = async (req, res, next) => {
  try {
    const scopeFilter = {};
    injectScopeFilter(req.user, scopeFilter, 'tuktuk');
    const result = await LocationService.getLocationSummary(scopeFilter);
    res.json(result);
  } catch (error) { next(error); }
};