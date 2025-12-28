
const express = require('express');
const router = express.Router();
const UserController = require('../Controller/UserController');

// Signup route - for creating new users
router.post('/signup', UserController.SignupUser);

// Login route - using UserController for actual authentication
router.post('/login', UserController.LoginUser);

// Update password route
router.post('/update-password', UserController.UpdatePassword);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'User routes working' });
});

module.exports = router;
