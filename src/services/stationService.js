import PoliceStation from '../models/PoliceStation.js';
import TukTuk from '../models/TukTuk.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

/**
 * Return paginated list of stations, optionally filtered by province and/or district.
 */
export const getAllStations = async (filter, query) => {
  return getPaginationData(
    PoliceStation,
    query,
    filter,
    [
      { path: 'province', select: 'name code' },
      { path: 'district', select: 'name code' }
    ]
  );
};

/**
 * Return a single station by ID with province and district populated.
 * Throws APIError 404 if not found.
 */
export const getStationById = async (id) => {
  const station = await PoliceStation.findById(id)
    .populate('province', 'name code')
    .populate('district', 'name code');
  if (!station) {
    throw new APIError(404, 'Not Found', 'Station not found');
  }
  return station;
};

/**
 * Create a new police station.
 */
export const createStation = async ({ name, code, district, province, address, contactNumber }) => {
  return PoliceStation.create({ name, code, district, province, address, contactNumber });
};

/**
 * Update an existing station with whitelisted fields.
 * Throws APIError 404 if not found.
 */
export const updateStation = async (id, { name, code, district, province, address, contactNumber }) => {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (code !== undefined) updates.code = code;
  if (district !== undefined) updates.district = district;
  if (province !== undefined) updates.province = province;
  if (address !== undefined) updates.address = address;
  if (contactNumber !== undefined) updates.contactNumber = contactNumber;

  const station = await PoliceStation.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
    runValidators: true
  });
  if (!station) {
    throw new APIError(404, 'Not Found', 'Station not found');
  }
  return station;
};

/**
 * Delete a station by ID.
 * Throws APIError 404 if not found.
 */
export const deleteStation = async (id) => {
  const tuktukCount = await TukTuk.countDocuments({ station: id });
  if (tuktukCount > 0) {
    throw new APIError(409, 'Conflict', 'Cannot delete police station because it has assigned tuktuks');
  }

  const station = await PoliceStation.findByIdAndDelete(id);
  if (!station) {
    throw new APIError(404, 'Not Found', 'Station not found');
  }
};

/**
 * Return a single station by its code (e.g. 'ST001', 'ST002').
 * Throws APIError 404 if not found.
 */
export const getStationByCode = async (code) => {
  const station = await PoliceStation.findOne({ code: code.toUpperCase() })
    .populate('province', 'name code')
    .populate('district', 'name code');
  if (!station) {
    throw new APIError(404, 'Not Found', `Station with code '${code.toUpperCase()}' not found`);
  }
  return station;
};

/**
 * Resolve a station code to an ObjectId filter object.
 */
export const resolveStationFilter = async (code) => {
  const station = await getStationByCode(code);
  return { station: station._id };
};
