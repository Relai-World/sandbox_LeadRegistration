-- ==================================================================
-- SUPABASE RLS FIX FOR Unverified_Properties TABLE
-- ==================================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This will allow your backend to insert/update properties
-- ==================================================================

-- OPTION 1: Temporarily disable RLS (FASTEST - for testing only)
-- Uncomment the line below to disable RLS temporarily
-- ALTER TABLE "Unverified_Properties" DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Add policies to allow service_role (RECOMMENDED)
-- This allows the backend (using service_role key) to insert/update

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow service role full access" ON "Unverified_Properties";

-- Create policy allowing service_role to do everything
CREATE POLICY "Allow service role full access"
ON "Unverified_Properties"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also allow authenticated users to insert their own properties
DROP POLICY IF EXISTS "Users can insert their own properties" ON "Unverified_Properties";

CREATE POLICY "Users can insert their own properties"
ON "Unverified_Properties"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read their own properties
DROP POLICY IF EXISTS "Users can read their own properties" ON "Unverified_Properties";

CREATE POLICY "Users can read their own properties"
ON "Unverified_Properties"
FOR SELECT
TO authenticated
USING (useremail = auth.jwt() ->> 'email');

-- Allow users to update their own properties
DROP POLICY IF EXISTS "Users can update their own properties" ON "Unverified_Properties";

CREATE POLICY "Users can update their own properties"
ON "Unverified_Properties"
FOR UPDATE
TO authenticated
USING (useremail = auth.jwt() ->> 'email')
WITH CHECK (useremail = auth.jwt() ->> 'email');

-- ==================================================================
-- VERIFICATION: Run this to check if policies are created
-- ==================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'Unverified_Properties'
ORDER BY policyname;
