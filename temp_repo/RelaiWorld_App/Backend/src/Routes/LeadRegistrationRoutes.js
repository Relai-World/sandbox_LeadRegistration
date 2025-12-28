const express = require('express');
const router = express.Router();
const {
  GetAllLeadRegistrations,
  GetLeadsByMobile,
  GetLeadById,
  CreateLead,
  UpdateLead,
  DeleteLead,
  GetPocDetailsByReraNumbers,
  GetZohoLeadNames
} = require('../Controller/LeadRegistrationController');

router.get('/', GetAllLeadRegistrations);

router.get('/mobile/:mobile', GetLeadsByMobile);

router.get('/:id', GetLeadById);

router.post('/', CreateLead);

router.post('/poc-details', GetPocDetailsByReraNumbers);

router.post('/zoho-leads', GetZohoLeadNames);

router.put('/:id', UpdateLead);

router.delete('/:id', DeleteLead);

module.exports = router;
