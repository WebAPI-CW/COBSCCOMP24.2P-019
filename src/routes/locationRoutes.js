import express from 'express';
import {
  postPing,
  getLastLocation,
  getLocationHistory,
  getLiveLocations
} from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Global live tracking across the system
 */

/**
 * @swagger
 * /api/v1/locations/live:
 *   get:
 *     summary: Get all active live vehicle locations globally
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Global live positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vehicle:
 *                         $ref: '#/components/schemas/Vehicle'
 *                       lastLocation:
 *                         $ref: '#/components/schemas/LocationPing'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/live', protect, getLiveLocations);

export default router;