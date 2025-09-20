const express = require('express');
const router = express.Router();
const buildAuthController = require('../controllers/buildAuthController');
const authMiddleware = require('../middleware/authMiddleware');
const authAllowExpired = require('../middleware/authAllowExpired');

const customer = buildAuthController('customer');
const vendor = buildAuthController('vendor');
const driver = buildAuthController('driver');

function mount(base, ctrl) {
	// Public endpoints
	
	/**
	 * @swagger
	 * /auth/{base}/signup:
	 *   post:
	 *     summary: User registration
	 *     description: Register a new user account. After successful registration, OTP codes are sent to both email and phone for verification.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor  
	 *       - Auth - Driver
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type for registration
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/SignupRequest'
	 *     responses:
	 *       201:
	 *         description: User registered successfully, OTP codes sent
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 user:
	 *                   oneOf:
	 *                     - $ref: '#/components/schemas/Customer'
	 *                     - $ref: '#/components/schemas/Vendor'
	 *                     - $ref: '#/components/schemas/Driver'
	 *                 message:
	 *                   type: string
	 *                   example: "OTP sent to email (j***@example.com) and phone (12****90). It will expire in 5 minutes."
	 *       400:
	 *         description: Validation error or user already exists
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/signup`, ctrl.signup);
	
	/**
	 * @swagger
	 * /auth/{base}/login:
	 *   post:
	 *     summary: User authentication
	 *     description: Login with email/phone and password. Returns JWT tokens and user verification status.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type for login
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/LoginRequest'
	 *     responses:
	 *       200:
	 *         description: Login successful
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/AuthResponse'
	 *       400:
	 *         description: Invalid credentials
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: User not found
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/login`, ctrl.login);

	// Protected endpoints (require valid access token)
	
	/**
	 * @swagger
	 * /auth/{base}/verify/email:
	 *   post:
	 *     summary: Verify email with OTP
	 *     description: Verify user's email address using the OTP code sent during registration or resend.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [email, code]
	 *             properties:
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: "john@example.com"
	 *               code:
	 *                 type: string
	 *                 example: "123456"
	 *     responses:
	 *       200:
	 *         description: Email verified successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid or expired OTP code
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Invalid authentication token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/verify/email`, authMiddleware, ctrl.verifyEmail);
	
	/**
	 * @swagger
	 * /auth/{base}/verify/phone:
	 *   post:
	 *     summary: Verify phone with OTP
	 *     description: Verify user's phone number using the OTP code sent during registration or resend.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [phone, code]
	 *             properties:
	 *               phone:
	 *                 type: string
	 *                 example: "1234567890"
	 *               code:
	 *                 type: string
	 *                 example: "654321"
	 *     responses:
	 *       200:
	 *         description: Phone verified successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid or expired OTP code
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Invalid authentication token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/verify/phone`, authMiddleware, ctrl.verifyPhone);
	
	/**
	 * @swagger
	 * /auth/{base}/resend/email:
	 *   post:
	 *     summary: Resend email OTP
	 *     description: Request a new OTP code to be sent to the user's email address. Limited to 10 resends per active window.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [email]
	 *             properties:
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: "john@example.com"
	 *     responses:
	 *       200:
	 *         description: New OTP sent to email
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Resend limit exceeded or invalid email
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Invalid authentication token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/resend/email`, authMiddleware, ctrl.resendEmail);
	
	/**
	 * @swagger
	 * /auth/{base}/resend/phone:
	 *   post:
	 *     summary: Resend phone OTP
	 *     description: Request a new OTP code to be sent to the user's phone number. Limited to 10 resends per active window.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [phone]
	 *             properties:
	 *               phone:
	 *                 type: string
	 *                 example: "1234567890"
	 *     responses:
	 *       200:
	 *         description: New OTP sent to phone
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Resend limit exceeded or invalid phone
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Invalid authentication token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/resend/phone`, authMiddleware, ctrl.resendPhone);
	
	/**
	 * @swagger
	 * /auth/{base}/refresh:
	 *   post:
	 *     summary: Refresh access token
	 *     description: Generate a new access token using a valid refresh token. Also returns updated user verification status.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/RefreshRequest'
	 *     responses:
	 *       200:
	 *         description: Token refreshed successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/AuthResponse'
	 *       400:
	 *         description: Invalid refresh token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Expired or invalid refresh token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/refresh`, authAllowExpired, ctrl.refresh);
	
	/**
	 * @swagger
	 * /auth/{base}/logout:
	 *   post:
	 *     summary: User logout
	 *     description: Invalidate the user's refresh token and log them out of the system.
	 *     tags: 
	 *       - Auth - Customer
	 *       - Auth - Vendor
	 *       - Auth - Driver
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: base
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: [customer, vendor, driver]
	 *         description: User type
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/LogoutRequest'
	 *     responses:
	 *       200:
	 *         description: Logged out successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: Invalid request data
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Invalid authentication token
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post(`${base}/logout`, authMiddleware, ctrl.logout);
}

// Mount routes for each user type
mount('/customer', customer);
mount('/vendor', vendor);  
mount('/driver', driver);

// Explicit route documentation for each user type

/**
 * @swagger
 * /auth/customer/signup:
 *   post:
 *     summary: Customer registration
 *     description: Register a new customer account
 *     tags: [Auth - Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: "OTP sent to email and phone"
 */

/**
 * @swagger
 * /auth/customer/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate customer with email/phone and password
 *     tags: [Auth - Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /auth/customer/verify/email:
 *   post:
 *     summary: Verify customer email
 *     tags: [Auth - Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */

/**
 * @swagger
 * /auth/customer/verify/phone:
 *   post:
 *     summary: Verify customer phone
 *     tags: [Auth - Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone verified successfully
 */

/**
 * @swagger
 * /auth/customer/refresh:
 *   post:
 *     summary: Refresh customer token
 *     tags: [Auth - Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /auth/customer/logout:
 *   post:
 *     summary: Customer logout
 *     tags: [Auth - Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

/**
 * @swagger
 * /auth/vendor/signup:
 *   post:
 *     summary: Vendor registration
 *     description: Register a new vendor account (requires admin confirmation)
 *     tags: [Auth - Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/Vendor'
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/vendor/login:
 *   post:
 *     summary: Vendor login
 *     description: Authenticate vendor with email/phone and password
 *     tags: [Auth - Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /auth/driver/signup:
 *   post:
 *     summary: Driver registration  
 *     description: Register a new driver account (requires admin confirmation)
 *     tags: [Auth - Driver]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Driver registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/Driver'
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/driver/login:
 *   post:
 *     summary: Driver login
 *     description: Authenticate driver with email/phone and password
 *     tags: [Auth - Driver] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

module.exports = router;
