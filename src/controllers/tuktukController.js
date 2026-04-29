import * as TukTukService from '../services/tuktukService.js';
import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import * as StationService from '../services/stationService.js';
import { validateIfMatch } from '../utils/etagHelper.js';
import { APIError } from '../utils/apiError.js';
import { injectScopeFilter, assertScope } from '../utils/scopeHelper.js';

// @desc    Get all tuktuks
// @route   GET /api/v1/tuktuks
// @access  Private
export const getTukTuks = async (req, res, next) => {
  try {
    const { province, district, station, isActive, registrationNumber } = req.query;
    const filter = {};
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      filter.province = prov._id;
    }
    if (district) {
      const dist = await DistrictService.getDistrictByCode(district);
      filter.district = dist._id;
    }
    if (station) {
      const sta = await StationService.getStationByCode(station);
      filter.station = sta._id;
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (registrationNumber)    filter.registrationNumber = { $regex: registrationNumber, $options: 'i' };
    injectScopeFilter(req.user, filter, 'tuktuk');
    const data = await TukTukService.getAllTukTuks(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tuktuk
// @route   GET /api/v1/tuktuks/:registrationNumber
// @access  Private
export const getTukTuk = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, tukTuk, 'tuktuk');
    res.json(tukTuk);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new tuktuk
// @route   POST /api/v1/tuktuks
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const createTukTuk = async (req, res, next) => {
  try {
    const { registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station } = req.body;
    const provinceDoc = await ProvinceService.getProvinceByCode(province);
    assertScope(req.user, provinceDoc, 'province');
    const districtDoc = await DistrictService.getDistrictByCode(district);
    const stationDoc  = await StationService.getStationByCode(station);
    const tukTuk = await TukTukService.createTukTuk({
      registrationNumber, deviceId, driverName, driverNIC, driverContact,
      province: provinceDoc._id, district: districtDoc._id, station: stationDoc._id
    });
    res.status(201)
      .location(`/api/v1/tuktuks/${tukTuk.registrationNumber}`)
      .json(tukTuk);
  } catch (error) {
    next(error);
  }
};

// @desc    Update tuktuk
// @route   PATCH /api/v1/tuktuks/:registrationNumber
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const updateTukTuk = async (req, res, next) => {
  try {
    if (req.body.isActive !== undefined && req.user.role !== 'HQ_ADMIN') {
      return next(new APIError(403, 'Forbidden', 'Only HQ_ADMIN can update the active status of a tuk-tuk'));
    }
    const current = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    assertScope(req.user, current, 'tuktuk');
    if (req.headers['if-match']) {
      validateIfMatch(req, current);
    }
    const body = { ...req.body };
    if (body.province) { const p = await ProvinceService.getProvinceByCode(body.province); assertScope(req.user, p, 'province'); body.province = p._id; }
    if (body.district) { const d = await DistrictService.getDistrictByCode(body.district); body.district = d._id; }
    if (body.station)  { const s = await StationService.getStationByCode(body.station);   body.station  = s._id; }
    const tukTuk = await TukTukService.updateTukTuk(current._id, body);
    res.json(tukTuk);
  } catch (error) {
    next(error);
  }
};


// @desc    Delete tuktuk
// @route   DELETE /api/v1/tuktuks/:registrationNumber
// @access  Private (HQ_ADMIN only)
export const deleteTukTuk = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukByRegNumber(req.params.registrationNumber);
    await TukTukService.deleteTukTuk(tukTuk._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};