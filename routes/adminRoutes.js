const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getUsersWithUsage } = require('../controllers/adminController');

router.get('/users', protect, admin, getUsersWithUsage);

module.exports = router;