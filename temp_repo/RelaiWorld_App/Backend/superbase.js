require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate URL format
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseServiceKey || !isValidUrl(supabaseUrl)) {
    if (!supabaseUrl) {
        console.warn('⚠️  SUPABASE_URL not found in environment variables.');
    } else if (!isValidUrl(supabaseUrl)) {
        console.warn('⚠️  SUPABASE_URL is invalid. Must be a valid HTTP or HTTPS URL.');
        console.warn(`   Current value: ${supabaseUrl ? (supabaseUrl.substring(0, 20) + '...') : 'undefined'}`);
    }
    if (!supabaseServiceKey) {
        console.warn('⚠️  SUPABASE_SERVICE_KEY not found in environment variables.');
    }
    console.warn('   Creating a dummy Supabase client. Server will start but database operations will fail.');
    console.warn('   To fix: Set valid SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
    
    const dummySupabase = {
        from: () => {
            throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
        },
        auth: {
            signUp: () => {
                throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
            },
            signIn: () => {
                throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
            }
        }
    };
    
    dummySupabase.isConfigured = false;
    module.exports = dummySupabase;
} else {
    try {
        // When using service_role key, we don't need the x-supabase-role header
        // The service_role key itself grants service_role permissions and bypasses RLS
        const supabase = createClient(supabaseUrl.trim(), supabaseServiceKey.trim(), {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        });
        console.log('✅ Supabase client initialized successfully with service role key.');
        console.log('   Service role key bypasses RLS automatically.');
        supabase.isConfigured = true;
        module.exports = supabase;
    } catch (error) {
        console.error('❌ Failed to create Supabase client:', error.message);
        console.warn('   Creating a dummy Supabase client. Server will start but database operations will fail.');
        
        const dummySupabase = {
            from: () => {
                throw new Error('Supabase client creation failed: ' + error.message);
            },
            auth: {
                signUp: () => {
                    throw new Error('Supabase client creation failed: ' + error.message);
                },
                signIn: () => {
                    throw new Error('Supabase client creation failed: ' + error.message);
                }
            }
        };
        
        dummySupabase.isConfigured = false;
        module.exports = dummySupabase;
    }
}
