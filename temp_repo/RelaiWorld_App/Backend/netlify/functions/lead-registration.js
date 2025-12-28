// Wrap everything in try-catch to ensure module always loads
let supabase;
let initializationError = null;

try {
  // Load dotenv safely with explicit path
  try {
    const path = require('path');
    const envPath = path.resolve(__dirname, '../../.env');
    console.log('🔍 [LeadReg] Loading .env from:', envPath);
    const result = require('dotenv').config({ path: envPath });
    if (result.error) {
      console.warn('⚠️  [LeadReg] Could not load dotenv:', result.error.message);
      // Try default load as backup
      require('dotenv').config();
    } else {
      console.log('✅ [LeadReg] .env loaded successfully');
    }
  } catch (dotenvError) {
    console.warn('⚠️  [LeadReg] Could not load dotenv:', dotenvError.message);
  }

  console.log('🚀 Initializing lead-registration serverless function...');
  console.log('Node version:', process.version);
  console.log('Environment:', process.env.NODE_ENV || 'production');
  console.log('Supabase URL configured:', !!process.env.SUPABASE_URL);
  console.log('Supabase Service Key configured:', !!process.env.SUPABASE_SERVICE_KEY);

  // Initialize Supabase directly (more reliable in serverless environments)
  // Try direct initialization first, then fallback to module if needed
  let supabaseInitialized = false;

  try {
    // Safely require @supabase/supabase-js
    let createClient;
    try {
      const supabaseJs = require('@supabase/supabase-js');
      createClient = supabaseJs.createClient;
    } catch (requireError) {
      console.error('❌ Failed to require @supabase/supabase-js:', requireError.message);
      throw requireError;
    }

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
      console.warn('   SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.warn('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
    }
  } catch (supabaseInitError) {
    console.error('❌ Failed to initialize Supabase directly:', supabaseInitError.message);
    console.error('Error stack:', supabaseInitError.stack);
  }

  // Fallback: Try loading from module if direct initialization failed
  if (!supabaseInitialized) {
    try {
      const supabaseModule = require('../../supabase');
      if (supabaseModule && supabaseModule.isConfigured !== false) {
        supabase = supabaseModule;
        supabaseInitialized = true;
        console.log('✅ Supabase client loaded from module');
      }
    } catch (moduleError) {
      console.log('⚠️  Could not load supabase module:', moduleError.message);
    }
  }

  // If still not initialized, create a dummy client that will return proper errors
  if (!supabaseInitialized) {
    console.warn('⚠️  Creating dummy Supabase client - function will return errors for database operations');
    supabase = {
      isConfigured: false,
      from: () => {
        throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your Netlify environment variables.');
      }
    };
  }

  console.log('✅ Supabase client ready (configured:', supabase.isConfigured !== false, ')');
} catch (error) {
  console.error('❌ Failed to initialize lead-registration function:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);

  // Create a dummy supabase client so the function can still load
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
// Netlify redirects /api/lead-registration/* to /.netlify/functions/lead-registration/:splat
// The path in event can be:
// - /.netlify/functions/lead-registration (root, no splat)
// - /.netlify/functions/lead-registration/123 (with ID)
// - /api/lead-registration (original path, if redirect didn't change it)
const parsePath = (path) => {
  if (!path) path = '/';

  // Remove function path prefix - handle all possible formats
  let cleanPath = path
    .replace(/^\/\.netlify\/functions\/lead-registration\/?/, '')
    .replace(/^\/api\/lead-registration\/?/, '')
    .replace(/^\/lead-registration\/?/, '') || '/';

  // Ensure it starts with / if not empty
  if (cleanPath && !cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  if (!cleanPath || cleanPath === '') {
    cleanPath = '/';
  }

  // Extract parts
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

// GET /api/lead-registration - Get all leads (with pagination)
const GetAllLeadRegistrations = async (queryParams = {}) => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase client is null/undefined');
      return createResponse(500, {
        message: 'Error fetching lead registrations',
        error: 'Supabase client not initialized'
      });
    }

    if (supabase.isConfigured === false) {
      console.error('Supabase is not configured (isConfigured = false)');
      return createResponse(500, {
        message: 'Error fetching lead registrations',
        error: 'Supabase connection not configured'
      });
    }

    // Parse pagination parameters
    const page = parseInt(queryParams.page) || parseInt(queryParams.p) || 1;
    const limit = parseInt(queryParams.limit) || parseInt(queryParams.l) || 50;
    const offset = (page - 1) * limit;

    console.log('Supabase is configured, executing query...');
    console.log(`Pagination: page=${page}, limit=${limit}, offset=${offset}`);

    // Get total count for pagination metadata
    let totalCount = 0;
    try {
      const { count, error: countError } = await supabase
        .from('client_Requirements')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        totalCount = count || 0;
      } else {
        console.warn('Could not get total count:', countError.message);
      }
    } catch (countErr) {
      console.warn('Error getting count:', countErr.message);
    }

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

    // Get paginated data
    const { data: leads, error } = await supabase
      .from('client_Requirements')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Query completed. Error:', error ? error.message : 'none');
    console.log('Data length:', leads ? leads.length : 0);
    console.log('Total count:', totalCount);

    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return createResponse(500, {
        message: 'Error fetching lead registrations',
        error: error.message,
        code: error.code
      });
    }

    console.log(`Sending response with ${leads?.length || 0} leads (page ${page} of ${totalPages})`);

    return createResponse(200, {
      success: true,
      data: leads || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Unexpected error in GetAllLeadRegistrations:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return createResponse(500, {
      message: 'Server error fetching lead registrations',
      error: error.message || 'Unknown error',
      name: error.name || 'Error'
    });
  }
};

// GET /api/lead-registration/mobile/:mobile - Get leads by mobile
const GetLeadsByMobile = async (mobile) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    if (!mobile) {
      return createResponse(400, { message: 'Client mobile number is required' });
    }

    console.log(`Fetching leads for mobile: ${mobile}`);
    const { data: leads, error } = await supabase
      .from('client_Requirements')
      .select('*')
      .eq('client_mobile', mobile)
      .order('requirement_number', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return createResponse(404, { message: 'Leads not found', error: error.message });
    }

    console.log(`Found ${leads?.length || 0} leads for mobile ${mobile}`);
    return createResponse(200, { success: true, data: leads || [] });

  } catch (error) {
    console.error('Unexpected error fetching leads by mobile:', error);
    return createResponse(500, { message: 'Server error fetching leads', error: error.message });
  }
};

