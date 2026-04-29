import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import { validateIfMatch } from '../utils/etagHelper.js';
import { injectScopeFilter, assertScope } from '../utils/scopeHelper.js';

// @desc    Get all provinces
// @route   GET /api/v1/provinces
// @access  Private
export const getProvinces = async (req, res, next) => {
  try {
    const { code } = req.query;
    const filter = {};
    if (code) filter.code = { $regex: code, $options: 'i' };
    injectScopeFilter(req.user, filter, 'province');
    const data = await ProvinceService.getAllProvinces(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single province
// @route   GET /api/v1/provinces/:code
// @access  Private
export const getProvince = async (req, res, next) => {
  try {
    const province = await ProvinceService.getProvinceByCode(req.params.code);
    assertScope(req.user, province, 'province');
    res.json(province);
  } catch (error) {
    next(error);
  }
};

// @desc    Create province
// @route   POST /api/v1/provinces
// @access  Private (HQ_ADMIN only)
export const createProvince = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const province = await ProvinceService.createProvince({ name, code });
    res.status(201)
      .location(`/api/v1/provinces/${province.code}`)
      .json(province);
  } catch (error) {
    next(error);
  }
};

// @desc    Update province
// @route   PATCH /api/v1/provinces/:code
// @access  Private (HQ_ADMIN only)
export const updateProvince = async (req, res, next) => {
  try {
    const current = await ProvinceService.getProvinceByCode(req.params.code);
    if (req.headers['if-match']) {
      validateIfMatch(req, current);
    }
    const { name, code } = req.body;
    const province = await ProvinceService.updateProvince(current._id, { name, code });
    res.json(province);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete province
// @route   DELETE /api/v1/provinces/:code
// @access  Private (HQ_ADMIN only)
export const deleteProvince = async (req, res, next) => {
  try {
    const province = await ProvinceService.getProvinceByCode(req.params.code);
    await ProvinceService.deleteProvince(province._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get all districts belonging to a specific province
// @route   GET /api/v1/provinces/:code/districts
// @access  Private
export const getDistrictsByProvince = async (req, res, next) => {
  try {
    const province = await ProvinceService.getProvinceByCode(req.params.code);
    assertScope(req.user, province, 'province');
    const data = await DistrictService.getAllDistricts(
      { province: province._id },
      req.query
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};