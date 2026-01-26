const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const auth = require('../middleware/auth');

// @route   GET /api/ai/recommendations
// @desc    Get AI-powered test recommendations based on performance
// @access  Private (requires authentication)
router.get('/recommendations', auth, aiController.getAIRecommendations);

module.exports = router;


