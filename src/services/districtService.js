import District from '../models/District.js';
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
    new: true,
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
  const district = await District.findByIdAndDelete(id);
  if (!district) {
    throw new APIError(404, 'Not Found', 'District not found');
  }
};
