import User from '../models/User.js';
import { APIError } from '../utils/apiError.js';


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
