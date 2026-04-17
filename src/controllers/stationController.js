import PoliceStation from '../models/PoliceStation.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

// @desc    Get all stations
// @route   GET /api/stations
// @access  Private
export const getStations = async (req, res, next) => {
  try {
    const { province, district } = req.query;
    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;

    const paginatedData = await getPaginationData(
      PoliceStation,
      req.query,
      filter,
      [
        { path: 'province', select: 'name code' },
        { path: 'district', select: 'name code' }
      ]
    );
    res.json(paginatedData);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get single station
// @route   GET /api/stations/:id
// @access  Private
export const getStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code');
    if (!station) {
      return next(new APIError(404, 'Not Found', 'Station not found'));
    }
    res.json(station);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Create station
// @route   POST /api/stations
// @access  Private (HQ_ADMIN only)
export const createStation = async (req, res, next) => {
  try {
    const { name, code, district, province, address, contactNumber } = req.body;
    const station = await PoliceStation.create({
      name, code, district, province, address, contactNumber
    });
    res.status(201).json(station);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Update station
// @route   PUT /api/stations/:id
// @access  Private (HQ_ADMIN only)
export const updateStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!station) {
      return next(new APIError(404, 'Not Found', 'Station not found'));
    }
    res.json(station);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Delete station
// @route   DELETE /api/stations/:id
// @access  Private (HQ_ADMIN only)
export const deleteStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findByIdAndDelete(req.params.id);
    if (!station) {
      return next(new APIError(404, 'Not Found', 'Station not found'));
    }
    res.status(204).end();
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};