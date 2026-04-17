import express from 'express';
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deactivateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getVehicles)
  .post(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), createVehicle);

router.route('/:id')
  .get(protect, getVehicle)
  .put(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), updateVehicle)
  .delete(protect, authorize('HQ_ADMIN'), deleteVehicle);

router.put('/:id/deactivate', protect, authorize('HQ_ADMIN'), deactivateVehicle);
router.post('/:id/ping', protect, authorize('DEVICE'), postPing);
router.get('/:id/location', protect, getLastLocation);
router.get('/:id/history', protect, getLocationHistory);


export default router;