// GET /api/lead-registration/:id - Get lead by ID
const GetLeadById = async (id) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    if (!id) {
      return createResponse(400, { message: 'Lead ID is required' });
    }

    console.log(`Fetching lead with ID: ${id}`);
    const { data: lead, error } = await supabase
      .from('client_Requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return createResponse(404, { message: 'Lead not found', error: error.message });
    }

    return createResponse(200, { success: true, data: lead });

  } catch (error) {
    console.error('Unexpected error fetching lead:', error);
    return createResponse(500, { message: 'Server error fetching lead', error: error.message });
  }
};

// POST /api/lead-registration - Create lead
const CreateLead = async (body) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const {
      client_mobile,
      requirement_name,
      preferences,
      matched_properties,
      shortlisted_properties,
      site_visits
    } = body;

    if (!client_mobile) {
      return createResponse(400, { message: 'Client mobile number is required' });
    }

    const { data: existingLeads, error: countError } = await supabase
      .from('client_Requirements')
      .select('requirement_number')
      .eq('client_mobile', client_mobile)
      .order('requirement_number', { ascending: false })
      .limit(1);

    let nextRequirementNumber = 1;
    if (!countError && existingLeads && existingLeads.length > 0) {
      nextRequirementNumber = existingLeads[0].requirement_number + 1;
    }

    const leadData = {
      client_mobile,
      requirement_number: nextRequirementNumber,
      requirement_name: requirement_name || '',
      preferences: preferences || {},
      matched_properties: matched_properties || [],
      shortlisted_properties: shortlisted_properties || [],
      site_visits: site_visits || []
    };

    const { data: newLead, error: insertError } = await supabase
      .from('client_Requirements')
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return createResponse(500, {
        message: 'Error creating lead registration',
        error: insertError.message
      });
    }

    return createResponse(201, {
      message: 'Lead registration created successfully',
      data: newLead
    });

  } catch (error) {
    console.error('Unexpected error creating lead:', error);
    return createResponse(500, { message: 'Server error creating lead', error: error.message });
  }
};

