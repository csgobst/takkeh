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
	router.post(`${base}/signup`, ctrl.signup);
	router.post(`${base}/login`, ctrl.login);

	// Protected endpoints (require valid access token)
	router.post(`${base}/verify/email`, authMiddleware, ctrl.verifyEmail);
	router.post(`${base}/verify/phone`, authMiddleware, ctrl.verifyPhone);
	router.post(`${base}/resend/email`, authMiddleware, ctrl.resendEmail);
	router.post(`${base}/resend/phone`, authMiddleware, ctrl.resendPhone);
	router.post(`${base}/refresh`, authAllowExpired, ctrl.refresh);
	router.post(`${base}/logout`, authMiddleware, ctrl.logout);
}

mount('/customer', customer);
mount('/vendor', vendor);
mount('/driver', driver);

module.exports = router;
