const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// We will need an auth middleware later for protected routes like getMe
const auth = require('../middleware/auth'); 

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile); 

module.exports = router;
