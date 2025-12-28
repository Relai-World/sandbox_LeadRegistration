const serverless = require('serverless-http');
const app = require('./app');

// Export a single handler that can be used by AWS Lambda (API Gateway / HTTP API)
module.exports.handler = serverless(app, {
  // leave defaults; add binary types here if you need to handle images or files
});
