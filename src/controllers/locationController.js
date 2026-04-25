import * as LocationService from '../services/locationService.js';

// @desc    Post location ping
// @route   POST /api/v1/vehicles/:id/ping
// @access  Private (DEVICE only)
export const postPing = async (req, res, next) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    const ping = await LocationService.recordPing(req.params.id, { latitude, longitude, speed, heading });
    res.status(201).json(ping);
  } catch (error) {
    next(error);
  }
};

// @desc    Get last known location of a vehicle
// @route   GET /api/v1/vehicles/:id/location
// @access  Private
export const getLastLocation = async (req, res, next) => {
  try {
    const { vehicle, lastPing } = await LocationService.getLastLocation(req.params.id);

    res.json({
      vehicle: {
        _id:                vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName:         vehicle.driverName,
        province:           vehicle.province,
        district:           vehicle.district,
        station:            vehicle.station
      },
      lastLocation: {
        latitude:  lastPing.latitude,
        longitude: lastPing.longitude,
        speed:     lastPing.speed,
        heading:   lastPing.heading,
        timestamp: lastPing.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get location history of a vehicle
// @route   GET /api/v1/vehicles/:id/history
// @access  Private
export const getLocationHistory = async (req, res, next) => {
  try {
    const result = await LocationService.getLocationHistory(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active vehicle locations (live view)
// @route   GET /api/v1/locations/live
// @access  Private
export const getLiveLocations = async (req, res, next) => {
  try {
    const { province, district, station } = req.query;
    const vehicleFilter = { isActive: true };
    if (province) vehicleFilter.province = province;
    if (district) vehicleFilter.district = district;
    if (station)  vehicleFilter.station  = station;

    const result = await LocationService.getLiveLocations(vehicleFilter);
    res.json(result);
  } catch (error) {
    next(error);
  }
};