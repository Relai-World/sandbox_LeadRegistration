const express = require('express');
const router = express.Router();
const SupabasePropertyController = require('../Controller/SupabasePropertyController');

router.post('/save', SupabasePropertyController.SaveProperty);

router.post('/update-cp', SupabasePropertyController.UpdateCPInBothTables);

router.get('/drafts/:email', SupabasePropertyController.GetDraftsByEmail);

router.get('/submitted/:email', SupabasePropertyController.GetSubmittedPropertiesByEmail);

router.get('/:id', SupabasePropertyController.GetPropertyById);

router.put('/:id', SupabasePropertyController.UpdateProperty);

router.delete('/:id', SupabasePropertyController.DeleteProperty);

module.exports = router;
