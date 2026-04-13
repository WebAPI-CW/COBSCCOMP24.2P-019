import express from 'express';
import {
  getProvinces,
  getProvince,
  createProvince,
  updateProvince,
  deleteProvince
} from '../controllers/provinceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getProvinces)
  .post(protect, authorize('HQ_ADMIN'), createProvince);

router.route('/:id')
  .get(protect, getProvince)
  .put(protect, authorize('HQ_ADMIN'), updateProvince)
  .delete(protect, authorize('HQ_ADMIN'), deleteProvince);

export default router;