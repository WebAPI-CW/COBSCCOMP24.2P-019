import express from 'express';
import {
  getTukTuks,
  getTukTuk,
  createTukTuk,
  updateTukTuk,
  deleteTukTuk
} from '../controllers/tuktukController.js';
import {
  postPing,
  getLastLocation,
  getLocationHistory,
  getTukTukSummary
} from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateTukTuk, validateTukTukUpdate, validatePing } from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TukTuks
 *   description: TukTuk management and registration
 */

/**
 * @swagger
 * /api/v1/tuktuks:
 *   get:
 *     summary: Get all tuktuks
 *     tags: [TukTuks]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: registrationNumber
 *         schema:
 *           type: string
 *         description: Search by registration number (partial, case-insensitive)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: registrationNumber:asc
 *         description: Sort field and direction (e.g. registrationNumber:asc, createdAt:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of tuktuks
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
 *                     $ref: '#/components/schemas/TukTuk'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Register a new tuktuk
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - deviceId
 *               - driverName
 *               - driverNIC
 *               - province
 *               - district
 *               - station
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: WP-0001
 *               deviceId:
 *                 type: string
 *                 example: DEV-0001
 *               driverName:
 *                 type: string
 *                 example: Kamal Perera
 *               driverNIC:
 *                 type: string
 *                 example: 198500100001V
 *               driverContact:
 *                 type: string
 *                 example: '0771234567'
 *               province:
 *                 type: string
 *                 example: WP
 *                 description: Province code (e.g. WP)
 *               district:
 *                 type: string
 *                 example: COL
 *                 description: District code (e.g. COL)
 *               station:
 *                 type: string
 *                 example: CF
 *                 description: Station code (e.g. CF)
 *     responses:
 *       201:
 *         description: TukTuk created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TukTuk'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/')
  .head(protect, getTukTuks)
  .get(protect, getTukTuks)
  .post(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), validateTukTuk, createTukTuk);

/**
 * @swagger
 * /api/v1/tuktuks/{registrationNumber}:
 *   get:
 *     summary: Get a single tuktuk by registration number
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: TukTuk details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TukTuk'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   patch:
 *     summary: Update a tuktuk (HQ_ADMIN, PROVINCIAL)
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *         description: Vehicle registration number
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: WP-0001
 *               deviceId:
 *                 type: string
 *               driverName:
 *                 type: string
 *               driverNIC:
 *                 type: string
 *               driverContact:
 *                 type: string
 *               province:
 *                 type: string
 *                 example: WP
 *                 description: Province code
 *               district:
 *                 type: string
 *                 example: COL
 *                 description: District code
 *               station:
 *                 type: string
 *                 example: CF
 *                 description: Station code
 *               isActive:
 *                 type: boolean
 *                 description: HQ_ADMIN only
 *     responses:
 *       200:
 *         description: TukTuk updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TukTuk'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Delete a tuktuk (HQ_ADMIN only)
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *         description: Vehicle registration number
 *     responses:
 *       204:
 *         description: TukTuk deleted — no content returned
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/:registrationNumber')
  .head(protect, getTukTuk)
  .get(protect, getTukTuk)
  .patch(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), validateTukTukUpdate, updateTukTuk)
  .delete(protect, authorize('HQ_ADMIN'), deleteTukTuk);


/**
 * @swagger
 * /api/v1/tuktuks/{registrationNumber}/ping:
 *   post:
 *     summary: Post a location ping from a device
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *         description: Vehicle registration number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Location ping recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationPing'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:registrationNumber/ping', protect, authorize('DEVICE'), validatePing, postPing);

/**
 * @swagger
 * /api/v1/tuktuks/{registrationNumber}/location:
 *   get:
 *     summary: Get last known location of a tuktuk
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *     responses:
 *       200:
 *         description: Last known location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tukTuk:
 *                   $ref: '#/components/schemas/TukTuk'
 *                 lastLocation:
 *                   $ref: '#/components/schemas/LocationPing'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:registrationNumber/location', protect, getLastLocation);

/**
 * @swagger
 * /api/v1/tuktuks/{registrationNumber}/history:
 *   get:
 *     summary: Get location history of a tuktuk
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
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
 *           default: 100
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *           example: latitude,longitude,timestamp
 *         description: >-
 *           Comma-separated list of fields to include in each ping object.
 *           Allowed: latitude, longitude, speed, heading, timestamp,
 *           batteryLevel, signalStrength, isEngineOn, passengerCount.
 *           Omit to receive all fields.
 *     responses:
 *       200:
 *         description: Paginated location history
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
 *                     $ref: '#/components/schemas/LocationPing'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:registrationNumber/history', protect, getLocationHistory);

/**
 * @swagger
 * /api/v1/tuktuks/{registrationNumber}/summary:
 *   get:
 *     summary: Get movement summary for a tuktuk (distance, duration, speed stats)
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: WP-0001
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of time window (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of time window (ISO 8601)
 *     responses:
 *       200:
 *         description: Movement summary with distance, speed and duration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tukTuk:
 *                   $ref: '#/components/schemas/TukTuk'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPings:
 *                       type: integer
 *                     firstSeen:
 *                       type: string
 *                       format: date-time
 *                     lastSeen:
 *                       type: string
 *                       format: date-time
 *                     durationHours:
 *                       type: number
 *                     approximateDistanceKm:
 *                       type: number
 *                     averageSpeedKmph:
 *                       type: number
 *                     maxSpeedKmph:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:registrationNumber/summary', protect, getTukTukSummary);

export default router;