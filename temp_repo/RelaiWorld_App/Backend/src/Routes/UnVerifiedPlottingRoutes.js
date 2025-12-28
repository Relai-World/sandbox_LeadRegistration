
const express = require('express');
const router = express.Router();

// TODO: Add routes for plotting projects
// Placeholder route to prevent router errors
router.get('/test', (req, res) => {
  res.json({ message: 'Plotting routes working' });
});

module.exports = router;
