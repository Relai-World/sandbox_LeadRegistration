const express = require('express');
const router = express.Router();
const { ShortForm, VerifyProject, DraftsDataByEmail, DraftDataById } = require('../Controller/UnVerifiedResidentialController');

router.post('/shortform', ShortForm);
router.put('/verifyProject/:reraNumber', VerifyProject);
router.get('/DraftData/:email', DraftsDataByEmail);
router.get('/DraftData/id/:id', DraftDataById);

module.exports = router;

