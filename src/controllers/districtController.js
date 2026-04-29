import * as DistrictService from '../services/districtService.js';
import * as ProvinceService from '../services/provinceService.js';
import * as StationService from '../services/stationService.js';
import { validateIfMatch } from '../utils/etagHelper.js';
import { injectScopeFilter, assertScope } from '../utils/scopeHelper.js';

// @desc    Get all districts
// @route   GET /api/v1/districts
// @access  Private
export const getDistricts = async (req, res, next) => {
  try {
    const { province, code, name } = req.query;
    const filter = {};
    if (province) {
      const prov = await ProvinceService.getProvinceByCode(province);
      filter.province = prov._id;
    }
    if (code)     filter.code     = { $regex: code, $options: 'i' };
    if (name)     filter.name     = { $regex: name, $options: 'i' };
    injectScopeFilter(req.user, filter, 'district');
    const data = await DistrictService.getAllDistricts(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single district
// @route   GET /api/v1/districts/:code
// @access  Private
export const getDistrict = async (req, res, next) => {
  try {
    const district = await DistrictService.getDistrictByCode(req.params.code);
    assertScope(req.user, district, 'district');
    res.json(district);
  } catch (error) {
    next(error);
  }
};

// @desc    Create district
// @route   POST /api/v1/districts
// @access  Private (HQ_ADMIN only)
export const createDistrict = async (req, res, next) => {
  try {
    const { name, code, province } = req.body;
    const provinceDoc = await ProvinceService.getProvinceByCode(province);
    const district = await DistrictService.createDistrict({ name, code, province: provinceDoc._id });
    res.status(201)
      .location(`/api/v1/districts/${district.code}`)
      .json(district);
  } catch (error) {
    next(error);
  }
};

// @desc    Update district
// @route   PUT /api/v1/districts/:code
// @access  Private (HQ_ADMIN only)
export const updateDistrict = async (req, res, next) => {
  try {
    const current = await DistrictService.getDistrictByCode(req.params.code);
    if (req.headers['if-match']) {
      validateIfMatch(req, current);
    }
    const { name, code, province } = req.body;
    const resolvedProvince = province ? (await ProvinceService.getProvinceByCode(province))._id : undefined;
    const district = await DistrictService.updateDistrict(current._id, { name, code, province: resolvedProvince });
    res.json(district);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete district
// @route   DELETE /api/v1/districts/:code
// @access  Private (HQ_ADMIN only)
export const deleteDistrict = async (req, res, next) => {
  try {
    const district = await DistrictService.getDistrictByCode(req.params.code);
    await DistrictService.deleteDistrict(district._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get all police stations belonging to a specific district
// @route   GET /api/v1/districts/:code/police-stations
// @access  Private
export const getStationsByDistrict = async (req, res, next) => {
  try {
    const district = await DistrictService.getDistrictByCode(req.params.code);
    assertScope(req.user, district, 'district');
    const data = await StationService.getAllStations(
      { district: district._id },
      req.query
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};