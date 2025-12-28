// Wrap everything in try-catch to ensure module always loads
let supabase;
let initializationError = null;
let leadRegistrationHandler;

// Load dotenv
try {
  const path = require('path');
  const envPath = path.resolve(__dirname, '../RelaiWorld_App/Backend/.env');
  console.log('🔍 [LeadReg] Loading .env from:', envPath);
  const result = require('dotenv').config({ path: envPath });
  if (result.error) {
    console.warn('⚠️  [LeadReg] Could not load dotenv:', result.error.message);
    require('dotenv').config();
  } else {
    console.log('✅ [LeadReg] .env loaded successfully');
  }
} catch (dotenvError) {
  console.warn('⚠️  [LeadReg] Could not load dotenv:', dotenvError.message);
}

try {
  console.log('🚀 Initializing lead-registration serverless function for Vercel...');
  console.log('Node version:', process.version);
  console.log('Environment:', process.env.NODE_ENV || 'production');
  console.log('Supabase URL configured:', !!process.env.SUPABASE_URL);
  console.log('Supabase Service Key configured:', !!process.env.SUPABASE_SERVICE_KEY);

  // Initialize Supabase directly
  let supabaseInitialized = false;

  try {
    const supabaseJs = require('@supabase/supabase-js');
    const createClient = supabaseJs.createClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl.trim(), supabaseServiceKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-supabase-role': 'service_role'
          }
        }
      });
      supabase.isConfigured = true;
      supabaseInitialized = true;
      console.log('✅ Supabase client initialized directly');
    } else {
      console.warn('⚠️  Supabase credentials not found in environment variables');
    }
  } catch (supabaseInitError) {
    console.error('❌ Failed to initialize Supabase directly:', supabaseInitError.message);
  }

  // Fallback: Try loading from module
  if (!supabaseInitialized) {
    try {
      const supabaseModule = require('../RelaiWorld_App/Backend/supabase');
      if (supabaseModule && supabaseModule.isConfigured !== false) {
        supabase = supabaseModule;
        supabaseInitialized = true;
        console.log('✅ Supabase client loaded from module');
      }
    } catch (moduleError) {
      console.log('⚠️  Could not load supabase module:', moduleError.message);
    }
  }

  // If still not initialized, create a dummy client
  if (!supabaseInitialized) {
    console.warn('⚠️  Creating dummy Supabase client');
    supabase = {
      isConfigured: false,
      from: () => {
        throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your Vercel environment variables.');
      }
    };
  }

  console.log('✅ Supabase client ready (configured:', supabase.isConfigured !== false, ')');
} catch (error) {
  console.error('❌ Failed to initialize lead-registration function:', error);
  supabase = {
    isConfigured: false,
    from: () => {
      throw new Error('Supabase initialization failed: ' + error.message);
    }
  };
  initializationError = error;
}

// Helper function to create response
const createResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
};

// Parse path and extract route info
const parsePath = (path) => {
  if (!path) path = '/';

  // Remove API path prefix
  let cleanPath = path
    .replace(/^\/api\/lead-registration\/?/, '')
    .replace(/^\/lead-registration\/?/, '') || '/';

  if (cleanPath && !cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  if (!cleanPath || cleanPath === '') {
    cleanPath = '/';
  }

  const parts = cleanPath.split('/').filter(p => p);

  return {
    path: cleanPath,
    parts,
    id: parts[0] && !isNaN(parts[0]) ? parts[0] : null,
    isMobileRoute: parts[0] === 'mobile' && parts[1],
    mobile: parts[0] === 'mobile' ? parts[1] : null,
    isPocDetails: parts[0] === 'poc-details',
    isZohoLeads: parts[0] === 'zoho-leads'
  };
};

// Import handler from the original Netlify function
// The handler is already exported and works with Lambda format
let handlerFunctions;
try {
  handlerFunctions = require('../RelaiWorld_App/Backend/netlify/functions/lead-registration');
} catch (error) {
  console.error('Failed to load lead-registration handler:', error);
  handlerFunctions = null;
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Don't wait for empty event loop
  if (req.context) {
    req.context.callbackWaitsForEmptyEventLoop = false;
  }

  // If initialization failed, return error
  if (initializationError && !supabase) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: initializationError.message || 'Server not initialized',
      path: req.url || '/',
      method: req.method || 'UNKNOWN'
    });
  }

  try {
    // Convert Vercel request to Lambda event format
    const method = req.method || 'GET';
    const url = req.url || '/';
    
    // Remove query string for path parsing
    const pathWithoutQuery = url.split('?')[0];
    
    // Parse query parameters
    const queryParams = req.query || {};
    
    // Parse body
    let body = {};
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    console.log(`📥 ${method} ${pathWithoutQuery}`);
    console.log('Query params:', JSON.stringify(queryParams));

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      return res.status(200).end();
    }

    // Create Lambda-style event for the handler
    const event = {
      httpMethod: method,
      path: pathWithoutQuery,
      pathParameters: req.params || {},
      queryStringParameters: queryParams,
      headers: req.headers || {},
      body: body ? JSON.stringify(body) : null,
      isBase64Encoded: false,
      requestContext: {
        http: {
          method: method,
          path: pathWithoutQuery
        }
      }
    };

    const context = {
      callbackWaitsForEmptyEventLoop: false,
      ...req.context
    };

    // Call the original handler if available
    if (!handlerFunctions || !handlerFunctions.handler) {
      return res.status(503).json({
        error: 'Handler not loaded',
        message: 'Lead registration handler failed to initialize'
      });
    }
    
    const result = await handlerFunctions.handler(event, context);

    // Convert Lambda response to Vercel response
    if (result.statusCode) {
      res.status(result.statusCode);
      
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.setHeader(key, result.headers[key]);
        });
      }
      
      if (result.body) {
        try {
          const parsed = JSON.parse(result.body);
          res.json(parsed);
        } catch {
          res.send(result.body);
        }
      } else {
        res.end();
      }
    } else {
      res.json(result);
    }

    console.log(`✅ ${method} ${pathWithoutQuery} - ${result.statusCode || 'unknown'}`);

  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    let statusCode = 500;
    if (error.message === 'Function timeout') {
      statusCode = 504;
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: statusCode === 504 ? 'Gateway timeout' : statusCode === 503 ? 'Service unavailable' : 'Internal server error',
      message: error.message,
      path: req.url || '/',
      method: req.method || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
};

console.log('✅ Lead registration function module loaded for Vercel');
console.log('Supabase initialized:', supabase ? (supabase.isConfigured !== false ? 'Yes' : 'No (dummy)') : 'No');

