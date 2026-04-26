import TukTuk from '../models/TukTuk.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

const POPULATE_OPTS = [
  { path: 'province', select: 'name code' },
  { path: 'district', select: 'name code' },
  { path: 'station', select: 'name code' }
];

/**
 * Return paginated list of tuktuks with optional filters.
 */
export const getAllTukTuks = async (filter, query) => {
  return getPaginationData(TukTuk, query, filter, POPULATE_OPTS);
};

/**
 * Return a single tuktuk by ID.
 * Throws APIError 404 if not found.
 */
export const getTukTukById = async (id) => {
  const tukTuk = await TukTuk.findById(id)
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station', 'name code');
  if (!tukTuk) {
    throw new APIError(404, 'Not Found', 'TukTuk not found');
  }
  return tukTuk;
};

/**
 * Register a new tuktuk.
 * Throws APIError 400 if registrationNumber, deviceId, or driverNIC already exists.
 */
export const createTukTuk = async ({
  registrationNumber, deviceId, driverName, driverNIC,
  driverContact, province, district, station
}) => {
  const existing = await TukTuk.findOne({
    $or: [{ registrationNumber }, { deviceId }, { driverNIC }]
  });
  if (existing) {
    throw new APIError(
      409,
      'Conflict',
      'TukTuk with same registration number, device ID, or NIC already exists'
    );
  }
  return TukTuk.create({
    registrationNumber, deviceId, driverName, driverNIC,
    driverContact, province, district, station
  });
};

/**
 * Update a tuktuk — only whitelisted fields are applied (prevents mass assignment).
 * Throws APIError 404 if not found.
 */
export const updateTukTuk = async (id, body) => {
  const { registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station, isActive } = body;

  const current = await TukTuk.findById(id);
  if (!current) {
    throw new APIError(404, 'Not Found', 'TukTuk not found');
  }

  if (isActive !== undefined && isActive === current.isActive) {
    throw new APIError(400, 'Bad Request', `TukTuk is already ${isActive ? 'active' : 'inactive'}`);
  }

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
  if (isActive !== undefined) updates.isActive = isActive;

  const tukTuk = await TukTuk.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
  return tukTuk;
};



/**
 * Hard-delete a tuktuk by ID.
 * Throws APIError 404 if not found.
 */
export const deleteTukTuk = async (id) => {
  const tukTuk = await TukTuk.findByIdAndDelete(id);
  if (!tukTuk) {
    throw new APIError(404, 'Not Found', 'TukTuk not found');
  }
};
