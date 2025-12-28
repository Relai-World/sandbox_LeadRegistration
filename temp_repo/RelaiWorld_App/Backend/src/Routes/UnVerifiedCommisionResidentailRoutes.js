
const express = require('express');
const router = express.Router();

// TODO: Add routes for commission residential projects
// Placeholder route to prevent router errors
router.get('/test', (req, res) => {
  res.json({ message: 'Commission residential routes working' });
});

module.exports = router;
