import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { APIError } from '../utils/apiError.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private (HQ_ADMIN only)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, province, district, station } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new APIError(400, 'Bad Request', 'User already exists'));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      province,
      district,
      station
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return next(new APIError(401, 'Unauthorized', 'Invalid email or password'));
    }

    if (!user.isActive) {
      return next(new APIError(401, 'Unauthorized', 'Account is deactivated'));
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(new APIError(500, 'Internal Server Error', error.message));
  }
};