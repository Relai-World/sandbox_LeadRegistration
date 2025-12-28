-- Migration: Update construction_status_enum to include new values
-- This allows saving "Under Construction", "About to RTM", and "RTM" directly
--
-- IMPORTANT: Run this SQL in Supabase SQL Editor
-- The enum will be updated to include the new values

-- Add new enum values to the existing enum type
-- Note: In PostgreSQL, ADD VALUE can only be done in a transaction
-- Supabase may require running these one at a time

ALTER TYPE public.construction_status_enum ADD VALUE IF NOT EXISTS 'Under Construction';
ALTER TYPE public.construction_status_enum ADD VALUE IF NOT EXISTS 'About to RTM';
ALTER TYPE public.construction_status_enum ADD VALUE IF NOT EXISTS 'RTM';

-- After running this migration, the enum will have these values:
-- - 'Not Started' (existing)
-- - 'Ongoing' (existing)
-- - 'Ready to Move in' (existing)
-- - 'Under Construction' (NEW)
-- - 'About to RTM' (NEW)
-- - 'RTM' (NEW)

-- The existing data with 'Ongoing' and 'Ready to Move in' will remain unchanged.
-- New data can now use 'Under Construction', 'About to RTM', or 'RTM' directly.

-- Verification query (run after migration):
-- SELECT unnest(enum_range(NULL::public.construction_status_enum));
