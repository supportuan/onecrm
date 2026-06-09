import { Router } from 'express';
import * as controller from './user.controller.js';
import { authenticateToken } from '../../middleware/authenticate.js';
import { authorizeRole, authorizePermission } from '../../middleware/authorize.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User and role management APIs
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, COUNSELLOR, STUDENT, HR]
 *         description: Filter users by role
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get('/users', authenticateToken, authorizePermission('Admin & Settings', 'User Management', 'VIEW'), controller.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 */
router.get('/users/:id', authenticateToken, controller.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Emma Davis
 *               email:
 *                 type: string
 *                 example: emma.davis@onecrm.com
 *               phone:
 *                 type: string
 *                 example: "+919999999999"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, COUNSELLOR, STUDENT, HR]
 *                 example: COUNSELLOR
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', authenticateToken, authorizePermission('Admin & Settings', 'User Management', 'EDIT'), controller.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Emma Davis
 *               phone:
 *                 type: string
 *                 example: "+919999999999"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, COUNSELLOR, STUDENT, HR]
 *                 example: COUNSELLOR
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:id', authenticateToken, authorizePermission('Admin & Settings', 'User Management', 'EDIT'), controller.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 */
router.delete('/users/:id', authenticateToken, authorizePermission('Admin & Settings', 'User Management', 'EDIT'), controller.deleteUser);

/**
 * @swagger
 * /api/counsellors:
 *   get:
 *     summary: Get active counsellors
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Counsellors fetched successfully
 */
router.get('/counsellors', controller.getCounsellors);

export default router;