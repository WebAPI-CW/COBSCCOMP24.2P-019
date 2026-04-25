import Province from '../models/Province.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

/**
 * Return paginated list of provinces.
 */
export const getAllProvinces = async (query) => {
  return getPaginationData(Province, query);
};

/**
 * Return a single province by ID.
 * Throws APIError 404 if not found.
 */
export const getProvinceById = async (id) => {
  const province = await Province.findById(id);
  if (!province) {
    throw new APIError(404, 'Not Found', 'Province not found');
  }
  return province;
};

/**
 * Create a new province.
 */
export const createProvince = async ({ name, code }) => {
  return Province.create({ name, code });
};

/**
 * Update an existing province with whitelisted fields.
 * Throws APIError 404 if not found.
 */
export const updateProvince = async (id, { name, code }) => {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (code !== undefined) updates.code = code;

  const province = await Province.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
  if (!province) {
    throw new APIError(404, 'Not Found', 'Province not found');
  }
  return province;
};

/**
 * Delete a province by ID.
 * Throws APIError 404 if not found.
 */
export const deleteProvince = async (id) => {
  const province = await Province.findByIdAndDelete(id);
  if (!province) {
    throw new APIError(404, 'Not Found', 'Province not found');
  }
};
