import express from 'express';
import {
  getDistricts,
  getDistrict,
  createDistrict,
  updateDistrict,
  deleteDistrict
} from '../controllers/districtController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getDistricts)
  .post(protect, authorize('HQ_ADMIN'), createDistrict);

router.route('/:id')
  .get(protect, getDistrict)
  .put(protect, authorize('HQ_ADMIN'), updateDistrict)
  .delete(protect, authorize('HQ_ADMIN'), deleteDistrict);

export default router;