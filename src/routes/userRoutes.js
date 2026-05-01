import express from 'express';
import { getUsers, getUser, createUser, updateUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRegister } from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management (HQ_ADMIN only)
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [HQ_ADMIN, PROVINCIAL, STATION, DEVICE]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           example: officer@slpolice.lk
 *         description: Filter by email (partial, case-insensitive)
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
 *         description: Paginated list of users (passwords excluded)
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new user (HQ_ADMIN only)
 *     tags: [Users]
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [HQ_ADMIN, PROVINCIAL, STATION, DEVICE]
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
 *                 example: ST001
 *                 description: Station code (e.g. ST001)
 *               registrationNumber:
 *                 type: string
 *                 example: WP-0001
 *                 description: Linked tuk-tuk registration number (DEVICE role only)
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
  .head(protect, authorize('HQ_ADMIN'), getUsers)
  .get(protect, authorize('HQ_ADMIN'), getUsers)
  .post(protect, authorize('HQ_ADMIN'), validateRegister, createUser);

/**
 * @swagger
 * /api/v1/users/{email}:
 *   get:
 *     summary: Get a single user by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           example: officer@slpolice.lk
 *         description: User email address (URL-encode the @ sign as %40)
 *     responses:
 *       200:
 *         description: User details (password excluded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *     summary: Update a user (name, email, role, assignment)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           example: officer@slpolice.lk
 *         description: User email address (URL-encode the @ sign as %40)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [HQ_ADMIN, PROVINCIAL, STATION, DEVICE]
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
 *                 example: ST001
 *                 description: Station code (e.g. ST001)
 *               registrationNumber:
 *                 type: string
 *                 example: WP-0001
 *                 description: Linked tuk-tuk registration number (DEVICE role only)
 *               isActive:
 *                 type: boolean
 *                 description: Activate or deactivate the user account
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 */
router.route('/:email')
  .head(protect, authorize('HQ_ADMIN'), getUser)
  .get(protect, authorize('HQ_ADMIN'), getUser)
  .patch(protect, authorize('HQ_ADMIN'), updateUser);



export default router;
