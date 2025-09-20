const express = require('express');
const router = express.Router();

const { healthCheck } = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const requireVerified = require('../middleware/requireVerified');

router.get('/health', healthCheck);
router.use('/auth', authRoutes);

// Example secure verified-only route
router.get('/secure/verified-ping', authMiddleware, requireVerified, (req, res) => {
	res.json({ message: 'Verified access granted', user: { uid: req.user.uid, userType: req.user.userType } });
});

module.exports = router;
