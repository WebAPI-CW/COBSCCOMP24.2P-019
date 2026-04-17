import District from '../models/District.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private
export const getDistricts = async (req, res, next) => {
  try {
    const { province } = req.query;
    const filter = province ? { province } : {};
    
    const paginatedData = await getPaginationData(
      District, 
      req.query, 
      filter, 
      { path: 'province', select: 'name code' }
    );
    res.json(paginatedData);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get single district
// @route   GET /api/districts/:id
// @access  Private
export const getDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('province', 'name code');
    if (!district) {
      return next(new APIError(404, 'Not Found', 'District not found'));
    }
    res.json(district);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (HQ_ADMIN only)
export const createDistrict = async (req, res, next) => {
  try {
    const { name, code, province } = req.body;
    const district = await District.create({ name, code, province });
    res.status(201).json(district);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (HQ_ADMIN only)
export const updateDistrict = async (req, res, next) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!district) {
      return next(new APIError(404, 'Not Found', 'District not found'));
    }
    res.json(district);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Delete district
// @route   DELETE /api/districts/:id
// @access  Private (HQ_ADMIN only)
export const deleteDistrict = async (req, res, next) => {
  try {
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) {
      return next(new APIError(404, 'Not Found', 'District not found'));
    }
    res.status(204).end();
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};