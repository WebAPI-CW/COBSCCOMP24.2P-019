import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { APIError } from '../utils/apiError.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new APIError(401, 'Unauthorized', 'Not authorized, no token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return next(new APIError(401, 'Unauthorized', 'User not found'));
    }
    if (!req.user.isActive) {
      return next(new APIError(401, 'Unauthorized', 'Account has been deactivated'));
    }
    next();
  } catch (error) {
    return next(new APIError(401, 'Unauthorized', 'Not authorized, token failed'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new APIError(403, 'Forbidden', `Role ${req.user.role} is not authorized`));
    }
    next();
  };
};