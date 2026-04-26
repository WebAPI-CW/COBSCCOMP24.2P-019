import * as VehicleService from '../services/vehicleService.js';

// @desc    Get all vehicles
// @route   GET /api/v1/vehicles
// @access  Private
export const getVehicles = async (req, res, next) => {
  try {
    const { province, district, station, isActive } = req.query;
    const filter = {};
    if (province)             filter.province = province;
    if (district)             filter.district = district;
    if (station)              filter.station = station;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const data = await VehicleService.getAllVehicles(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/v1/vehicles/:id
// @access  Private
export const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await VehicleService.getVehicleById(req.params.id);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new vehicle
// @route   POST /api/v1/vehicles
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station } = req.body;
    const vehicle = await VehicleService.createVehicle({
      registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station
    });
    res.status(201)
      .location(`/api/v1/vehicles/${vehicle._id}`)
      .json(vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/v1/vehicles/:id
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await VehicleService.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate vehicle
// @route   PUT /api/v1/vehicles/:id/deactivate
// @access  Private (HQ_ADMIN only)
export const deactivateVehicle = async (req, res, next) => {
  try {
    const vehicle = await VehicleService.deactivateVehicle(req.params.id);
    res.json({ message: 'Vehicle deactivated', vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/v1/vehicles/:id
// @access  Private (HQ_ADMIN only)
export const deleteVehicle = async (req, res, next) => {
  try {
    await VehicleService.deleteVehicle(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};