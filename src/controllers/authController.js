import * as AuthService from '../services/authService.js';
import generateToken from '../utils/generateToken.js';


// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.loginUser(email, password);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.user._id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};