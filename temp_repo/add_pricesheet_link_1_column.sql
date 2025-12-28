-- Add pricesheet_link_1 column to Unverified_Properties table
-- This replaces the old pricesheet_link field

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS pricesheet_link_1 text null;

-- Add comment for the new column
COMMENT ON COLUMN public."Unverified_Properties".pricesheet_link_1 IS 'URL link to the project price sheet document';

