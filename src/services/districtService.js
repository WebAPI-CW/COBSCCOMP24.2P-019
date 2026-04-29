import District from '../models/District.js';
import PoliceStation from '../models/PoliceStation.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

/**
 * Return paginated list of districts, optionally filtered by province.
 */
export const getAllDistricts = async (filter, query) => {
  return getPaginationData(
    District,
    query,
    filter,
    { path: 'province', select: 'name code' }
  );
};

/**
 * Return a single district by ID with province populated.
 * Throws APIError 404 if not found.
 */
export const getDistrictById = async (id) => {
  const district = await District.findById(id).populate('province', 'name code');
  if (!district) {
    throw new APIError(404, 'Not Found', 'District not found');
  }
  return district;
};

/**
 * Create a new district.
 */
export const createDistrict = async ({ name, code, province }) => {
  return District.create({ name, code, province });
};

/**
 * Update an existing district with whitelisted fields.
 * Throws APIError 404 if not found.
 */
export const updateDistrict = async (id, { name, code, province }) => {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (code !== undefined) updates.code = code;
  if (province !== undefined) updates.province = province;

  const district = await District.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
    runValidators: true
  });
  if (!district) {
    throw new APIError(404, 'Not Found', 'District not found');
  }
  return district;
};

/**
 * Delete a district by ID.
 * Throws APIError 404 if not found.
 */
export const deleteDistrict = async (id) => {
  const stationCount = await PoliceStation.countDocuments({ district: id });
  if (stationCount > 0) {
    throw new APIError(409, 'Conflict', 'Cannot delete district because it has assigned police stations');
  }

  const district = await District.findByIdAndDelete(id);
  if (!district) {
    throw new APIError(404, 'Not Found', 'District not found');
  }
};

/**
 * Return a single district by its code (e.g. 'COL', 'GAM').
 * Throws APIError 404 if not found.
 */
export const getDistrictByCode = async (code) => {
  const district = await District.findOne({ code: code.toUpperCase() })
    .populate('province', 'name code');
  if (!district) {
    throw new APIError(404, 'Not Found', `District with code '${code.toUpperCase()}' not found`);
  }
  return district;
};

/**
 * Resolve a district code to an ObjectId filter object.
 */
export const resolveDistrictFilter = async (code) => {
  const district = await getDistrictByCode(code);
  return { district: district._id };
};
