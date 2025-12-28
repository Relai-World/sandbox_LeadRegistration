create table public."Unverified_Properties" (
  id uuid not null default gen_random_uuid (),
  rera_number text not null,
  projectname text not null,
  buildername text not null,
  areaname text null,
  baseprojectprice numeric not null,
  projectbrochure text null,
  pricesheet_link text null,
  pricesheet_link_1 text null,
  contact numeric null,
  projectlocation text null,
  project_type public.project_type_enum not null,
  buildingname text null,
  communitytype public.community_type_enum not null,
  total_land_area text not null,
  total_buildup_area text null,
  uds text null,
  fsi numeric null,
  number_of_towers integer not null,
  number_of_floors integer not null,
  number_of_flats_per_floor integer not null,
  total_number_of_units integer not null,
  project_launch_date timestamp with time zone null,
  possession_date timestamp with time zone null,
  construction_status public.construction_status_enum not null,
  open_space numeric not null,
  carpet_area_percentage numeric not null,
  floor_to_ceiling_height numeric not null,
  main_door_height numeric null,
  price_per_sft numeric not null,
  external_amenities text null,
  specification text null,
  powerbackup public.power_backup_enum not null,
  no_of_passenger_lift integer not null,
  no_of_service_lift integer not null,
  visitor_parking public.visitor_parking_enum not null,
  ground_vehicle_movement public.ground_movement_enum not null,
  configurations jsonb not null default '[]'::jsonb,
  amount_for_extra_car_parking numeric not null,
  home_loan public.home_loan_enum null,
  available_banks_for_loan jsonb null default '[]'::jsonb,
  previous_complaints_on_builder public.yes_no_enum null,
  complaint_details text null,
  construction_material public.construction_material_enum not null,
  builder_age integer null,
  builder_total_properties integer null,
  builder_upcoming_properties integer null,
  builder_completed_properties integer null,
  builder_ongoing_projects integer null,
  builder_origin_city text null,
  builder_operating_locations jsonb null default '[]'::jsonb,
  floor_rise_charges public.yes_no_enum null,
  floor_rise_amount_per_floor numeric null,
  floor_rise_applicable_above_floor_no integer null,
  facing_charges public.yes_no_enum null,
  preferential_location_charges public.yes_no_enum null,
  preferential_location_charges_conditions text null,
  commission_percentage numeric not null,
  what_is_there_price numeric null,
  what_is_relai_price numeric null,
  after_agreement_of_sale_what_is_payout_time_period numeric not null,
  is_lead_registration_required_before_site_visit public.yes_no_enum null,
  turnaround_time_for_lead_acknowledgement numeric not null,
  is_there_validity_period_for_registered_lead public.yes_no_enum not null,
  validity_period_value numeric null,
  person_to_confirm_registration jsonb not null,
  notes_comments_on_lead_registration_workflow text null,
  accepted_modes_of_lead_registration jsonb null,
  status public.status_enum not null default 'Unverified'::status_enum,
  useremail text not null,
  poc_name text not null,
  poc_contact numeric not null,
  poc_role text not null,
  createdat timestamp with time zone null default now(),
  updatedat timestamp with time zone null default now(),
  verified boolean not null default false,
  constraint Unverified_Properties_pkey primary key (id),
  constraint Unverified_Properties_rera_number_key unique (rera_number)
) TABLESPACE pg_default;

-- Comments explaining the new fields
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
