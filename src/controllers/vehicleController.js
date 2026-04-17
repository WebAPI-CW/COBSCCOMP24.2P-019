import Vehicle from '../models/Vehicle.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res, next) => {
  try {
    const { province, district, station, isActive } = req.query;
    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    if (station) filter.station = station;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const paginatedData = await getPaginationData(
      Vehicle,
      req.query,
      filter,
      [
        { path: 'province', select: 'name code' },
        { path: 'district', select: 'name code' },
        { path: 'station', select: 'name code' }
      ]
    );
    res.json(paginatedData);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }
    res.json(vehicle);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Register vehicle
// @route   POST /api/vehicles
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const createVehicle = async (req, res, next) => {
  try {
    const {
      registrationNumber,
      deviceId,
      driverName,
      driverNIC,
      driverContact,
      province,
      district,
      station
    } = req.body;

    const vehicleExists = await Vehicle.findOne({
      $or: [{ registrationNumber }, { deviceId }, { driverNIC }]
    });

    if (vehicleExists) {
      return next(new APIError(400, 'Bad Request', 'Vehicle with same registration, device ID or NIC already exists'));
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      deviceId,
      driverName,
      driverNIC,
      driverContact,
      province,
      district,
      station
    });

    res.status(201).json(vehicle);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }
    res.json(vehicle);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Deactivate vehicle
// @route   PUT /api/vehicles/:id/deactivate
// @access  Private (HQ_ADMIN only)
export const deactivateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }
    res.json({ message: 'Vehicle deactivated', vehicle });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (HQ_ADMIN only)
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }
    res.status(204).end();
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};