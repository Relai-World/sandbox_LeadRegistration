// Vercel catch-all API handler
// Use serverless-http to properly handle Express app in serverless environment
const serverless = require('serverless-http');

// Initialize app
let app;
let handler;
let initializationError = null;

try {
  console.log('🚀 Initializing Vercel catch-all API handler...');
  app = require('../RelaiWorld_App/Backend/app');
  console.log('✅ Express app loaded successfully');
  
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });
  console.log('✅ Serverless handler created successfully');
} catch (error) {
  console.error('❌ Failed to initialize:', error);
  initializationError = error;
  
  // Fallback handler
  const express = require('express');
  const fallbackApp = express();
  fallbackApp.use(express.json());
  fallbackApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
  fallbackApp.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message,
      path: req.url
    });
  });
  handler = serverless(fallbackApp);
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Immediate debug log to confirm handler is being called
  console.log('🔵 Catch-all handler invoked!');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  
  if (req.context) {
    req.context.callbackWaitsForEmptyEventLoop = false;
  }
  
  if (!handler) {
    console.error('❌ Handler not initialized');
    return res.status(503).json({
      error: 'Service unavailable',
      message: initializationError?.message || 'Handler not initialized',
      debug: {
        url: req.url,
        path: req.path,
        method: req.method
      }
    });
  }
  
  try {
    // Vercel catch-all routes: the path segments are available in different ways
    // req.url contains the full path, but for catch-all routes, we need to reconstruct it
    // The catch-all segments might be in req.query or we need to use the full URL
    
    // Get the full path - Vercel catch-all routes receive the full path in req.url
    let requestPath = req.url || req.path || '/';
    
    // For catch-all routes, Vercel might pass the segments differently
    // Check if we have path segments in the query (Vercel sometimes does this)
    if (req.query && Object.keys(req.query).length > 0) {
      // Reconstruct path from query params if needed
      const pathSegments = Object.values(req.query).filter(v => typeof v === 'string');
      if (pathSegments.length > 0 && !requestPath.includes('/api/')) {
        requestPath = '/api/' + pathSegments.join('/');
      }
    }
    
    // Ensure path starts with /api (should already be the case for /api/* routes)
    if (!requestPath.startsWith('/api')) {
      // If it doesn't start with /api, it might be because Vercel stripped it
      // Reconstruct: /api + the path
      requestPath = '/api' + (requestPath.startsWith('/') ? requestPath : '/' + requestPath);
    }
    
    // Debug: log all available path information
    console.log('=== Path Debug ===');
    console.log('req.url:', req.url);
    console.log('req.path:', req.path);
    console.log('req.query:', JSON.stringify(req.query));
    console.log('req.params:', JSON.stringify(req.params));
    console.log('Initial requestPath:', requestPath);
    
    // Parse query string
    const urlParts = requestPath.split('?');
    const pathOnly = urlParts[0];
    const queryString = urlParts[1] || '';
    
    // Parse query parameters
    const queryParams = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      });
    }
    
    // Merge with req.query
    const allQueryParams = { ...queryParams, ...(req.query || {}) };
    
    // Debug logging
    console.log('=== API Request ===');
    console.log('Method:', req.method);
    console.log('Original URL:', req.url);
    console.log('Path:', req.path);
    console.log('Final Path:', pathOnly);
    console.log('Query:', JSON.stringify(allQueryParams));
    
    // Convert to Lambda event format for serverless-http
    const event = {
      httpMethod: req.method || 'GET',
      path: pathOnly,
      pathParameters: req.params || {},
      queryStringParameters: allQueryParams,
      headers: req.headers || {},
      body: req.body ? JSON.stringify(req.body) : null,
      isBase64Encoded: false,
      requestContext: {
        http: {
          method: req.method || 'GET',
          path: pathOnly
        }
      }
    };
    
    const context = {
      callbackWaitsForEmptyEventLoop: false,
      ...req.context
    };
    
    // Call serverless handler
    const result = await handler(event, context);
    
    // Convert Lambda response to Vercel response
    if (result.statusCode) {
      res.status(result.statusCode);
      
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.setHeader(key, result.headers[key]);
        });
      }
      
      // CORS headers
      if (!result.headers || !result.headers['Access-Control-Allow-Origin']) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      }
      
      // Send body
      if (result.body) {
        if (result.isBase64Encoded) {
          res.send(Buffer.from(result.body, 'base64'));
        } else {
          try {
            const parsed = JSON.parse(result.body);
            res.json(parsed);
          } catch {
            res.send(result.body);
          }
        }
      } else {
        res.end();
      }
    } else {
      res.json(result);
    }
    
    console.log(`✅ ${req.method} ${pathOnly} - ${result.statusCode || 'unknown'}`);
    
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      path: req.url
    });
  }
};
