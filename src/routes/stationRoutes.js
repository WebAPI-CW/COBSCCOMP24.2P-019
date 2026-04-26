import express from 'express';
import {
  getStations, getStation, createStation, updateStation, deleteStation
} from '../controllers/stationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateStation, validateStationUpdate } from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Police Stations
 *   description: Police Station management
 */

/**
 * @swagger
 * /api/v1/police-stations:
 *   get:
 *     summary: Get all police stations (paginated)
 *     tags: [Police Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Filter by province ID
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter by district ID
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
 *         description: Paginated list of stations
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
 *                     $ref: '#/components/schemas/PoliceStation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a station (HQ_ADMIN only)
 *     tags: [Police Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - district
 *               - province
 *             properties:
 *               name:
 *                 type: string
 *                 example: Colombo Fort Police Station
 *               code:
 *                 type: string
 *                 example: CF
 *               district:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               province:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *               address:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PoliceStation'
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
  .get(protect, getStations)
  .post(protect, authorize('HQ_ADMIN'), validateStation, createStation);

/**
 * @swagger
 * /api/v1/police-stations/{id}:
 *   get:
 *     summary: Get a single station by ID
 *     tags: [Police Stations]
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
 *         description: Station details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PoliceStation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   patch:
 *     summary: Update a station (HQ_ADMIN only)
 *     tags: [Police Stations]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               district:
 *                 type: string
 *               province:
 *                 type: string
 *               address:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PoliceStation'
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
 *     summary: Delete a station (HQ_ADMIN only)
 *     tags: [Police Stations]
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
 *         description: Station deleted — no content returned
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
  .get(protect, getStation)
  .patch(protect, authorize('HQ_ADMIN'), validateStationUpdate, updateStation)
  .delete(protect, authorize('HQ_ADMIN'), deleteStation);

export default router;