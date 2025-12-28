// Vercel catch-all: this file allows deploying the Backend folder as a Vercel Project
// Vercel will call this module with (req, res). Express app can handle that directly.
const app = require('../app');

module.exports = app; // Vercel will execute the exported function with (req, res)
