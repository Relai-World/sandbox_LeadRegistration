// Simple local server starter
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

console.log('Starting server locally...');
console.log(`Port: ${PORT}`);
console.log(`Host: ${HOST}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`\n✅ Server is running!`);
  console.log(`🌐 Local URL: http://${HOST}:${PORT}`);
  console.log(`📡 API: http://${HOST}:${PORT}/api/`);
  console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  console.log(`🧪 Test: http://${HOST}:${PORT}/api/test`);
  console.log(`📋 Leads: http://${HOST}:${PORT}/api/lead-registration`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`💡 Try: PORT=3001 npm run start:local`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

