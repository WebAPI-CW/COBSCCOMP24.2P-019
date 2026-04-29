import User from '../models/User.js';
import { APIError } from '../utils/apiError.js';
import { getPaginationData } from '../utils/paginationHelper.js';

const POPULATE_OPTS = [
  { path: 'province', select: 'name code' },
  { path: 'district', select: 'name code' },
  { path: 'station',  select: 'name code' }
];

/**
 * Return paginated list of users with optional role/isActive filters.
 * Passwords are excluded from all results.
 */
export const getAllUsers = async (filter, query) => {
  const result = await getPaginationData(User, query, filter, POPULATE_OPTS);
  result.data = result.data.map(u => {
    const obj = u.toObject();
    delete obj.password;
    return obj;
  });
  return result;
};

/**
 * Return a single user by ID with populated fields, no password.
 * Throws APIError 404 if not found.
 */
export const getUserById = async (id) => {
  const user = await User.findById(id)
    .select('-password -__v')
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station',  'name code');
  if (!user) {
    throw new APIError(404, 'Not Found', 'User not found');
  }
  return user;
};

/**
 * Create a new user.
 * Throws APIError 409 if email already exists.
 */
export const createUser = async ({ name, email, password, role, province, district, station, registrationNumber }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new APIError(409, 'Conflict', 'User already exists');
  }

  const user = await User.create({ name, email, password, role, province, district, station, registrationNumber });
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Update a user — whitelisted fields only.
 * Password changes are blocked here; use a dedicated change-password endpoint.
 * Throws APIError 404 if not found.
 */
export const updateUser = async (id, body) => {
  const { name, email, role, province, district, station, isActive, registrationNumber } = body;

  const current = await User.findById(id);
  if (!current) {
    throw new APIError(404, 'Not Found', 'User not found');
  }

  if (isActive !== undefined && isActive === current.isActive) {
    throw new APIError(400, 'Bad Request', `User is already ${isActive ? 'active' : 'inactive'}`);
  }

  const updates = {};
  if (name     !== undefined) updates.name     = name;
  if (email    !== undefined) updates.email    = email;
  if (role     !== undefined) updates.role     = role;
  if (province !== undefined) updates.province = province;
  if (district !== undefined) updates.district = district;
  if (station  !== undefined) updates.station  = station;
  if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
    runValidators: true
  }).select('-password -__v');

  if (!user) {
    throw new APIError(404, 'Not Found', 'User not found');
  }
  return user;
};

/**
 * Return a single user by email address.
 * Throws APIError 404 if not found.
 */
export const getUserByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('-password -__v')
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station',  'name code');
  if (!user) {
    throw new APIError(404, 'Not Found', 'User not found');
  }
  return user;
};
