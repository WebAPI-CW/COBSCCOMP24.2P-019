import Province from '../models/Province.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

// @desc    Get all provinces
// @route   GET /api/provinces
// @access  Private
export const getProvinces = async (req, res, next) => {
  try {
    const paginatedData = await getPaginationData(Province, req.query);
    res.json(paginatedData);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get single province
// @route   GET /api/provinces/:id
// @access  Private
export const getProvince = async (req, res, next) => {
  try {
    const province = await Province.findById(req.params.id);
    if (!province) {
      return next(new APIError(404, 'Not Found', 'Province not found'));
    }
    res.json(province);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Create province
// @route   POST /api/provinces
// @access  Private (HQ_ADMIN only)
export const createProvince = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const province = await Province.create({ name, code });
    res.status(201).json(province);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Update province
// @route   PUT /api/provinces/:id
// @access  Private (HQ_ADMIN only)
export const updateProvince = async (req, res, next) => {
  try {
    const province = await Province.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!province) {
      return next(new APIError(404, 'Not Found', 'Province not found'));
    }
    res.json(province);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Delete province
// @route   DELETE /api/provinces/:id
// @access  Private (HQ_ADMIN only)
export const deleteProvince = async (req, res, next) => {
  try {
    const province = await Province.findByIdAndDelete(req.params.id);
    if (!province) {
      return next(new APIError(404, 'Not Found', 'Province not found'));
    }
    res.status(204).end();
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};