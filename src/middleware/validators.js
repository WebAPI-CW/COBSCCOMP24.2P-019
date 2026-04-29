import { body, validationResult } from 'express-validator';
import { APIError } from '../utils/apiError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new APIError(400, 'Bad Request', errors.array()[0].msg));
  }
  next();
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['HQ_ADMIN', 'PROVINCIAL', 'STATION', 'DEVICE']).withMessage('Invalid role'),
  body('registrationNumber').optional().notEmpty().withMessage('Registration number cannot be empty'),
  validateRequest
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// ─── Province ─────────────────────────────────────────────────────────────────

// POST — all required
export const validateProvince = [
  body('name').notEmpty().withMessage('Province name is required'),
  body('code').notEmpty().withMessage('Province code is required'),
  validateRequest
];

// PUT — all fields optional for partial updates
export const validateProvinceUpdate = [
  body('name').optional().notEmpty().withMessage('Province name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Province code cannot be empty'),
  validateRequest
];

// ─── District ─────────────────────────────────────────────────────────────────

// POST — all required
export const validateDistrict = [
  body('name').notEmpty().withMessage('District name is required'),
  body('code').notEmpty().withMessage('District code is required'),
  body('province').notEmpty().withMessage('Province code is required'),
  validateRequest
];

// PUT — all fields optional for partial updates
export const validateDistrictUpdate = [
  body('name').optional().notEmpty().withMessage('District name cannot be empty'),
  body('code').optional().notEmpty().withMessage('District code cannot be empty'),
  body('province').optional().notEmpty().withMessage('Province code cannot be empty'),
  validateRequest
];

// ─── Station ──────────────────────────────────────────────────────────────────

// POST — name, code, district, province required
export const validateStation = [
  body('name').notEmpty().withMessage('Station name is required'),
  body('code').notEmpty().withMessage('Station code is required'),
  body('district').notEmpty().withMessage('District code is required'),
  body('province').notEmpty().withMessage('Province code is required'),
  validateRequest
];

// PUT — all fields optional for partial updates
export const validateStationUpdate = [
  body('name').optional().notEmpty().withMessage('Station name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Station code cannot be empty'),
  body('district').optional().notEmpty().withMessage('District code cannot be empty'),
  body('province').optional().notEmpty().withMessage('Province code cannot be empty'),
  validateRequest
];

// ─── TukTuk ──────────────────────────────────────────────────────────────────

// POST — all required
export const validateTukTuk = [
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('driverName').notEmpty().withMessage('Driver name is required'),
  body('driverNIC').notEmpty().withMessage('Driver NIC is required'),
  body('province').notEmpty().withMessage('Province code is required'),
  body('district').notEmpty().withMessage('District code is required'),
  body('station').notEmpty().withMessage('Station code is required'),
  validateRequest
];

// PUT — all fields optional for partial updates
export const validateTukTukUpdate = [
  body('registrationNumber').optional().notEmpty().withMessage('Registration number cannot be empty'),
  body('deviceId').optional().notEmpty().withMessage('Device ID cannot be empty'),
  body('driverName').optional().notEmpty().withMessage('Driver name cannot be empty'),
  body('driverNIC').optional().notEmpty().withMessage('Driver NIC cannot be empty'),
  body('province').optional().notEmpty().withMessage('Province code cannot be empty'),
  body('district').optional().notEmpty().withMessage('District code cannot be empty'),
  body('station').optional().notEmpty().withMessage('Station code cannot be empty'),
  validateRequest
];

// ─── Location Ping ────────────────────────────────────────────────────────────

export const validatePing = [
  body('latitude').isFloat({ min: 5.9, max: 9.9 }).withMessage('Valid latitude for Sri Lanka is required (5.9 – 9.9)'),
  body('longitude').isFloat({ min: 79.7, max: 81.9 }).withMessage('Valid longitude for Sri Lanka is required (79.7 – 81.9)'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be a non-negative number'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  validateRequest
];
