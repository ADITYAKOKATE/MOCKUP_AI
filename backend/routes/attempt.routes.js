const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const auth = require('../middleware/auth');

router.post('/submit', auth, attemptController.submitAttempt);
router.get('/history', auth, attemptController.getHistory);
router.get('/:id', auth, attemptController.getAttemptById);

module.exports = router;
