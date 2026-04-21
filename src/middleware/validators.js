import { body, validationResult } from 'express-validator';
import { APIError } from '../utils/apiError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error's message
    return next(new APIError(400, 'Bad Request', errors.array()[0].msg));
  }
  next();
};

// Auth Validations
export const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['HQ_ADMIN', 'PROVINCIAL', 'STATION', 'DEVICE']).withMessage('Invalid role'),
  validateRequest
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Boundary Validations
export const validateProvince = [
  body('name').notEmpty().withMessage('Province name is required'),
  body('code').notEmpty().withMessage('Province code is required'),
  validateRequest
];

export const validateDistrict = [
  body('name').notEmpty().withMessage('District name is required'),
  body('code').notEmpty().withMessage('District code is required'),
  body('province').notEmpty().isMongoId().withMessage('Valid province ID is required'),
  validateRequest
];

export const validateStation = [
  body('name').notEmpty().withMessage('Station name is required'),
  body('code').notEmpty().withMessage('Station code is required'),
  body('district').notEmpty().isMongoId().withMessage('Valid district ID is required'),
  body('province').notEmpty().isMongoId().withMessage('Valid province ID is required'),
  validateRequest
];

// Vehicle Validations — POST (all required)
export const validateVehicle = [
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('driverName').notEmpty().withMessage('Driver name is required'),
  body('driverNIC').notEmpty().withMessage('Driver NIC is required'),
  body('province').notEmpty().isMongoId().withMessage('Valid province ID is required'),
  body('district').notEmpty().isMongoId().withMessage('Valid district ID is required'),
  body('station').notEmpty().isMongoId().withMessage('Valid station ID is required'),
  validateRequest
];

// Vehicle Validations — PUT (all fields optional for partial update)
export const validateVehicleUpdate = [
  body('registrationNumber').optional().notEmpty().withMessage('Registration number cannot be empty'),
  body('deviceId').optional().notEmpty().withMessage('Device ID cannot be empty'),
  body('driverName').optional().notEmpty().withMessage('Driver name cannot be empty'),
  body('driverNIC').optional().notEmpty().withMessage('Driver NIC cannot be empty'),
  body('province').optional().isMongoId().withMessage('Valid province ID required'),
  body('district').optional().isMongoId().withMessage('Valid district ID required'),
  body('station').optional().isMongoId().withMessage('Valid station ID required'),
  validateRequest
];

// Location Ping Validation
export const validatePing = [
  body('latitude').isFloat({ min: 5.9, max: 9.9 }).withMessage('Valid latitude for Sri Lanka is required'),
  body('longitude').isFloat({ min: 79.7, max: 81.9 }).withMessage('Valid longitude for Sri Lanka is required'),
  body('speed').optional().isFloat().withMessage('Speed must be a number'),
  body('heading').optional().isFloat().withMessage('Heading must be a number'),
  validateRequest
];
