-- SQL Migration: Add UDS field to configurations array in Unverified_Properties and unified_data tables
-- This query adds the 'uds' field to each configuration object in the configurations JSONB array
-- If 'uds' doesn't exist, it will be set to null

-- ============================================
-- 1. Update Unverified_Properties table
-- ============================================
UPDATE public."Unverified_Properties"
SET configurations = (
  SELECT jsonb_agg(
    CASE 
      WHEN config ? 'uds' THEN config
      ELSE config || jsonb_build_object('uds', null)
    END
  )
  FROM jsonb_array_elements(configurations) AS config
)
WHERE configurations IS NOT NULL 
  AND jsonb_typeof(configurations) = 'array'
  AND jsonb_array_length(configurations) > 0;

-- ============================================
-- 2. Update unified_data table
-- ============================================
UPDATE public."unified_data"
SET configurations = (
  SELECT jsonb_agg(
    CASE 
      WHEN config ? 'uds' THEN config
      ELSE config || jsonb_build_object('uds', null)
    END
  )
  FROM jsonb_array_elements(configurations) AS config
)
WHERE configurations IS NOT NULL 
  AND jsonb_typeof(configurations) = 'array'
  AND jsonb_array_length(configurations) > 0;

-- ============================================
-- Verification Queries (Optional - run to check results)
-- ============================================

-- Check Unverified_Properties configurations with UDS field
-- SELECT 
--   id,
--   rera_number,
--   projectname,
--   configurations
-- FROM public."Unverified_Properties"
-- WHERE configurations IS NOT NULL
-- LIMIT 5;

-- Check unified_data configurations with UDS field
-- SELECT 
--   id,
--   rera_number,
--   projectname,
--   configurations
-- FROM public."unified_data"
-- WHERE configurations IS NOT NULL
-- LIMIT 5;

-- Count how many configurations were updated in Unverified_Properties
-- SELECT COUNT(*) as updated_count
-- FROM public."Unverified_Properties"
-- WHERE configurations IS NOT NULL 
--   AND jsonb_typeof(configurations) = 'array'
--   AND jsonb_array_length(configurations) > 0
--   AND EXISTS (
--     SELECT 1 
--     FROM jsonb_array_elements(configurations) AS config
--     WHERE config ? 'uds'
--   );

-- Count how many configurations were updated in unified_data
-- SELECT COUNT(*) as updated_count
-- FROM public."unified_data"
-- WHERE configurations IS NOT NULL 
--   AND jsonb_typeof(configurations) = 'array'
--   AND jsonb_array_length(configurations) > 0
--   AND EXISTS (
--     SELECT 1 
--     FROM jsonb_array_elements(configurations) AS config
--     WHERE config ? 'uds'
--   );
