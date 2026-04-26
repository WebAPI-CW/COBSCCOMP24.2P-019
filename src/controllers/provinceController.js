import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import { validateIfMatch } from '../utils/etagHelper.js';

// @desc    Get all provinces
// @route   GET /api/v1/provinces
// @access  Private
export const getProvinces = async (req, res, next) => {
  try {
    const data = await ProvinceService.getAllProvinces(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single province
// @route   GET /api/v1/provinces/:id
// @access  Private
export const getProvince = async (req, res, next) => {
  try {
    const province = await ProvinceService.getProvinceById(req.params.id);
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
      .location(`/api/v1/provinces/${province._id}`)
      .json(province);
  } catch (error) {
    next(error);
  }
};

// @desc    Update province
// @route   PUT /api/v1/provinces/:id
// @access  Private (HQ_ADMIN only)
export const updateProvince = async (req, res, next) => {
  try {
    if (req.headers['if-match']) {
      const current = await ProvinceService.getProvinceById(req.params.id);
      validateIfMatch(req, current);
    }
    const { name, code } = req.body;
    const province = await ProvinceService.updateProvince(req.params.id, { name, code });
    res.json(province);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete province
// @route   DELETE /api/v1/provinces/:id
// @access  Private (HQ_ADMIN only)
export const deleteProvince = async (req, res, next) => {
  try {
    await ProvinceService.deleteProvince(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get all districts belonging to a specific province
// @route   GET /api/v1/provinces/:id/districts
// @access  Private
export const getDistrictsByProvince = async (req, res, next) => {
  try {
    // Verify province exists first — throws 404 if not
    await ProvinceService.getProvinceById(req.params.id);
    const data = await DistrictService.getAllDistricts(
      { province: req.params.id },
      req.query
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};