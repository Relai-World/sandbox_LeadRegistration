-- ==================================================================
-- ADD "Submitted" TO status_enum IN SUPABASE
-- ==================================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This will add "Submitted" as a valid status value
-- ==================================================================

-- Add "Submitted" to the status_enum type
ALTER TYPE status_enum ADD VALUE IF NOT EXISTS 'Submitted';

-- Verify the enum values
SELECT enum_range(NULL::status_enum);
