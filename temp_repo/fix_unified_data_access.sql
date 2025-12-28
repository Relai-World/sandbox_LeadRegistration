-- QUICK FIX: Allow service_role to access unified_data table
-- Run this in your Supabase SQL Editor

-- Option 1: Disable RLS temporarily (for testing)
-- This will allow all access regardless of policies
ALTER TABLE public.unified_data DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create a permissive policy
-- Uncomment the lines below and comment out Option 1

-- CREATE POLICY IF NOT EXISTS "service_role_full_access" 
-- ON public.unified_data 
-- FOR ALL 
-- TO service_role 
-- USING (true) 
-- WITH CHECK (true);

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'unified_data';

-- Test query
SELECT COUNT(*) as total_rows FROM public.unified_data;
SELECT projectname, buildername, rera_number, city, state 
FROM public.unified_data 
LIMIT 5;

