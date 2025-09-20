const express = require('express');
const router = express.Router();
const buildAuthController = require('../controllers/buildAuthController');

const customer = buildAuthController('customer');
const vendor = buildAuthController('vendor');
const driver = buildAuthController('driver');

function mount(base, ctrl) {
	router.post(`${base}/signup`, ctrl.signup);
	router.post(`${base}/verify/email`, ctrl.verifyEmail);
	router.post(`${base}/verify/phone`, ctrl.verifyPhone);
	router.post(`${base}/resend/email`, ctrl.resendEmail);
	router.post(`${base}/resend/phone`, ctrl.resendPhone);
	router.post(`${base}/login`, ctrl.login);
	router.post(`${base}/refresh`, ctrl.refresh);
	router.post(`${base}/logout`, ctrl.logout);
}

mount('/customer', customer);
mount('/vendor', vendor);
mount('/driver', driver);

module.exports = router;
