import express from 'express';
import {
  getLiveLocations,
  getInactiveTukTuks,
  getAllLocationHistory,
  getSpeedAnomalies,
  getLocationSummary
} from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Real-time tracking, live map view, location history and investigative logging
 */

/**
 * @swagger
 * /api/v1/locations/live:
 *   get:
 *     summary: Get all active tuktuk live positions (paginated)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           example: WP
 *         description: Filter by province code (e.g. WP)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: COL
 *         description: Filter by district code (e.g. COL)
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
 *           example: CF
 *         description: Filter by station code (e.g. CF)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated live positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 next:
 *                   type: string
 *                   nullable: true
 *                 previous:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tukTuk:
 *                         $ref: '#/components/schemas/TukTuk'
 *                       lastLocation:
 *                         $ref: '#/components/schemas/LocationPing'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/live', protect, authorize('HQ_ADMIN', 'PROVINCIAL', 'STATION'), getLiveLocations);

/**
 * @swagger
 * /api/v1/locations/inactive:
 *   get:
 *     summary: Get tuktuks that have not pinged recently (signal lost detection)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Consider a tuktuk inactive if no ping in this many hours
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           example: WP
 *         description: Filter by province code (e.g. WP)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: COL
 *         description: Filter by district code (e.g. COL)
 *     responses:
 *       200:
 *         description: List of inactive tuktuks with last known position and status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cutoffHours:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tukTuk:
 *                         $ref: '#/components/schemas/TukTuk'
 *                       lastLocation:
 *                         $ref: '#/components/schemas/LocationPing'
 *                       hoursSinceLastPing:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [signal_lost, never_pinged]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/inactive', protect, authorize('HQ_ADMIN', 'PROVINCIAL', 'STATION'), getInactiveTukTuks);

/**
 * @swagger
 * /api/v1/locations/history:
 *   get:
 *     summary: Get location pings across ALL tuktuks in a time window (investigative)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of time window (ISO 8601)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of time window (ISO 8601)
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           example: WP
 *         description: Filter by province code (e.g. WP)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: COL
 *         description: Filter by district code (e.g. COL)
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
 *           example: CF
 *         description: Filter by station code (e.g. CF)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated pings for all tuktuks in the time window
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeWindow:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       format: date-time
 *                     to:
 *                       type: string
 *                       format: date-time
 *                 page:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationPing'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/history', protect, authorize('HQ_ADMIN', 'PROVINCIAL', 'STATION'), getAllLocationHistory);

/**
 * @swagger
 * /api/v1/locations/anomalies:
 *   get:
 *     summary: Get pings where tuktuk speed exceeded a threshold (anomaly detection)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: speedThreshold
 *         schema:
 *           type: number
 *           default: 70
 *         description: Speed in km/h above which a ping is considered anomalous
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           example: WP
 *         description: Filter by province code (e.g. WP)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: COL
 *         description: Filter by district code (e.g. COL)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated list of speed anomaly pings with tuktuk info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationPing'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/anomalies', protect, authorize('HQ_ADMIN', 'PROVINCIAL', 'STATION'), getSpeedAnomalies);

/**
 * @swagger
 * /api/v1/locations/summary:
 *   get:
 *     summary: Get active tuktuk count grouped by province (only counts active vehicles)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TukTuk summary by province
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 byProvince:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       province:
 *                         type: string
 *                       code:
 *                         type: string
 *                       activeTukTuks:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/summary', protect, authorize('HQ_ADMIN', 'PROVINCIAL', 'STATION'), getLocationSummary);

export default router;