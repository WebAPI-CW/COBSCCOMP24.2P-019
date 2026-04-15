import express from 'express';
import {
  postPing,
  getLastLocation,
  getLocationHistory,
  getLiveLocations
} from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// live view of all vehicles
router.get('/live', protect, getLiveLocations);

export default router;