const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');

// @route   GET api/questions/generate
// @desc    Get random questions
// @access  Public (or Private)
router.get('/generate', questionController.getQuestions);

// @route   POST api/questions
// @desc    Add a question (Admin use mostly)
// @access  Public (should be Protected)
router.post('/', questionController.createQuestion);

// @route   GET api/questions/topics/:examName
// @desc    Get unique topics for an exam
// @access  Public
router.get('/topics/:examName', questionController.getTopicsByExam);

// @route   POST api/questions/by-topic
// @desc    Get questions by topic
// @access  Public
router.post('/by-topic', questionController.getQuestionsByTopic);

// @route   POST api/questions/revision
// @desc    Get revision questions (high importance)
// @access  Public
router.post('/revision', questionController.getRevisionQuestions);

module.exports = router;
