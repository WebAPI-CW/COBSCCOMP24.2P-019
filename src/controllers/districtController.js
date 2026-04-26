import * as DistrictService from '../services/districtService.js';

// @desc    Get all districts
// @route   GET /api/v1/districts
// @access  Private
export const getDistricts = async (req, res, next) => {
  try {
    const { province } = req.query;
    const filter = province ? { province } : {};
    const data = await DistrictService.getAllDistricts(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single district
// @route   GET /api/v1/districts/:id
// @access  Private
export const getDistrict = async (req, res, next) => {
  try {
    const district = await DistrictService.getDistrictById(req.params.id);
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
    const district = await DistrictService.createDistrict({ name, code, province });
    res.status(201)
      .location(`/api/v1/districts/${district._id}`)
      .json(district);
  } catch (error) {
    next(error);
  }
};

// @desc    Update district
// @route   PUT /api/v1/districts/:id
// @access  Private (HQ_ADMIN only)
export const updateDistrict = async (req, res, next) => {
  try {
    const { name, code, province } = req.body;
    const district = await DistrictService.updateDistrict(req.params.id, { name, code, province });
    res.json(district);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete district
// @route   DELETE /api/v1/districts/:id
// @access  Private (HQ_ADMIN only)
export const deleteDistrict = async (req, res, next) => {
  try {
    await DistrictService.deleteDistrict(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};