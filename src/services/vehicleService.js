import Vehicle from '../models/Vehicle.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

const POPULATE_OPTS = [
  { path: 'province', select: 'name code' },
  { path: 'district', select: 'name code' },
  { path: 'station', select: 'name code' }
];

/**
 * Return paginated list of vehicles with optional filters.
 */
export const getAllVehicles = async (filter, query) => {
  return getPaginationData(Vehicle, query, filter, POPULATE_OPTS);
};

/**
 * Return a single vehicle by ID.
 * Throws APIError 404 if not found.
 */
export const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findById(id)
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station', 'name code');
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }
  return vehicle;
};

/**
 * Register a new vehicle.
 * Throws APIError 400 if registrationNumber, deviceId, or driverNIC already exists.
 */
export const createVehicle = async ({
  registrationNumber, deviceId, driverName, driverNIC,
  driverContact, province, district, station
}) => {
  const existing = await Vehicle.findOne({
    $or: [{ registrationNumber }, { deviceId }, { driverNIC }]
  });
  if (existing) {
    throw new APIError(
      400,
      'Bad Request',
      'Vehicle with same registration number, device ID, or NIC already exists'
    );
  }
  return Vehicle.create({
    registrationNumber, deviceId, driverName, driverNIC,
    driverContact, province, district, station
  });
};

/**
 * Update a vehicle — only whitelisted fields are applied (prevents mass assignment).
 * Throws APIError 404 if not found.
 */
export const updateVehicle = async (id, body) => {
  const { registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station } = body;

  // Build update object with only the fields that were actually supplied
  const updates = {};
  if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
  if (deviceId !== undefined) updates.deviceId = deviceId;
  if (driverName !== undefined) updates.driverName = driverName;
  if (driverNIC !== undefined) updates.driverNIC = driverNIC;
  if (driverContact !== undefined) updates.driverContact = driverContact;
  if (province !== undefined) updates.province = province;
  if (district !== undefined) updates.district = district;
  if (station !== undefined) updates.station = station;

  const vehicle = await Vehicle.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }
  return vehicle;
};

/**
 * Set a vehicle's isActive flag to false.
 * Throws APIError 404 if not found.
 */
export const deactivateVehicle = async (id) => {
  const vehicle = await Vehicle.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }
  return vehicle;
};

/**
 * Hard-delete a vehicle by ID.
 * Throws APIError 404 if not found.
 */
export const deleteVehicle = async (id) => {
  const vehicle = await Vehicle.findByIdAndDelete(id);
  if (!vehicle) {
    throw new APIError(404, 'Not Found', 'Vehicle not found');
  }
};
