import { Router } from 'express';
import { listAvailableCountries } from './country.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Countries
 *   description: Available country management
 */

/**
 * @swagger
 * /api/countries/available:
 *   get:
 *     summary: Get available countries
 *     description: Returns countries available in the database where deletedAt is null.
 *     tags:
 *       - Countries
 *     security: []
 *     responses:
 *       200:
 *         description: Countries fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Countries fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailableCountry'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to fetch countries
 */
router.get('/available', listAvailableCountries);

export default router;