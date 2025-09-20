const express = require('express');
const router = express.Router();

const { healthCheck } = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const requireVerified = require('../middleware/requireVerified');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API service, including uptime and timestamp
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "ok"
 *               uptime: 3600.123
 *               timestamp: "2025-09-21T10:30:00.000Z"
 */
router.get('/health', healthCheck);
router.use('/auth', authRoutes);

/**
 * @swagger
 * /secure/verified-ping:
 *   get:
 *     summary: Protected endpoint for verified users only
 *     description: Test endpoint that requires both valid authentication and full verification (email and phone verified)
 *     tags: [Secure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted for verified user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verified access granted"
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       description: User MongoDB ObjectId
 *                       example: "507f1f77bcf86cd799439011"
 *                     userType:
 *                       type: string
 *                       enum: [customer, vendor, driver]
 *                       example: "customer"
 *       401:
 *         description: Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account not fully verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Account not fully verified. Please verify email and phone."
 */
// Example secure verified-only route
router.get('/secure/verified-ping', authMiddleware, requireVerified, (req, res) => {
	res.json({ message: 'Verified access granted', user: { uid: req.user.uid, userType: req.user.userType } });
});

module.exports = router;
