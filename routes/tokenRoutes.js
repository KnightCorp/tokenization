const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { purchaseTokens, useAIFeature } = require('../controllers/tokenController');

router.post('/purchase', protect, purchaseTokens);
router.post('/use-ai', protect, useAIFeature);

module.exports = router;