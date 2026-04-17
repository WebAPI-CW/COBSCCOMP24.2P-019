import LocationPing from '../models/LocationPing.js';
import Vehicle from '../models/Vehicle.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

// @desc    Post location ping
// @route   POST /api/vehicles/:id/ping
// @access  Private (DEVICE only)
export const postPing = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }

    if (!vehicle.isActive) {
      return next(new APIError(400, 'Bad Request', 'Vehicle is not active'));
    }

    const { latitude, longitude, speed, heading } = req.body;

    const ping = await LocationPing.create({
      vehicle: req.params.id,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date()
    });

    res.status(201).json(ping);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get last known location of a vehicle
// @route   GET /api/vehicles/:id/location
// @access  Private
export const getLastLocation = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');

    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }

    const lastPing = await LocationPing.findOne({ vehicle: req.params.id })
      .sort({ timestamp: -1 });

    if (!lastPing) {
      return next(new APIError(404, 'Not Found', 'No location data found'));
    }

    res.json({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: vehicle.driverName,
        province: vehicle.province,
        district: vehicle.district,
        station: vehicle.station
      },
      lastLocation: {
        latitude: lastPing.latitude,
        longitude: lastPing.longitude,
        speed: lastPing.speed,
        heading: lastPing.heading,
        timestamp: lastPing.timestamp
      }
    });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get location history of a vehicle
// @route   GET /api/vehicles/:id/history
// @access  Private
export const getLocationHistory = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new APIError(404, 'Not Found', 'Vehicle not found'));
    }

    const { from, to } = req.query;

    const filter = { vehicle: req.params.id };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const paginatedData = await getPaginationData(
      LocationPing,
      req.query,
      filter,
      null, // populateOptions
      100,  // defaultLimit
      { timestamp: -1 } // sortOptions
    );

    res.json({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: vehicle.driverName
      },
      ...paginatedData
    });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get all active vehicle locations
// @route   GET /api/locations/live
// @access  Private
export const getLiveLocations = async (req, res, next) => {
  try {
    const { province, district } = req.query;

    const vehicleFilter = { isActive: true };
    if (province) vehicleFilter.province = province;
    if (district) vehicleFilter.district = district;

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');

    const liveData = await Promise.all(
      vehicles.map(async (vehicle) => {
        const lastPing = await LocationPing.findOne({
          vehicle: vehicle._id
        }).sort({ timestamp: -1 });

        return {
          vehicle: {
            _id: vehicle._id,
            registrationNumber: vehicle.registrationNumber,
            driverName: vehicle.driverName,
            province: vehicle.province,
            district: vehicle.district,
            station: vehicle.station
          },
          lastLocation: lastPing ? {
            latitude: lastPing.latitude,
            longitude: lastPing.longitude,
            speed: lastPing.speed,
            heading: lastPing.heading,
            timestamp: lastPing.timestamp
          } : null
        };
      })
    );

    res.json({
      total: liveData.length,
      data: liveData
    });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};