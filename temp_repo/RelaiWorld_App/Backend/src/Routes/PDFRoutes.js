const express = require('express');
const router = express.Router();
const PDFGenerationController = require('../Controller/PDFGenerationController');

// Generate PDF with lead info and selected projects
router.post('/generate-pdf', PDFGenerationController.generatePDF);

module.exports = router;

