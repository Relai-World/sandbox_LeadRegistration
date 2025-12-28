-- Check RLS policies on unified_data table
-- This will help diagnose why queries return 0 rows

-- 1. Check if RLS is enabled on unified_data table
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'unified_data';

-- 2. Check existing RLS policies
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
WHERE tablename = 'unified_data';

-- 3. If RLS is blocking service_role access, you may need to:
--    Option A: Disable RLS (not recommended for production)
--    ALTER TABLE public.unified_data DISABLE ROW LEVEL SECURITY;

--    Option B: Create a policy that allows service_role to read all data
--    CREATE POLICY "Allow service_role full access" ON public.unified_data
--    FOR ALL
--    TO service_role
--    USING (true)
--    WITH CHECK (true);

--    Option C: Create a policy that allows all authenticated users to read
--    CREATE POLICY "Allow authenticated read" ON public.unified_data
--    FOR SELECT
--    TO authenticated
--    USING (true);

-- 4. Test query to verify access
SELECT COUNT(*) as total_rows FROM public.unified_data;
SELECT projectname, buildername, rera_number, city, state 
FROM public.unified_data 
LIMIT 5;

