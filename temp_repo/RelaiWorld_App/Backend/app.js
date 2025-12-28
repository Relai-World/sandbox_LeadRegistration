require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- SETUP ---
const supabase = require('./superbase.js');

// --- CORE MIDDLEWARE ---
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Allow overriding in env for quick testing (useful for debugging)
    if (process.env.ALLOW_ALL_ORIGINS === 'true') return callback(null, true);

    // Patterns we consider safe:
    // - localhost / 127.0.0.1 with any port (local dev & netlify dev)
    // - any netlify.app preview/deploy domain
    // - vercel.app and vercel.sh deployments
    // - replit apps
    // - any relai.world domain
    const allowedPatterns = [
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i,
      /^https?:\/\/.*\.netlify\.app(:\d+)?$/i,
      /^https?:\/\/.*\.vercel\.app(:\d+)?$/i,
      /^https?:\/\/.*\.vercel\.sh(:\d+)?$/i,
      /^https?:\/\/.*\.replit\.app(:\d+)?$/i,
      /^https?:\/\/.*\.replit\.dev(:\d+)?$/i,
      /^https?:\/\/.*\.relai\.world(:\d+)?$/i
    ];

    const ok = allowedPatterns.some((r) => r.test(origin));
    if (ok) return callback(null, true);

    // Backwards compatibility fallback for a few explicit origins
    const allowedOrigins = [
      'https://builder-onboarding.relai.world',
      'https://relai-app-connect153.replit.app'
    ];

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add a simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes with better error handling
let userRoutes, unVerifiedResidentialRoutes, verifiedResidentialRoutes;
let unVerifiedCommisionResidentialRoutes, unVerifiedCommercialRoutes;
let unVerifiedPlottingRoutes, supabasePropertyRoutes, adminPropertyRoutes;
let builderDataRoutes, leadRegistrationRoutes, pdfRoutes, verifyAdminAuth;

try {
  userRoutes = require('./src/Routes/UserRoutes');
  unVerifiedResidentialRoutes = require('./src/Routes/UnVerifiedResidentialRoutes');
  verifiedResidentialRoutes = require('./src/Routes/VerifiedResidentialRoutes');
  unVerifiedCommisionResidentialRoutes = require('./src/Routes/UnVerifiedCommisionResidentailRoutes');
  unVerifiedCommercialRoutes = require('./src/Routes/UnVerifiedCommercialRoutes');
  unVerifiedPlottingRoutes = require('./src/Routes/UnVerifiedPlottingRoutes');
  supabasePropertyRoutes = require('./src/Routes/SupabasePropertyRoutes');
  adminPropertyRoutes = require('./src/Routes/AdminPropertyRoutes');
  builderDataRoutes = require('./src/Routes/BuilderDataRoutes');
  leadRegistrationRoutes = require('./src/Routes/LeadRegistrationRoutes');
  pdfRoutes = require('./src/Routes/PDFRoutes');
  const adminAuth = require('./src/Middleware/AdminAuthMiddleware');
  verifyAdminAuth = adminAuth.verifyAdminAuth;
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading route files in app.js:', error);
  // Don't throw - allow app to start with error handler
  console.error('Stack trace:', error.stack);
}

// Mount routers (only if they loaded successfully)
if (userRoutes) app.use('/api/user', userRoutes);
if (unVerifiedResidentialRoutes) app.use('/api/unverified', unVerifiedResidentialRoutes);
if (verifiedResidentialRoutes) app.use('/api/verified', verifiedResidentialRoutes);
if (unVerifiedCommisionResidentialRoutes) app.use('/api/commission', unVerifiedCommisionResidentialRoutes);
if (unVerifiedCommercialRoutes) app.use('/api/commercial', unVerifiedCommercialRoutes);
if (unVerifiedPlottingRoutes) app.use('/api/plotting', unVerifiedPlottingRoutes);
if (supabasePropertyRoutes) app.use('/api/properties', supabasePropertyRoutes);
if (adminPropertyRoutes && verifyAdminAuth) app.use('/api/admin', verifyAdminAuth, adminPropertyRoutes);
if (builderDataRoutes && verifyAdminAuth) app.use('/api/builder-data', verifyAdminAuth, builderDataRoutes);
if (leadRegistrationRoutes) {
  app.use('/api/lead-registration', leadRegistrationRoutes);
  console.log('✅ Lead registration routes mounted');
} else {
  console.error('❌ Lead registration routes not loaded');
  // Add a fallback route
  app.get('/api/lead-registration', (req, res) => {
    res.status(503).json({
      error: 'Lead registration routes not loaded',
      message: 'Routes failed to initialize'
    });
  });
}

if (pdfRoutes) {
  app.use('/api/pdf', pdfRoutes);
  console.log('✅ PDF generation routes mounted');
} else {
  console.error('❌ PDF generation routes not loaded');
}

// test route
app.get('/api/test', (req, res) => res.json({ message: 'API is working' }));

// Test lead registration route
app.get('/api/lead-registration/test', (req, res) => {
  console.log('Lead registration test endpoint called');
  res.json({ message: 'Lead registration route is accessible', timestamp: new Date().toISOString() });
});

app.post('/api/onboard', async (req, res) => {
  try {
    const data = req.body;
    const { error } = await supabase.from('onboarded_data').insert([data]);

    if (error) return res.status(500).json({ message: 'Insert failed', error });
    return res.status(200).json({ message: 'Project onboarded successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Unexpected error', error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), port: process.env.PORT || 3000, environment: process.env.NODE_ENV || 'development' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    path: req.path,
    method: req.method
  });
});

// Catch-all for unhandled API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  // For non-API routes, let the static file handler deal with it (if it exists)
});

// Serve frontend static assets when running as a server
const frontendDistPath = path.resolve(__dirname, '..', 'Frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

module.exports = app;
