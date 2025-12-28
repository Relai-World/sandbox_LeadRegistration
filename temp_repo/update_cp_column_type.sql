-- Migration: Update cp column from boolean to text to support dropdown values
-- This allows saving 'Accepting', 'On-boarded', 'Not-accepted', or empty string

-- Step 1: Update Unverified_Properties table (only if cp is boolean)
DO $$
BEGIN
  -- Check if cp column exists and is boolean type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Unverified_Properties' 
    AND column_name = 'cp'
    AND data_type = 'boolean'
  ) THEN
    ALTER TABLE public."Unverified_Properties" 
    ALTER COLUMN cp TYPE text USING 
      CASE 
        WHEN cp = true THEN 'Accepting'
        WHEN cp = false THEN ''
        ELSE NULL
      END;
    RAISE NOTICE 'Updated Unverified_Properties.cp from boolean to text';
  ELSE
    RAISE NOTICE 'Unverified_Properties.cp is already text or does not exist';
  END IF;
END $$;

-- Step 2: Update unified_data table (only if cp is boolean)
DO $$
BEGIN
  -- Check if cp column exists and is boolean type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'unified_data' 
    AND column_name = 'cp'
    AND data_type = 'boolean'
  ) THEN
    ALTER TABLE public."unified_data" 
    ALTER COLUMN cp TYPE text USING 
      CASE 
        WHEN cp = true THEN 'Accepting'
        WHEN cp = false THEN ''
        ELSE NULL
      END;
    RAISE NOTICE 'Updated unified_data.cp from boolean to text';
  ELSE
    RAISE NOTICE 'unified_data.cp is already text or does not exist';
  END IF;
END $$;

-- After running this migration:
-- - Old true values → 'Accepting'
-- - Old false values → '' (empty string)
-- - New values can be: 'Accepting', 'On-boarded', 'Not-accepted', or ''
-- - If column is already text, no changes are made
