
const express = require('express');
const router = express.Router();

// TODO: Add routes for commercial projects
// Placeholder route to prevent router errors
router.get('/test', (req, res) => {
  res.json({ message: 'Commercial routes working' });
});

module.exports = router;
