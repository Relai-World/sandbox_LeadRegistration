
const express = require('express');
const router = express.Router();
const { SearchResidentialWithSuggestions, StatusCount, GetAllVerifiedResidentialData, GetDropdownValues, GetPropertyDetails, GetAllProperties, UpdatePropertySoldOut } = require('../Controller/VerifiedResidentialController');

// Define routes with proper path patterns
router.get('/search', SearchResidentialWithSuggestions);
router.get('/status-count/:email', StatusCount);
router.get('/verified-residential', GetAllVerifiedResidentialData);
router.get('/dropdown-values', GetDropdownValues);
router.get('/property-details', GetPropertyDetails);
router.get('/all-properties', GetAllProperties);
router.put('/property/:propertyId/sold-out', UpdatePropertySoldOut);

module.exports = router;

