/**
 * Debug script to check user data in Supabase
 * Usage: node debug_user.js <email>
 */

require('dotenv').config();
const supabase = require('./superbase');

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node debug_user.js <email>');
    process.exit(1);
}

async function debugUser() {
    console.log('🔍 Debugging user:', email);
    console.log('');

    // Check if Supabase is configured
    if (!supabase || supabase.isConfigured === false) {
        console.error('❌ Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
        process.exit(1);
    }

    if (typeof supabase.from !== 'function') {
        console.error('❌ Supabase client is not properly initialized');
        process.exit(1);
    }

    try {
        // Try exact email match
        console.log('📧 Searching for email (exact match):', email);
        const { data: userExact, error: errorExact } = await supabase
            .from('UsersData')
            .select('id, username, email, password, role, created_at')
            .eq('email', email)
            .maybeSingle();

        if (errorExact) {
            console.error('❌ Error querying with exact email:', errorExact);
        } else if (userExact) {
            console.log('✅ User found with exact email match:');
            console.log('   ID:', userExact.id);
            console.log('   Username:', userExact.username);
            console.log('   Email:', userExact.email);
            console.log('   Role:', userExact.role);
            console.log('   Created At:', userExact.created_at);
            console.log('   Password Hash:', userExact.password ? `${userExact.password.substring(0, 20)}... (length: ${userExact.password.length})` : 'NULL');
        } else {
            console.log('❌ No user found with exact email match');
        }

        console.log('');

        // Try normalized email (lowercase + trim)
        const normalizedEmail = email.toLowerCase().trim();
        console.log('📧 Searching for email (normalized):', normalizedEmail);
        const { data: userNormalized, error: errorNormalized } = await supabase
            .from('UsersData')
            .select('id, username, email, password, role, created_at')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (errorNormalized) {
            console.error('❌ Error querying with normalized email:', errorNormalized);
        } else if (userNormalized) {
            console.log('✅ User found with normalized email match:');
            console.log('   ID:', userNormalized.id);
            console.log('   Username:', userNormalized.username);
            console.log('   Email:', userNormalized.email);
            console.log('   Role:', userNormalized.role);
            console.log('   Created At:', userNormalized.created_at);
            console.log('   Password Hash:', userNormalized.password ? `${userNormalized.password.substring(0, 20)}... (length: ${userNormalized.password.length})` : 'NULL');
        } else {
            console.log('❌ No user found with normalized email match');
        }

        console.log('');

        // List all users to see what's in the database
        console.log('📋 Listing all users in UsersData table:');
        const { data: allUsers, error: allError } = await supabase
            .from('UsersData')
            .select('id, username, email, role, created_at')
            .limit(10);

        if (allError) {
            console.error('❌ Error listing users:', allError);
        } else {
            console.log(`   Found ${allUsers.length} users:`);
            allUsers.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (${user.username}) - Role: ${user.role}`);
            });
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        console.error('Error stack:', error.stack);
        process.exit(1);
    }
}

debugUser().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

