import User from '../models/User.js';
import { APIError } from '../utils/apiError.js';

/**
 * Register a new user.
 * Throws APIError 400 if email already exists.
 */
export const registerUser = async ({ name, email, password, role, province, district, station }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new APIError(400, 'Bad Request', 'User already exists');
  }

  const user = await User.create({ name, email, password, role, province, district, station });
  return user;
};

/**
 * Validate credentials and return the user document.
 * Throws APIError 401 for invalid credentials or deactivated account.
 */
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new APIError(401, 'Unauthorized', 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new APIError(401, 'Unauthorized', 'Account is deactivated');
  }
  return user;
};

/**
 * Return current user with all refs populated.
 * Throws APIError 404 if user no longer exists.
 */
export const getUserById = async (id) => {
  const user = await User.findById(id)
    .select('-password -__v')
    .populate('province', 'name code')
    .populate('district', 'name code')
    .populate('station', 'name code');

  if (!user) {
    throw new APIError(404, 'Not Found', 'User not found');
  }
  return user;
};
