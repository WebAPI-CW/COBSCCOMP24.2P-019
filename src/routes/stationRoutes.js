import express from 'express';
import {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation
} from '../controllers/stationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getStations)
  .post(protect, authorize('HQ_ADMIN'), createStation);

router.route('/:id')
  .get(protect, getStation)
  .put(protect, authorize('HQ_ADMIN'), updateStation)
  .delete(protect, authorize('HQ_ADMIN'), deleteStation);

export default router;