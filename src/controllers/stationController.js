import * as StationService from '../services/stationService.js';
import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import { validateIfMatch } from '../utils/etagHelper.js';
import { injectScopeFilter, assertScope } from '../utils/scopeHelper.js';

// @desc    Get all stations
// @route   GET /api/v1/police-stations
// @access  Private
export const getStations = async (req, res, next) => {
  try {
    const { province, district, code, name } = req.query;
    const filter = {};
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      filter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      filter.district = dist._id;
    }
    if (code)     filter.code     = { $regex: code, $options: 'i' };
    if (name)     filter.name     = { $regex: name, $options: 'i' };
    injectScopeFilter(req.user, filter, 'station');
    const data = await StationService.getAllStations(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single station
// @route   GET /api/v1/police-stations/:code
// @access  Private
export const getStation = async (req, res, next) => {
  try {
    const station = await StationService.getStationByCode(req.params.code);
    assertScope(req.user, station, 'station');
    res.json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Create station
// @route   POST /api/v1/police-stations
// @access  Private (HQ_ADMIN only)
export const createStation = async (req, res, next) => {
  try {
    const { name, code, district, province, address, contactNumber } = req.body;
    const provinceDoc = await ProvinceService.getProvinceByCode(province);
    const districtDoc = await DistrictService.getDistrictByCode(district);
    const station = await StationService.createStation({ name, code, district: districtDoc._id, province: provinceDoc._id, address, contactNumber });
    res.status(201)
      .location(`/api/v1/police-stations/${station.code}`)
      .json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Update station
// @route   PUT /api/v1/police-stations/:code
// @access  Private (HQ_ADMIN only)
export const updateStation = async (req, res, next) => {
  try {
    const current = await StationService.getStationByCode(req.params.code);
    if (req.headers['if-match']) {
      validateIfMatch(req, current);
    }
    const { name, code, district, province, address, contactNumber } = req.body;
    const resolvedProvince = province ? (await ProvinceService.getProvinceByCode(province))._id : undefined;
    const resolvedDistrict = district ? (await DistrictService.getDistrictByCode(district))._id : undefined;
    const station = await StationService.updateStation(current._id, {
      name, code, district: resolvedDistrict, province: resolvedProvince, address, contactNumber
    });
    res.json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete station
// @route   DELETE /api/v1/police-stations/:code
// @access  Private (HQ_ADMIN only)
export const deleteStation = async (req, res, next) => {
  try {
    const station = await StationService.getStationByCode(req.params.code);
    await StationService.deleteStation(station._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};