// --- DEPENDENCIES ---
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');


// --- DATABASE CONNECTION & SERVER STARTUP ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

// Use localhost for local development, 0.0.0.0 for production/Replit
// For local dev, use 'localhost', for serverless/production use '0.0.0.0'
const HOST = process.env.NODE_ENV === 'production' ? (process.env.HOST || '0.0.0.0') : 'localhost';
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Unified server is running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://${HOST}:${PORT}`);
    console.log(`📡 API endpoints available at: http://${HOST}:${PORT}/api/`);
    console.log(`✅ Server is ready to accept connections`);
    
    // Optional: Connect to MongoDB if URI is provided
    if (MONGO_URI) {
      mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB connected successfully.'))
        .catch(err => console.error('❌ MongoDB connection error, but server is still running.', err));
    } else {
      console.log('⚠️  No MongoDB URI provided. Server running without database connection.');
    }
});

// Add error handling for the server
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        console.error(`💡 You can set a different port using: PORT=3001 npm run dev`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});