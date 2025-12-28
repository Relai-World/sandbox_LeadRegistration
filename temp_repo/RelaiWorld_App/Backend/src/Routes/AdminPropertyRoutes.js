const express = require('express');
const router = express.Router();
const AdminPropertyController = require('../Controller/AdminPropertyController');

// Get all properties with optional email filter
router.get('/properties', AdminPropertyController.GetAllPropertiesForAdmin);

// Get all unique agent emails
router.get('/agent-emails', AdminPropertyController.GetAllAgentEmails);

// Verify a property (copy to verified table and delete from unverified)
router.post('/properties/:id/verify', AdminPropertyController.VerifyProperty);

// Get MongoDB property data by project name for comparison
router.get('/properties/mongodb/:projectName', AdminPropertyController.GetMongoPropertyByName);

// Get verified property data by project name for comparison
router.get('/properties/verified/:projectName', AdminPropertyController.GetVerifiedPropertyByName);

module.exports = router;
