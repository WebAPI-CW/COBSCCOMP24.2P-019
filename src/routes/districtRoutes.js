import express from 'express';
import {
  getDistricts, getDistrict, createDistrict, updateDistrict, deleteDistrict,
  getStationsByDistrict
} from '../controllers/districtController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateDistrict, validateDistrictUpdate } from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Districts
 *   description: District management
 */

/**
 * @swagger
 * /api/v1/districts:
 *   get:
 *     summary: Get all districts (paginated)
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           example: WP
 *         description: Filter by province code
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *           example: COL
 *         description: Filter by district code (partial, case-insensitive)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: Colombo
 *         description: Filter by district name (partial, case-insensitive)
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
 *         description: Paginated list of districts
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
 *                     $ref: '#/components/schemas/District'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a district (HQ_ADMIN only)
 *     tags: [Districts]
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
 *               - province
 *             properties:
 *               name:
 *                 type: string
 *                 example: Colombo
 *               code:
 *                 type: string
 *                 example: COL
 *               province:
 *                 type: string
 *                 example: WP
 *                 description: Province code (e.g. WP)
 *     responses:
 *       201:
 *         description: District created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
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
  .head(protect, getDistricts)
  .get(protect, getDistricts)
  .post(protect, authorize('HQ_ADMIN'), validateDistrict, createDistrict);

/**
 * @swagger
 * /api/v1/districts/{code}:
 *   get:
 *     summary: Get a single district by code
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: COL
 *         description: District code (e.g. COL, GAM, KAL)
 *     responses:
 *       200:
 *         description: District details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
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
 *     summary: Update a district (HQ_ADMIN only)
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: COL
 *         description: District code (e.g. COL, GAM, KAL)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Colombo
 *               code:
 *                 type: string
 *                 example: COL
 *               province:
 *                 type: string
 *                 example: WP
 *                 description: Province code (e.g. WP)
 *     responses:
 *       200:
 *         description: District updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
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
 *     summary: Delete a district (HQ_ADMIN only)
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: COL
 *         description: District code (e.g. COL, GAM, KAL)
 *     responses:
 *       204:
 *         description: District deleted — no content returned
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
router.route('/:code')
  .head(protect, getDistrict)
  .get(protect, getDistrict)
  .patch(protect, authorize('HQ_ADMIN'), validateDistrictUpdate, updateDistrict)
  .delete(protect, authorize('HQ_ADMIN'), deleteDistrict);

/**
 * @swagger
 * /api/v1/districts/{code}/police-stations:
 *   get:
 *     summary: Get all police stations in a district (nested resource)
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: COL
 *         description: District code
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: name:asc
 *         description: Sort field and direction (e.g. name:asc, createdAt:desc)
 *     responses:
 *       200:
 *         description: Paginated list of police stations in this district
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:code/police-stations', protect, getStationsByDistrict);

export default router;