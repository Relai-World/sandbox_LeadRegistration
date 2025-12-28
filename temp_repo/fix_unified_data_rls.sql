-- Fix RLS policies for unified_data table to allow service_role access
-- Run this in your Supabase SQL Editor

-- 1. First, check current RLS status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'unified_data';

-- 2. Check existing policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'unified_data';

-- 3. Drop any existing restrictive policies (optional - be careful in production)
-- DROP POLICY IF EXISTS "restrictive_policy_name" ON public.unified_data;

-- 4. Create a policy that allows service_role full access
-- This should allow the backend service to read all data
CREATE POLICY IF NOT EXISTS "service_role_full_access_unified_data" 
ON public.unified_data 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Also create a policy for authenticated users to read (if needed for frontend)
CREATE POLICY IF NOT EXISTS "authenticated_read_unified_data" 
ON public.unified_data 
FOR SELECT 
TO authenticated 
USING (true);

-- 6. If you want to allow anonymous access for reads (less secure, but might be needed)
-- CREATE POLICY IF NOT EXISTS "anon_read_unified_data" 
-- ON public.unified_data 
-- FOR SELECT 
-- TO anon 
-- USING (true);

-- 7. Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'unified_data';

-- 8. Test query (should work now)
SELECT COUNT(*) as total_rows FROM public.unified_data;
SELECT projectname, buildername, rera_number, city, state 
FROM public.unified_data 
LIMIT 5;

