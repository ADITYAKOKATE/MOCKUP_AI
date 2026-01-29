const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const auth = require('../middleware/auth');

// @route   POST api/test/start-full-test
// @desc    Start a full length test
// @access  Private
router.post('/start-full-test', auth, testController.startFullTest);

// @route   GET api/test/session/:sessionId
// @desc    Get active test session
// @access  Private
router.get('/session/:sessionId', auth, testController.getTestSession);

// @route   POST api/test/session/:sessionId/response
// @desc    Save response for a question
// @access  Private
router.post('/session/:sessionId/response', auth, testController.saveResponse);

// @route   POST api/test/session/:sessionId/submit
// @desc    Submit test and get results
// @access  Private
router.post('/session/:sessionId/submit', auth, testController.submitTest);

// @route   POST api/test/start-topic-test
// @desc    Start an AI-recommended topic test
// @access  Private
router.post('/start-topic-test', auth, testController.startTopicTest);

// @route   POST api/test/session/:sessionId/discard
// @desc    Discard an active test session
// @access  Private
router.post('/session/:sessionId/discard', auth, testController.discardSession);

// @route   GET api/test/results/:attemptId
// @desc    Get test results
// @access  Private
router.get('/results/:attemptId', auth, testController.getTestResults);

// @route   GET api/test/history
// @desc    Get user's test attempts history
// @access  Private
router.get('/history', auth, testController.getUserAttempts);

module.exports = router;