// PUT /api/lead-registration/:id - Update lead
const UpdateLead = async (id, body) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    if (!id) {
      return createResponse(400, { message: 'Lead ID is required' });
    }

    const {
      requirement_name,
      preferences,
      matched_properties,
      shortlisted_properties,
      site_visits
    } = body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (requirement_name !== undefined) {
      updateData.requirement_name = requirement_name;
    }
    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }
    if (matched_properties !== undefined) {
      updateData.matched_properties = matched_properties;
    }
    if (shortlisted_properties !== undefined) {
      updateData.shortlisted_properties = shortlisted_properties;
    }
    if (site_visits !== undefined) {
      updateData.site_visits = site_visits;
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('client_Requirements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return createResponse(500, {
        message: 'Error updating lead registration',
        error: updateError.message
      });
    }

    return createResponse(200, {
      message: 'Lead registration updated successfully',
      data: updatedLead
    });

  } catch (error) {
    console.error('Unexpected error updating lead:', error);
    return createResponse(500, { message: 'Server error updating lead', error: error.message });
  }
};

// DELETE /api/lead-registration/:id - Delete lead
const DeleteLead = async (id) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    if (!id) {
      return createResponse(400, { message: 'Lead ID is required' });
    }

    const { error } = await supabase
      .from('client_Requirements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return createResponse(500, { message: 'Error deleting lead', error: error.message });
    }

    return createResponse(200, { message: 'Lead registration deleted successfully' });

  } catch (error) {
    console.error('Unexpected error deleting lead:', error);
    return createResponse(500, { message: 'Server error deleting lead', error: error.message });
  }
};

// POST /api/lead-registration/poc-details - Get POC details by RERA numbers
const GetPocDetailsByReraNumbers = async (body) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return createResponse(503, {
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { rera_numbers } = body;

    if (!rera_numbers || !Array.isArray(rera_numbers) || rera_numbers.length === 0) {
      return createResponse(400, { message: 'RERA numbers array is required' });
    }

    // Limit the number of RERA numbers to prevent timeout (max 100)
    const limitedReraNumbers = rera_numbers.slice(0, 100);
    if (rera_numbers.length > 100) {
      console.warn(`Limiting RERA numbers query to 100 (requested ${rera_numbers.length})`);
    }

    console.log(`Fetching POC details for ${limitedReraNumbers.length} RERA numbers...`);
    const { data: pocData, error } = await supabase
      .from('unified_data')
      .select('rera_number, projectname, buildername, poc_name, poc_contact, poc_role')
      .in('rera_number', limitedReraNumbers);

    if (error) {
      console.error('Supabase query error:', error);
      return createResponse(500, { message: 'Error fetching POC details', error: error.message });
    }

    const pocMap = {};
    (pocData || []).forEach(item => {
      if (item.rera_number) {
        pocMap[item.rera_number] = {
          poc_name: item.poc_name || '',
          poc_contact: item.poc_contact || '',
          poc_role: item.poc_role || '',
          projectname: item.projectname || '',
          buildername: item.buildername || ''
        };
      }
    });

    console.log(`Successfully fetched POC details for ${Object.keys(pocMap).length} RERA numbers`);
    return createResponse(200, { success: true, data: pocMap });

  } catch (error) {
    console.error('Unexpected error fetching POC details:', error);
    return createResponse(500, { message: 'Server error fetching POC details', error: error.message });
  }
};

// Zoho token management
let cachedZohoAccessToken = null;

const refreshZohoToken = async () => {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return null;
  }

  try {
    const tokenUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;
    const response = await fetch(tokenUrl, { method: 'POST' });
    const data = await response.json();

    if (data.access_token) {
      console.log('Zoho token refreshed successfully');
      cachedZohoAccessToken = data.access_token;
      return data.access_token;
    }
    console.error('Failed to refresh Zoho token:', data);
    return null;
  } catch (err) {
    console.error('Error refreshing Zoho token:', err);
    return null;
  }
};

