const serverless = require('serverless-http');

// Initialize app with comprehensive error handling
let app;
let handler;
let initializationError = null;

// Wrap initialization in try-catch to prevent module load failures
try {
  console.log('🚀 Initializing Netlify serverless function...');
  console.log('Node version:', process.version);
  console.log('Environment:', process.env.NODE_ENV || 'production');
  console.log('Supabase URL configured:', !!process.env.SUPABASE_URL);
  console.log('Supabase Service Key configured:', !!process.env.SUPABASE_SERVICE_KEY);
  
  // Load the Express app - this might throw if there's a syntax error or missing dependency
  try {
    app = require('../../app');
    console.log('✅ Express app loaded successfully');
  } catch (requireError) {
    console.error('❌ Failed to require Express app:', requireError);
    initializationError = requireError;
    throw requireError;
  }
  
  // Create serverless handler with proper configuration
  try {
    handler = serverless(app, {
      binary: ['image/*', 'application/pdf']
    });
    console.log('✅ Serverless handler created successfully');
  } catch (handlerError) {
    console.error('❌ Failed to create serverless handler:', handlerError);
    initializationError = handlerError;
    throw handlerError;
  }
} catch (error) {
  console.error('❌ Failed to initialize serverless function:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  initializationError = error;
  
  // Create a minimal fallback handler
  try {
    const express = require('express');
    const fallbackApp = express();
    fallbackApp.use(express.json());
    
    // Add CORS headers
    fallbackApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
    
    fallbackApp.use((req, res) => {
      console.error('Request received but app failed to initialize');
      res.status(500).json({ 
        error: 'Server initialization failed', 
        message: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
    
    handler = serverless(fallbackApp);
    console.log('✅ Fallback handler created');
  } catch (fallbackError) {
    console.error('❌ Even fallback handler failed:', fallbackError);
  }
}

// Export the handler with comprehensive error catching
module.exports.handler = async (event, context) => {
  // Don't wait for empty event loop (important for serverless)
  context.callbackWaitsForEmptyEventLoop = false;
  
  // If handler wasn't initialized, return error immediately
  if (!handler) {
    console.error('❌ Handler not initialized');
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Service unavailable',
        message: initializationError ? initializationError.message : 'Server not initialized',
        path: event.path || event.rawPath || '/',
        method: event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN'
      })
    };
  }
  
  try {
    // Log request details
    const method = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
    // Netlify redirects /api/* to /.netlify/functions/server/:splat
    // So the path in the event will be the full path including /api
    const path = event.path || event.rawPath || (event.requestContext?.http?.path) || '/';
    const queryString = event.queryStringParameters || {};
    console.log(`📥 ${method} ${path}`);
    console.log('Query params:', JSON.stringify(queryString));
    console.log('Raw path:', event.rawPath);
    console.log('Path:', event.path);
    
    // Ensure the event has the correct structure for serverless-http
    // Fix the path if needed for Netlify routing
    const fixedEvent = {
      ...event,
      path: path,
      requestContext: event.requestContext || {
        http: {
          method: method,
          path: path
        }
      }
    };
    
    // Call the serverless handler with a timeout wrapper to prevent hanging
    const handlerPromise = handler(fixedEvent, context);
    
    // Add a safety timeout (24 seconds, leaving 2 seconds buffer for Netlify's 26s limit)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timeout')), 24000);
    });
    
    const result = await Promise.race([handlerPromise, timeoutPromise]);
    
    // Log response
    const statusCode = result?.statusCode || 'unknown';
    console.log(`✅ ${method} ${path} - ${statusCode}`);
    
    // Ensure result has proper structure
    if (!result || typeof result !== 'object') {
      console.error('Handler returned invalid result:', result);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid response from handler',
          path: path,
          method: method
        })
      };
    }
    
    // Ensure headers are set
    if (!result.headers) {
      result.headers = {};
    }
    result.headers['Access-Control-Allow-Origin'] = '*';
    result.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    result.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    
    return result;
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Determine status code based on error type
    let statusCode = 500;
    if (error.message === 'Function timeout') {
      statusCode = 504;
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      statusCode = 503;
    }
    
    // Return a proper error response
    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: statusCode === 504 ? 'Gateway timeout' : statusCode === 503 ? 'Service unavailable' : 'Internal server error',
        message: error.message,
        path: event.path || event.rawPath || '/',
        method: event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN',
        timestamp: new Date().toISOString()
      })
    };
  }
};
