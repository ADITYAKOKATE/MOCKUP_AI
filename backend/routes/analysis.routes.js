const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const auth = require('../middleware/auth');

// Comprehensive Analysis Routes (for Analysis Page)
router.get('/overview', auth, analysisController.getOverview);
router.get('/subjects', auth, analysisController.getSubjectAnalysis);
router.get('/topics', auth, analysisController.getTopicAnalysis);
router.get('/growth', auth, analysisController.getGrowthAnalysis);
router.get('/time-analytics', auth, analysisController.getTimeAnalytics);

// Legacy routes
router.get('/', auth, analysisController.getAnalysis);
router.get('/performance', auth, analysisController.getPerformance);

// Performance Analysis Endpoints
router.get('/performance-overview', auth, analysisController.getPerformanceOverview);
router.get('/attempt/:analysisId', auth, analysisController.getAnalysis);
router.get('/:examName', auth, analysisController.getPerformanceAnalysis);
router.get('/:examName/weak-topics', auth, analysisController.getWeakTopics);
router.get('/:examName/topic-strengths', auth, analysisController.getTopicStrengths);
router.get('/:examName/subject-performance', auth, analysisController.getSubjectPerformance);

module.exports = router;
