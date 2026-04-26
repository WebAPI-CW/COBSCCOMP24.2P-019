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
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
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
 *                 total:
 *                   type: integer
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
 *                 example: 60d0fe4f5311236168a109ca
 *               district:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               station:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cc
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
  .get(protect, getTukTuks)
  .post(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), validateTukTuk, createTukTuk);

/**
 * @swagger
 * /api/v1/tuktuks/{id}:
 *   get:
 *     summary: Get a standard tuktuk
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.route('/:id')
  .get(protect, getTukTuk)
  .patch(protect, authorize('HQ_ADMIN', 'PROVINCIAL'), validateTukTukUpdate, updateTukTuk)
  .delete(protect, authorize('HQ_ADMIN'), deleteTukTuk);


/**
 * @swagger
 * /api/v1/tuktuks/{id}/ping:
 *   post:
 *     summary: Post a location ping from a device
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.post('/:id/ping', protect, authorize('DEVICE'), validatePing, postPing);

/**
 * @swagger
 * /api/v1/tuktuks/{id}/location:
 *   get:
 *     summary: Get last known location of a tuktuk
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/location', protect, getLastLocation);

/**
 * @swagger
 * /api/v1/tuktuks/{id}/history:
 *   get:
 *     summary: Get location history of a tuktuk
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationPing'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/history', protect, getLocationHistory);

/**
 * @swagger
 * /api/v1/tuktuks/{id}/summary:
 *   get:
 *     summary: Get movement summary for a tuktuk (distance, duration, speed stats)
 *     tags: [TukTuks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/summary', protect, getTukTukSummary);

export default router;