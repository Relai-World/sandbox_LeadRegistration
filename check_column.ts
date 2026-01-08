
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://site.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAlternativeContactColumn() {
    console.log('Attempting to add alternative_contact column to unified_data table...');

    // Method 1: Try using RPC if a function exists (unlikely)
    // Method 2: Use raw query if possible (not directly exposed in JS client usually unless via rpc)
    // Since we don't have direct SQL access via the client usually, we might fail here.
    // BUT: often "rpc" is used. 

    // However, often passing raw SQL isn't supported directly by the client for security. 
    // Let's try to just check the error. 

    // Note: changing schema usually requires SQL Editor in dashboard. 
    // I will try to create a "migration" strictly speaking but I can't run it easily.

    // Alternative: The user might have a setup for this. 

    // Wait, I can try to use the 'postgres' library if I had connection string, but I see SUPABASE_URL.
    // The error `SUPABASE_URL is an HTTPS URL but is being used as a Postgres connection string` in previous logs suggests
    // maybe there is a connection string somewhere or I can use `postgres.js`.

    // Let's look at `.env`? No I can't read it directly (security/instruction).

    // Let's try to use the `debug_db.ts` I made earlier to introspect. 

    // IF I cannot execute DDL, I must ask the user to add the column.

    // Let's output a message to the user that I need to add this column.
    // Actually, I'll try to use the `rpc` meant for running SQL if it was set up (unlikely).

    // Checking `server/routes.ts`:
    // The user previously had `debug_db.ts`. 

    console.log("Checking if column exists...");
    const { data, error } = await supabase
        .from('unified_data')
        .select('alternative_contact')
        .limit(1);

    if (error) {
        console.log("Column likely missing:", error.message);
        console.log("\n*** ACTION REQUIRED ***");
        console.log("Please run this SQL in your Supabase SQL Editor:");
        console.log("ALTER TABLE unified_data ADD COLUMN IF NOT EXISTS alternative_contact TEXT;");
    } else {
        console.log("Column exists!");
    }
}

addAlternativeContactColumn();
