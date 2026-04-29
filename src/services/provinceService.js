import Province from '../models/Province.js';
import District from '../models/District.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

/**
 * Return paginated list of provinces.
 */
export const getAllProvinces = async (filter, query) => {
  return getPaginationData(Province, query, filter);
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
    returnDocument: 'after',
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
  const districtCount = await District.countDocuments({ province: id });
  if (districtCount > 0) {
    throw new APIError(409, 'Conflict', 'Cannot delete province because it has assigned districts');
  }

  const province = await Province.findByIdAndDelete(id);
  if (!province) {
    throw new APIError(404, 'Not Found', 'Province not found');
  }
};

/**
 * Return a single province by its code (e.g. 'WP', 'CP').
 * Throws APIError 404 if not found.
 */
export const getProvinceByCode = async (code) => {
  const province = await Province.findOne({ code: code.toUpperCase() });
  if (!province) {
    throw new APIError(404, 'Not Found', `Province with code '${code.toUpperCase()}' not found`);
  }
  return province;
};

/**
 * Resolve a province code to an ObjectId filter object.
 * Used by child-resource controllers to filter by province code.
 */
export const resolveProvinceFilter = async (code) => {
  const province = await getProvinceByCode(code);
  return { province: province._id };
};
