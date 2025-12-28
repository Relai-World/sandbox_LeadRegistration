/**
 * Script to reset passwords for specific users
 * Usage: node reset_passwords.js
 * 
 * This script will reset passwords for the users provided:
 * - arora (gatikarorapubg@gmail.com)
 * - suresh (sureshsuresh86882481@gmail.com)
 * - vamshi (b.vamshi0703@gmail.com)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./superbase');

// Default password for all users (change this to your desired password)
const DEFAULT_PASSWORD = 'Password123!';

const usersToReset = [
    {
        email: 'gatikarorapubg@gmail.com',
        username: 'arora',
        newPassword: DEFAULT_PASSWORD
    },
    {
        email: 'sureshsuresh86882481@gmail.com',
        username: 'suresh',
        newPassword: DEFAULT_PASSWORD
    },
    {
        email: 'b.vamshi0703@gmail.com',
        username: 'vamshi',
        newPassword: DEFAULT_PASSWORD
    }
];

async function resetPasswords() {
    console.log('🔄 Starting password reset process...\n');

    // Check if Supabase is configured
    if (!supabase || supabase.isConfigured === false) {
        console.error('❌ Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
        process.exit(1);
    }

    if (typeof supabase.from !== 'function') {
        console.error('❌ Supabase client is not properly initialized');
        process.exit(1);
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of usersToReset) {
        try {
            console.log(`\n📧 Processing: ${user.email} (${user.username})`);

            // Check if user exists
            const { data: existingUser, error: checkError } = await supabase
                .from('UsersData')
                .select('id, email, username')
                .eq('email', user.email.toLowerCase().trim())
                .maybeSingle();

            if (checkError) {
                console.error(`   ❌ Error checking user: ${checkError.message}`);
                failCount++;
                continue;
            }

            if (!existingUser) {
                console.error(`   ❌ User not found in database`);
                failCount++;
                continue;
            }

            console.log(`   ✅ User found: ${existingUser.username || existingUser.email}`);

            // Hash the new password
            const hashedPassword = await bcrypt.hash(user.newPassword, 10);
            console.log(`   🔐 Password hashed successfully`);

            // Update the password
            const { error: updateError } = await supabase
                .from('UsersData')
                .update({ password: hashedPassword })
                .eq('email', user.email.toLowerCase().trim());

            if (updateError) {
                console.error(`   ❌ Error updating password: ${updateError.message}`);
                failCount++;
                continue;
            }

            console.log(`   ✅ Password reset successful!`);
            console.log(`   📝 New password: ${user.newPassword}`);
            successCount++;
        } catch (error) {
            console.error(`   ❌ Unexpected error: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(50));

    if (failCount > 0) {
        process.exit(1);
    }
}

// Run the script
resetPasswords().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