const searchZohoLead = async (accessToken, mobile) => {
  const cleanMobile = mobile.replace(/\D/g, '');
  const last10 = cleanMobile.slice(-10);
  const searchVariants = [mobile, last10, `+91${last10}`, `91${last10}`];

  for (const searchMobile of searchVariants) {
    try {
      const searchUrl = `https://www.zohoapis.in/crm/v2/Leads/search?criteria=(Mobile:equals:${encodeURIComponent(searchMobile)})`;
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const lead = data.data[0];
          const name = lead.Full_Name || `${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim() || lead.Last_Name || lead.First_Name || '';
          if (name) {
            console.log(`Found Zoho lead for ${mobile}: ${name}`);
            return name;
          }
        }
      } else if (response.status === 401) {
        return { error: 'unauthorized' };
      }
    } catch (err) {
      console.error(`Error searching Zoho for ${searchMobile}:`, err.message);
    }
  }
  return null;
};

// POST /api/lead-registration/zoho-leads - Get Zoho lead names
const GetZohoLeadNames = async (body) => {
  try {
    const { mobile_numbers } = body;

    if (!mobile_numbers || !Array.isArray(mobile_numbers) || mobile_numbers.length === 0) {
      return createResponse(400, { message: 'Mobile numbers array is required' });
    }

    // Limit the number of mobile numbers to prevent timeout (max 50 for serverless)
    const limitedMobileNumbers = mobile_numbers.slice(0, 50);
    if (mobile_numbers.length > 50) {
      console.warn(`Limiting mobile numbers query to 50 (requested ${mobile_numbers.length})`);
    }

    let accessToken = cachedZohoAccessToken || process.env.ZOHO_ACCESS_TOKEN;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!accessToken && !refreshToken) {
      console.log('Zoho API credentials not configured');
      return createResponse(200, { success: true, data: {} });
    }

    if (!accessToken && refreshToken) {
      accessToken = await refreshZohoToken();
      if (!accessToken) {
        return createResponse(200, { success: true, data: {}, message: 'Could not refresh Zoho token' });
      }
    }

    const leadNamesMap = {};
    let tokenRefreshed = false;
    const startTime = Date.now();

    // Process in batches to avoid timeout
    for (let i = 0; i < limitedMobileNumbers.length; i++) {
      const mobile = limitedMobileNumbers[i];

      // Check if we're approaching timeout (20 seconds max for this operation)
      if (Date.now() - startTime > 20000) {
        console.warn(`Zoho search timeout approaching, processed ${i} of ${limitedMobileNumbers.length}`);
        break;
      }

      let result = await searchZohoLead(accessToken, mobile);

      if (result && result.error === 'unauthorized' && !tokenRefreshed) {
        console.log('Access token expired, refreshing...');
        accessToken = await refreshZohoToken();
        tokenRefreshed = true;
        if (accessToken) {
          result = await searchZohoLead(accessToken, mobile);
        }
      }

      if (result && typeof result === 'string') {
        leadNamesMap[mobile] = result;
      }
    }

    console.log(`Zoho lead names fetched: ${Object.keys(leadNamesMap).length} of ${limitedMobileNumbers.length} (requested ${mobile_numbers.length})`);
    return createResponse(200, { success: true, data: leadNamesMap });

  } catch (error) {
    console.error('Unexpected error fetching Zoho lead names:', error);
    return createResponse(500, { message: 'Server error fetching Zoho lead names', error: error.message });
  }
};

// Main handler - wrapped to ensure it always loads
const handlerFunction = async (event, context) => {
  // Don't wait for empty event loop (important for serverless)
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Always log the event to help debug
  console.log('=== Lead Registration Function Called ===');
  console.log('Event path:', event?.path || event?.rawPath || '/');
  console.log('Event method:', event?.httpMethod || event?.requestContext?.http?.method || 'GET');

  // If initialization failed, return error immediately but still try to handle the request
  if (initializationError) {
    console.error('❌ Handler not initialized due to initialization error');
    console.error('Initialization error:', initializationError.message);
    return createResponse(503, {
      error: 'Service unavailable',
      message: initializationError.message || 'Server not initialized',
      path: event?.path || event?.rawPath || '/',
      method: event?.httpMethod || event?.requestContext?.http?.method || 'UNKNOWN',
      note: 'Function file loaded but Supabase initialization failed'
    });
  }

  try {
    const method = event?.httpMethod || event?.requestContext?.http?.method || 'GET';
    const path = event?.path || event?.rawPath || event?.requestContext?.http?.path || '/';

    // Parse query parameters (Netlify uses queryStringParameters)
    // Handle both single and multi-value query params
    let queryParams = {};
    if (event.queryStringParameters) {
      queryParams = { ...event.queryStringParameters };
    }
    // If multiValueQueryStringParameters exists, it takes precedence for arrays
    if (event.multiValueQueryStringParameters) {
      Object.keys(event.multiValueQueryStringParameters).forEach(key => {
        const values = event.multiValueQueryStringParameters[key];
        queryParams[key] = values.length === 1 ? values[0] : values;
      });
    }

    // Parse body safely
    let body = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (parseError) {
        console.error('Error parsing body:', parseError);
        body = {};
      }
    }

    console.log(`📥 ${method} ${path}`);
    console.log('Query params:', JSON.stringify(queryParams));

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      return createResponse(200, {});
    }

    const routeInfo = parsePath(path);
    console.log('Route info:', JSON.stringify(routeInfo));

    // Route handling
    if (method === 'GET') {
      // Test endpoint - always available
      if (routeInfo.path === '/test' || routeInfo.parts[0] === 'test') {
        return createResponse(200, {
          message: 'Lead registration function is working',
          timestamp: new Date().toISOString(),
          supabaseConfigured: supabase && supabase.isConfigured !== false,
          path: path,
          routeInfo: routeInfo
        });
      }
      // Health check endpoint
      if (routeInfo.path === '/health' || routeInfo.parts[0] === 'health') {
        return createResponse(200, {
          status: 'ok',
          function: 'lead-registration',
          supabase: supabase ? (supabase.isConfigured !== false ? 'configured' : 'not configured') : 'not loaded',
          timestamp: new Date().toISOString()
        });
      }
      if (routeInfo.isMobileRoute && routeInfo.mobile) {
        return await GetLeadsByMobile(routeInfo.mobile);
      } else if (routeInfo.id) {
        return await GetLeadById(routeInfo.id);
      } else if (routeInfo.path === '/' || routeInfo.parts.length === 0) {
        return await GetAllLeadRegistrations(queryParams);
      } else {
        return createResponse(404, {
          message: 'Route not found',
          path: routeInfo.path,
          originalPath: path,
          parts: routeInfo.parts
        });
      }
    } else if (method === 'POST') {
      if (routeInfo.isPocDetails) {
        return await GetPocDetailsByReraNumbers(body);
      } else if (routeInfo.isZohoLeads) {
        return await GetZohoLeadNames(body);
      } else if (routeInfo.path === '/' || routeInfo.parts.length === 0) {
        return await CreateLead(body);
      } else {
        return createResponse(404, { message: 'Route not found', path: routeInfo.path });
      }
    } else if (method === 'PUT') {
      if (routeInfo.id) {
        return await UpdateLead(routeInfo.id, body);
      } else {
        return createResponse(400, { message: 'Lead ID is required for update' });
      }
    } else if (method === 'DELETE') {
      if (routeInfo.id) {
        return await DeleteLead(routeInfo.id);
      } else {
        return createResponse(400, { message: 'Lead ID is required for deletion' });
      }
    } else {
      return createResponse(405, { message: `Method ${method} not allowed` });
    }

  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return createResponse(500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error',
      path: event?.path || event?.rawPath || '/',
      method: event?.httpMethod || event?.requestContext?.http?.method || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
};

// Export handler with timeout protection and error catching
module.exports.handler = async (event, context) => {
  try {
    // Add timeout protection (24 seconds, leaving buffer for Netlify's 26s limit)
    const handlerPromise = handlerFunction(event, context);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timeout')), 24000);
    });

    return await Promise.race([handlerPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Handler wrapper error:', error);
    return createResponse(error.message === 'Function execution timeout' ? 504 : 500, {
      error: error.message === 'Function execution timeout' ? 'Gateway timeout' : 'Internal server error',
      message: error.message || 'Unknown error',
      path: event?.path || event?.rawPath || '/',
      method: event?.httpMethod || event?.requestContext?.http?.method || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
};

// Ensure handler is always exported, even if there was an initialization error
if (!module.exports.handler) {
  console.error('❌ Handler not exported, creating fallback handler');
  module.exports.handler = async (event, context) => {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Service unavailable',
        message: initializationError ? initializationError.message : 'Function initialization failed',
        timestamp: new Date().toISOString()
      })
    };
  };
}

// Export a simple test to verify the function loads
console.log('✅ Lead registration function module loaded');
console.log('Handler exported:', typeof module.exports.handler === 'function');
console.log('Supabase initialized:', supabase ? (supabase.isConfigured !== false ? 'Yes' : 'No (dummy)') : 'No');
