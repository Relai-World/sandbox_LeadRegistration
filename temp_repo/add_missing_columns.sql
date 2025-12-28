-- Add missing columns to existing Unverified_Properties table

-- Property Location & Details
ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS areaname text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS pricesheet_link text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS pricesheet_link_1 text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS total_buildup_area text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS uds text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS fsi numeric null;

-- Physical Specifications
ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS main_door_height numeric null;

-- Builder Information
ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_age integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_total_properties integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_upcoming_properties integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_completed_properties integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_ongoing_projects integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_origin_city text null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS builder_operating_locations jsonb null default '[]'::jsonb;

-- Financial & Loan Details
ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS available_banks_for_loan jsonb null default '[]'::jsonb;

-- Pricing Charges
ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS floor_rise_charges public.yes_no_enum null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS floor_rise_amount_per_floor numeric null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS floor_rise_applicable_above_floor_no integer null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS facing_charges public.yes_no_enum null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS preferential_location_charges public.yes_no_enum null;

ALTER TABLE public."Unverified_Properties" 
ADD COLUMN IF NOT EXISTS preferential_location_charges_conditions text null;

-- Add helpful comments
COMMENT ON COLUMN public."Unverified_Properties".areaname IS 'Area or locality name where the project is located';
COMMENT ON COLUMN public."Unverified_Properties".pricesheet_link IS 'URL link to the project price sheet document';
COMMENT ON COLUMN public."Unverified_Properties".pricesheet_link_1 IS 'URL link to the project price sheet document (new field)';
COMMENT ON COLUMN public."Unverified_Properties".total_buildup_area IS 'Total built-up area of the project';
COMMENT ON COLUMN public."Unverified_Properties".uds IS 'Undivided Share of Land';
COMMENT ON COLUMN public."Unverified_Properties".fsi IS 'Floor Space Index / Floor Area Ratio';
COMMENT ON COLUMN public."Unverified_Properties".main_door_height IS 'Height of main door in feet';
COMMENT ON COLUMN public."Unverified_Properties".available_banks_for_loan IS 'Array of banks available for home loan approval - stored as JSON array';
COMMENT ON COLUMN public."Unverified_Properties".builder_age IS 'Age of the builder company in years';
COMMENT ON COLUMN public."Unverified_Properties".builder_total_properties IS 'Total number of properties by the builder';
COMMENT ON COLUMN public."Unverified_Properties".builder_upcoming_properties IS 'Number of upcoming properties by the builder';
COMMENT ON COLUMN public."Unverified_Properties".builder_completed_properties IS 'Number of completed properties by the builder';
COMMENT ON COLUMN public."Unverified_Properties".builder_ongoing_projects IS 'Number of ongoing projects by the builder';
COMMENT ON COLUMN public."Unverified_Properties".builder_origin_city IS 'City where the builder company originated';
COMMENT ON COLUMN public."Unverified_Properties".builder_operating_locations IS 'Cities/locations where builder operates - stored as JSON array';
COMMENT ON COLUMN public."Unverified_Properties".floor_rise_charges IS 'Whether floor rise charges are applicable (Yes/No)';
COMMENT ON COLUMN public."Unverified_Properties".floor_rise_amount_per_floor IS 'Amount charged per floor if floor rise charges apply';
COMMENT ON COLUMN public."Unverified_Properties".floor_rise_applicable_above_floor_no IS 'Floor number above which floor rise charges apply';
COMMENT ON COLUMN public."Unverified_Properties".facing_charges IS 'Whether facing charges are applicable (Yes/No)';
COMMENT ON COLUMN public."Unverified_Properties".preferential_location_charges IS 'Whether preferential location charges apply (Yes/No)';
COMMENT ON COLUMN public."Unverified_Properties".preferential_location_charges_conditions IS 'Conditions or units where preferential location charges apply';
