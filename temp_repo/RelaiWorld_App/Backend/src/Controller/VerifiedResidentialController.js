const express = require('express');
const router = express.Router();
const VerifiedResidential = require('../Model/VerifiedResidentialModel'); // Adjust path if needed
const UnVerifiedResidential = require('../Model/UnVerifiedResidentialModel'); // Adjust path if needed
const Properties = require('../Model/PropertiesModel');
const supabase = require('../../superbase');

// Search by RERA_Number
const SearchResidentialWithSuggestions = async (req, res) => {
    const { reraNumber, projectName, builderName } = req.query;
  
    if (!reraNumber && !projectName && !builderName) {
      return res.status(400).json({
        message: 'Please provide at least one of: reraNumber, projectName, or builderName'
      });
    }
  
    try {
      const exactQuery = {};
      const suggestionQuery = [];
  
      if (reraNumber) {
        exactQuery.RERA_Number = reraNumber;
        suggestionQuery.push({ RERA_Number: { $regex: reraNumber, $options: 'i' } });
      }
  
      if (projectName) {
        exactQuery.ProjectName = projectName;
        suggestionQuery.push({ ProjectName: { $regex: projectName, $options: 'i' } });
      }
  
      if (builderName) {
        exactQuery.BuilderName = builderName;
        suggestionQuery.push({ BuilderName: { $regex: builderName, $options: 'i' } });
      }
  
      // 🔍 Try to get exact match first
      const exactResult = await VerifiedResidential.findOne(exactQuery);
  
      // 🎯 Get suggestions if exact match fails or for additional context
      const suggestions = await VerifiedResidential.find({
        $or: suggestionQuery
      });
  
      const filteredSuggestions = exactResult
        ? suggestions.filter(item => item._id.toString() !== exactResult._id.toString())
        : suggestions;
  
      res.status(200).json({
        message: exactResult ? 'Exact match and suggestions found' : 'Suggestions found',
        exactMatch: exactResult || null,
        suggestions: filteredSuggestions
      });
  
    } catch (error) {
      console.error('Error fetching project suggestions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

  const StatusCount = async (req, res) => {
    const { email } = req.params;
    console.log('📊 StatusCount - Fetching data for email:', email);
  
    try {
      // Fetch documents from Supabase for both statuses
      const { data: draftsData, error: draftsError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', email)
        .eq('status', 'Unverified')
        .order('updatedat', { ascending: false });

      const { data: submittedData, error: submittedError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', email)
        .eq('status', 'Submitted')
        .order('updatedat', { ascending: false });

      if (draftsError) {
        console.error('Error fetching drafts from Supabase:', draftsError);
        throw draftsError;
      }

      if (submittedError) {
        console.error('Error fetching submitted from Supabase:', submittedError);
        throw submittedError;
      }

      console.log(`✅ Found ${draftsData?.length || 0} drafts and ${submittedData?.length || 0} submitted projects`);
  
      const drafts = (draftsData || []).map((doc) => ({
        _id: doc.id,
        status: 'Draft',
        projectName: doc.projectname,
        builderName: doc.buildername,
        updatedAt: doc.updatedat,
        RERA_Number: doc.rera_number,
        ProjectType: doc.communitytype,
        Number_of_Floors: doc.number_of_floors,
        Flats_Per_Floor: doc.number_of_flats_per_floor,
        Possession_Date: doc.possession_date,
        Open_Space: doc.open_space + '%',
        Carpet_Area_Percentage: doc.carpet_area_percentage + '%',
        Floor_to_Ceiling_Height: doc.floor_to_ceiling_height + ' ft',
        Commission_Percentage: doc.commission_percentage + '%',
        POC_Name: doc.poc_name,
        POC_Contact: doc.poc_contact,
        POC_Role: doc.poc_role,
        POC_CP: doc.cp || false
      }));
  
      const submitted = (submittedData || []).map((doc) => ({
        _id: doc.id,
        status: 'Submitted',
        projectName: doc.projectname,
        builderName: doc.buildername,
        updatedAt: doc.updatedat,
        RERA_Number: doc.rera_number,
        ProjectType: doc.communitytype,
        Number_of_Floors: doc.number_of_floors,
        Flats_Per_Floor: doc.number_of_flats_per_floor,
        Possession_Date: doc.possession_date,
        Open_Space: doc.open_space + '%',
        Carpet_Area_Percentage: doc.carpet_area_percentage + '%',
        Floor_to_Ceiling_Height: doc.floor_to_ceiling_height + ' ft',
        Commission_Percentage: doc.commission_percentage + '%',
        POC_Name: doc.poc_name,
        POC_Contact: doc.poc_contact,
        POC_Role: doc.poc_role,
        POC_CP: doc.cp || false
      }));
  
      const total = drafts.length + submitted.length;
  
      res.status(200).json({
        email,
        total,
        draftsCount: drafts.length,
        submittedCount: submitted.length,
        drafts,
        submitted
      });
  
    } catch (error) {
      console.error('Error fetching status count:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };


  const GetAllVerifiedResidentialData = async (req, res) => {
    try {
      // Only fetch data from VerifiedResidentialData collection
      const verified = await VerifiedResidential.find({}).sort({ createdAt: -1 }); // Latest first
  
      res.status(200).json({
        success: true,
        message: 'Fetched verified residential data sorted by createdAt date',
        data: {
          verified,
          unverified: [], // Return empty array for unverified to maintain compatibility
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch residential data',
        error: error.message,
      });
    }
  };
  

// Get unique dropdown values for Project Name, Builder Name, RERA Number, City, and State
const GetDropdownValues = async (req, res) => {
  try {
    console.log('📋 Fetching dropdown values from Supabase unified_data table...');
    
    // Check if supabase is configured
    if (!supabase || !supabase.isConfigured) {
      console.error('❌ Supabase client not configured');
      return res.status(500).json({
        success: false,
        message: 'Database not configured',
        error: 'Supabase client not initialized'
      });
    }

    // Log Supabase URL (first 30 chars for security)
    const supabaseUrl = process.env.SUPABASE_URL || 'not set';
    console.log(`   🔗 Connecting to: ${supabaseUrl.substring(0, 30)}...`);

    // Test query first to verify connection and table access
    // Try selecting all columns first to see if it's a column issue
    // Also try with explicit schema specification
    let testData, testError, testCount;
    
    // First try without explicit schema
    const result1 = await supabase
      .from('unified_data')
      .select('*', { count: 'exact' })
      .limit(5);
    
    testData = result1.data;
    testError = result1.error;
    testCount = result1.count;
    
    // If that fails, try with public schema explicitly
    if (testError || !testData || testData.length === 0) {
      console.log('   Trying with explicit public schema...');
      const result2 = await supabase
        .schema('public')
        .from('unified_data')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (!testError && result2.error) {
        testError = result2.error;
      }
      if (result2.data && result2.data.length > 0) {
        testData = result2.data;
        testCount = result2.count;
      }
    }

    if (testError) {
      console.error('❌ Test query error:', testError);
      console.error('   Error code:', testError.code);
      console.error('   Error message:', testError.message);
      console.error('   Error details:', testError.details);
      console.error('   Error hint:', testError.hint);
      throw testError;
    }

    console.log(`✅ Test query successful. Found ${testData?.length || 0} records in sample`);
    console.log(`   Total count in table: ${testCount || 'unknown'}`);
    if (testData && testData.length > 0) {
      console.log(`   Sample record keys:`, Object.keys(testData[0]));
      console.log(`   Sample projectname:`, testData[0].projectname);
      console.log(`   Sample buildername:`, testData[0].buildername);
    } else {
      console.log('   ⚠️  No data returned - checking if RLS might be blocking...');
      // Try a count query to see if RLS is the issue
      const { count: countOnly, error: countError } = await supabase
        .from('unified_data')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('   ❌ Count query also failed:', countError.message);
      } else {
        console.log(`   📊 Count query result: ${countOnly || 0} total rows`);
      }
    }

    // If test query returned no data, don't proceed with pagination
    if (!testData || testData.length === 0) {
      console.log('⚠️  Test query returned no data. Returning empty arrays.');
      return res.status(200).json({
        success: true,
        data: {
          projectNames: [],
          builderNames: [],
          reraNumbers: [],
          cities: [],
          states: []
        }
      });
    }

    // Fetch all data using pagination (Supabase has a max limit of 1000 per query)
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('unified_data')
        .select('projectname, buildername, rera_number, city, state')
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('❌ Supabase query error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += batchSize;
        hasMore = data.length === batchSize;
        console.log(`   Fetched batch: ${data.length} records (total so far: ${allData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`📊 Fetched ${allData.length} total records from unified_data table`);

    // Also fetch from Unverified_Properties table
    console.log('📋 Fetching dropdown values from Unverified_Properties table...');
    let unverifiedData = [];
    let unverifiedFrom = 0;
    let unverifiedHasMore = true;

    while (unverifiedHasMore) {
      const { data, error } = await supabase
        .from('Unverified_Properties')
        .select('projectname, buildername, rera_number, areaname')
        .range(unverifiedFrom, unverifiedFrom + batchSize - 1);

      if (error) {
        console.error('⚠️ Error fetching from Unverified_Properties (continuing with unified_data only):', error.message);
        break; // Continue with unified_data data only
      }

      if (data && data.length > 0) {
        unverifiedData = unverifiedData.concat(data);
        unverifiedFrom += batchSize;
        unverifiedHasMore = data.length === batchSize;
        console.log(`   Fetched batch from Unverified_Properties: ${data.length} records (total so far: ${unverifiedData.length})`);
      } else {
        unverifiedHasMore = false;
      }
    }

    console.log(`📊 Fetched ${unverifiedData.length} total records from Unverified_Properties table`);

    // Extract unique values - keep all distinct entries to preserve data integrity
    // Multiple entries with similar names but different cases may represent different properties
    const projectNamesSet = new Set();
    const builderNamesSet = new Set();
    const reraNumbersSet = new Set();
    const citiesSet = new Set();
    const statesSet = new Set();

    // Process unified_data
    allData.forEach(item => {
      if (item.projectname && String(item.projectname).trim()) {
        projectNamesSet.add(String(item.projectname).trim());
      }
      if (item.buildername && String(item.buildername).trim()) {
        builderNamesSet.add(String(item.buildername).trim());
      }
      if (item.rera_number && String(item.rera_number).trim()) {
        reraNumbersSet.add(String(item.rera_number).trim());
      }
      if (item.city && String(item.city).trim()) {
        citiesSet.add(String(item.city).trim());
      }
      if (item.state && String(item.state).trim()) {
        statesSet.add(String(item.state).trim());
      }
    });

    // Process Unverified_Properties (add to sets - duplicates will be automatically ignored)
    unverifiedData.forEach(item => {
      if (item.projectname && String(item.projectname).trim()) {
        projectNamesSet.add(String(item.projectname).trim());
      }
      if (item.buildername && String(item.buildername).trim()) {
        builderNamesSet.add(String(item.buildername).trim());
      }
      if (item.rera_number && String(item.rera_number).trim()) {
        reraNumbersSet.add(String(item.rera_number).trim());
      }
      // Note: Unverified_Properties may not have city/state fields, so we skip those
    });

    // Convert sets to sorted arrays
    const cleanedProjectNames = Array.from(projectNamesSet).sort();
    const cleanedBuilderNames = Array.from(builderNamesSet).sort();
    const cleanedReraNumbers = Array.from(reraNumbersSet).sort();
    const cleanedCities = Array.from(citiesSet).sort();
    const cleanedStates = Array.from(statesSet).sort();

    console.log(`✅ Found ${cleanedProjectNames.length} projects, ${cleanedBuilderNames.length} builders, ${cleanedReraNumbers.length} RERA numbers, ${cleanedCities.length} cities, ${cleanedStates.length} states (combined from unified_data and Unverified_Properties)`);

    res.status(200).json({
      success: true,
      data: {
        projectNames: cleanedProjectNames,
        builderNames: cleanedBuilderNames,
        reraNumbers: cleanedReraNumbers,
        cities: cleanedCities,
        states: cleanedStates
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dropdown values:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dropdown values',
      error: error.message,
      details: error.details || null
    });
  }
};

// Helper function to map Unverified_Properties data to frontend format
const mapUnverifiedPropertyToFrontendFormat = (propertyData) => {
  // Handle configurations
  let configurations = [];
  const isVillaProject = propertyData.project_type === 'Villa' || propertyData.project_type === 'Villas';
  
  if (propertyData.configurations && Array.isArray(propertyData.configurations) && propertyData.configurations.length > 0) {
    configurations = propertyData.configurations.map(config => {
      const transformedConfig = {
        type: config.type,
        facing: config.facing || null,
        No_of_car_Parking: config.No_of_car_Parking || null,
        uds: config.uds !== undefined && config.uds !== null ? config.uds : null,
        configsoldoutstatus: config.configsoldoutstatus || config.configSoldOutStatus || 'active'
      };
      
      if (isVillaProject) {
        transformedConfig.sizeSqFt = config.sizeSqFt || null;
        transformedConfig.sizeSqYd = config.sizeSqYd || null;
      } else {
        transformedConfig.sizeRange = config.sizeRange || config.sizeSqFt || null;
        transformedConfig.sizeUnit = config.sizeUnit || 'Sq ft';
      }
      
      return transformedConfig;
    });
  }

  // Map Unverified_Properties schema to frontend expected format
  return {
    // Basic Information
    ProjectName: propertyData.projectname,
    BuilderName: propertyData.buildername,
    RERA_Number: propertyData.rera_number,
    AreaName: propertyData.areaname,
    ProjectLocation: propertyData.projectlocation,
    Project_Type: propertyData.project_type,
    BuildingName: propertyData.buildingname,
    CommunityType: propertyData.communitytype,
    
    // Project Scale
    Total_land_Area: propertyData.total_land_area,
    Number_of_Towers: propertyData.number_of_towers,
    Number_of_Floors: propertyData.number_of_floors,
    Number_of_Flats_Per_Floor: propertyData.number_of_flats_per_floor,
    Total_Number_of_Units: propertyData.total_number_of_units,
    
    // Dates & Status
    Launch_Date: propertyData.project_launch_date,
    Possession_Date: propertyData.possession_date,
    Construction_Status: propertyData.construction_status,
    
    // Specifications
    Open_Space: propertyData.open_space,
    Carpet_area_Percentage: propertyData.carpet_area_percentage,
    Floor_to_Ceiling_Height: propertyData.floor_to_ceiling_height,
    Price_per_sft: propertyData.price_per_sft,
    Total_Buildup_Area: propertyData.total_buildup_area,
    UDS: propertyData.uds,
    FSI: propertyData.fsi,
    Main_Door_Height: propertyData.main_door_height,
    
    // Amenities
    External_Amenities: propertyData.external_amenities,
    Specification: propertyData.specification,
    PowerBackup: propertyData.powerbackup,
    No_of_Passenger_lift: propertyData.no_of_passenger_lift,
    No_of_Service_lift: propertyData.no_of_service_lift,
    Visitor_Parking: propertyData.visitor_parking,
    Ground_vehicle_Movement: propertyData.ground_vehicle_movement,
    
    // Financial
    'Base Project Price': propertyData.baseprojectprice,
    baseprojectprice: propertyData.baseprojectprice,
    Commission_percentage: propertyData.commission_percentage,
    Amount_For_Extra_Car_Parking: propertyData.amount_for_extra_car_parking,
    Home_Loan: propertyData.home_loan,
    What_is_there_Price: propertyData.what_is_there_price,
    What_is_Relai_Price: propertyData.what_is_relai_price,
    Floor_Rise_Charges: propertyData.floor_rise_charges,
    Floor_Rise_Amount_per_Floor: propertyData.floor_rise_amount_per_floor,
    Floor_Rise_Applicable_Above_Floor_No: propertyData.floor_rise_applicable_above_floor_no,
    Facing_Charges: propertyData.facing_charges,
    Preferential_Location_Charges: propertyData.preferential_location_charges,
    Preferential_Location_Charges_Conditions: propertyData.preferential_location_charges_conditions,
    Available_Banks_for_Loan: propertyData.available_banks_for_loan,
    
    // Builder Information
    Builder_Age: propertyData.builder_age,
    Builder_Total_Properties: propertyData.builder_total_properties,
    Builder_Upcoming_Properties: propertyData.builder_upcoming_properties,
    Builder_Completed_Properties: propertyData.builder_completed_properties,
    Builder_Ongoing_Projects: propertyData.builder_ongoing_projects,
    Builder_Origin_City: propertyData.builder_origin_city,
    Builder_Operating_Locations: propertyData.builder_operating_locations,
    Previous_Complaints_on_Builder: propertyData.previous_complaints_on_builder,
    Complaint_Details: propertyData.complaint_details,
    Construction_Material: propertyData.construction_material,
    
    // Lead Registration
    After_agreement_of_sale_what_is_payout_time_period: propertyData.after_agreement_of_sale_what_is_payout_time_period,
    Is_Lead_Registration_Required_Before_Site_Visit: propertyData.is_lead_registration_required_before_site_visit,
    Turnaround_Time_for_Lead_Acknowledgement: propertyData.turnaround_time_for_lead_acknowledgement,
    Is_There_Validity_Period_for_Registered_Lead: propertyData.is_there_validity_period_for_registered_lead,
    Validity_Period_Value: propertyData.validity_period_value,
    Person_to_Confirm_Registration: propertyData.person_to_confirm_registration,
    Notes_Comments_on_Lead_Registration_Workflow: propertyData.notes_comments_on_lead_registration_workflow,
    Accepted_Modes_of_Lead_Registration: propertyData.accepted_modes_of_lead_registration,
    
    // POC Information
    POC_Name: propertyData.poc_name,
    POC_Contact: propertyData.poc_contact,
    POC_Role: propertyData.poc_role,
    POC_CP: propertyData.cp || false,
    Contact: propertyData.contact,
    
    // Additional
    ProjectBrochure: propertyData.projectbrochure,
    Pricesheet_Link: propertyData.pricesheet_link_1,
    Project_Status: propertyData.project_status || null,
    
    // City and State
    City: propertyData.city || null,
    State: propertyData.state || null,
    
    // Location Data (may not exist in Unverified_Properties, set to null)
    Google_Place_ID: propertyData.google_place_id || null,
    Google_Place_Name: propertyData.google_place_name || null,
    Google_Place_Address: propertyData.google_place_address || null,
    Google_Place_Location: propertyData.google_place_location || null,
    Google_Place_Rating: propertyData.google_place_rating || null,
    Google_Place_User_Ratings_Total: propertyData.google_place_user_ratings_total || null,
    Google_Maps_URL: propertyData.google_maps_url || null,
    Mobile_Google_Map_URL: propertyData.mobile_google_map_url || null,
    
    // Connectivity & Amenities Scores (may not exist in Unverified_Properties, set to null)
    Connectivity_Score: propertyData.connectivity_score || null,
    Amenities_Score: propertyData.amenities_score || null,
    GRID_Score: propertyData.GRID_Score || null,
    
    // Nearby Places (may not exist in Unverified_Properties, set to null)
    Hospitals_Count: propertyData.hospitals_count || null,
    Shopping_Malls_Count: propertyData.shopping_malls_count || null,
    Schools_Count: propertyData.schools_count || null,
    Restaurants_Count: propertyData.restaurants_count || null,
    Restaurants_Above_4_Stars_Count: propertyData.restaurants_above_4_stars_count || null,
    Supermarkets_Count: propertyData.supermarkets_count || null,
    IT_Offices_Count: propertyData.it_offices_count || null,
    Metro_Stations_Count: propertyData.metro_stations_count || null,
    Railway_Stations_Count: propertyData.railway_stations_count || null,
    Nearest_Hospitals: propertyData.nearest_hospitals || null,
    Nearest_Shopping_Malls: propertyData.nearest_shopping_malls || null,
    Nearest_Schools: propertyData.nearest_schools || null,
    Nearest_Restaurants: propertyData.nearest_restaurants || null,
    High_Rated_Restaurants: propertyData.high_rated_restaurants || null,
    Nearest_Supermarkets: propertyData.nearest_supermarkets || null,
    Nearest_IT_Offices: propertyData.nearest_it_offices || null,
    Nearest_Metro_Station: propertyData.nearest_metro_station || null,
    Nearest_Railway_Station: propertyData.nearest_railway_station || null,
    Nearest_ORR_Access: propertyData.nearest_orr_access || null,
    
    // Unit Configurations
    configurations: configurations
  };
};

// Get property details by Project Name or RERA Number
const GetPropertyDetails = async (req, res) => {
  try {
    const { projectName, reraNumber } = req.query;

    if (!projectName && !reraNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either projectName or reraNumber'
      });
    }

    if (projectName && reraNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide only one of projectName or reraNumber, not both'
      });
    }

    console.log(`🔍 Fetching property details for: ${projectName || reraNumber}`);

    // First, search in Unverified_Properties table
    console.log('🔍 Step 1: Searching in Unverified_Properties table...');
    let unverifiedQuery = supabase.from('Unverified_Properties').select('*');

    if (projectName) {
      // Use exact match for project names
      unverifiedQuery = unverifiedQuery.eq('projectname', projectName);
      console.log(`   Searching by projectName: "${projectName}"`);
    } else if (reraNumber) {
      // Use case-insensitive match for RERA numbers
      unverifiedQuery = unverifiedQuery.ilike('rera_number', reraNumber);
      console.log(`   Searching by reraNumber: "${reraNumber}"`);
    }

    const { data: unverifiedData, error: unverifiedError } = await unverifiedQuery.maybeSingle();

    if (unverifiedError && unverifiedError.code !== 'PGRST116') {
      console.error('❌ Supabase query error (Unverified_Properties):', unverifiedError);
      console.error('   Error code:', unverifiedError.code);
      console.error('   Error message:', unverifiedError.message);
      // Continue to search in unified_data even if there's an error
    }

    // If found in Unverified_Properties, return that data
    if (unverifiedData && !unverifiedError) {
      console.log(`✅ Found property in Unverified_Properties: ${unverifiedData.projectname || unverifiedData.rera_number}`);
      console.log(`   RERA Number: ${unverifiedData.rera_number}`);
      const mappedData = mapUnverifiedPropertyToFrontendFormat(unverifiedData);
      
      return res.status(200).json({
        success: true,
        message: 'Property details fetched successfully from Unverified_Properties',
        data: mappedData,
        source: 'Unverified_Properties'
      });
    } else {
      console.log('⚠️ Property not found in Unverified_Properties table');
    }

    // If not found in Unverified_Properties, search in unified_data table
    console.log('🔍 Step 2: Not found in Unverified_Properties, searching in unified_data table...');
    let query = supabase.from('unified_data').select('*');

    if (projectName) {
      // Use exact match for project names to distinguish between similar names with different cases
      // e.g., "INDRAPRASTHA" vs "Indraprastha" are different properties
      query = query.eq('projectname', projectName);
      console.log(`   Searching by projectName: "${projectName}"`);
    } else if (reraNumber) {
      // Use case-insensitive match for RERA numbers (typically should match regardless of case)
      query = query.ilike('rera_number', reraNumber);
      console.log(`   Searching by reraNumber: "${reraNumber}"`);
    }

    // Fetch all rows for the project (some projects have multiple rows for different configurations)
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Property not found in either Unverified_Properties or unified_data table');
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyData = data[0];
    console.log(`✅ Found property in unified_data: ${propertyData.projectname} (${data.length} row(s) found)`);

    // Handle configurations based on database structure
    let configurations = [];
    const isVillaProject = propertyData.project_type === 'Villa';
    
    // Check if the first row has a configurations array (new structure)
    if (propertyData.configurations && Array.isArray(propertyData.configurations) && propertyData.configurations.length > 0) {
      // Transform configurations based on project type
      configurations = propertyData.configurations.map(config => {
        const transformedConfig = {
          type: config.type,
          facing: config.facing || null,
          No_of_car_Parking: config.No_of_car_Parking || null,
          uds: config.uds !== undefined && config.uds !== null ? config.uds : null,
          configsoldoutstatus: config.configsoldoutstatus || config.configSoldOutStatus || 'active'
        };
        
        // For Villa projects, include separate sizeSqFt and sizeSqYd
        if (isVillaProject) {
          transformedConfig.sizeSqFt = config.sizeSqFt || null;
          transformedConfig.sizeSqYd = config.sizeSqYd || null;
        } else {
          // For Apartment projects, include sizeRange and sizeUnit
          // If the data has sizeSqFt but not sizeRange, use sizeSqFt as sizeRange
          transformedConfig.sizeRange = config.sizeRange || config.sizeSqFt || null;
          transformedConfig.sizeUnit = config.sizeUnit || 'Sq ft';
        }
        
        return transformedConfig;
      });
    } 
    // Otherwise, combine all rows into configurations array (legacy structure with multiple rows)
    else if (data.length > 0) {
      configurations = data
        .filter(row => row.bhk || row.sqfeet || row.sqyard) // Only rows with configuration data
        .map(row => {
          const config = {
            type: row.bhk ? `${row.bhk} BHK` : null,
            facing: row.facing || null,
            No_of_car_Parking: row.no_of_car_parkings ? parseInt(row.no_of_car_parkings) : null,
            configsoldoutstatus: row.configsoldoutstatus || 'active'
          };
          
          // For Villa projects, include separate sizeSqFt and sizeSqYd
          if (isVillaProject) {
            config.sizeSqFt = row.sqfeet ? parseFloat(row.sqfeet) : null;
            config.sizeSqYd = row.sqyard ? parseFloat(row.sqyard) : null;
          } else {
            // For Apartment projects, include sizeRange and sizeUnit
            config.sizeRange = row.sqfeet ? parseFloat(row.sqfeet) : null;
            config.sizeUnit = 'Sq ft';
          }
          
          return config;
        })
        .filter(config => config.type !== null); // Remove invalid configs
    }

    // Map Supabase unified_data schema to frontend expected format
    const mappedData = {
      // Basic Information
      ProjectName: propertyData.projectname,
      BuilderName: propertyData.buildername,
      RERA_Number: propertyData.rera_number,
      AreaName: propertyData.areaname,
      ProjectLocation: propertyData.projectlocation,
      Project_Type: propertyData.project_type,
      BuildingName: propertyData.buildingname,
      CommunityType: propertyData.communitytype,
      
      // Project Scale
      Total_land_Area: propertyData.total_land_area,
      Number_of_Towers: propertyData.number_of_towers,
      Number_of_Floors: propertyData.number_of_floors,
      Number_of_Flats_Per_Floor: propertyData.number_of_flats_per_floor,
      Total_Number_of_Units: propertyData.total_number_of_units,
      
      // Dates & Status
      Launch_Date: propertyData.project_launch_date,
      Possession_Date: propertyData.possession_date,
      Construction_Status: propertyData.construction_status,
      
      // Specifications
      Open_Space: propertyData.open_space,
      Carpet_area_Percentage: propertyData.carpet_area_percentage,
      Floor_to_Ceiling_Height: propertyData.floor_to_ceiling_height,
      Price_per_sft: propertyData.price_per_sft,
      Total_Buildup_Area: propertyData.total_buildup_area,
      UDS: propertyData.uds,
      FSI: propertyData.fsi,
      Main_Door_Height: propertyData.main_door_height,
      
      // Amenities
      External_Amenities: propertyData.external_amenities,
      Specification: propertyData.specification,
      PowerBackup: propertyData.powerbackup,
      No_of_Passenger_lift: propertyData.no_of_passenger_lift,
      No_of_Service_lift: propertyData.no_of_service_lift,
      Visitor_Parking: propertyData.visitor_parking,
      Ground_vehicle_Movement: propertyData.ground_vehicle_movement,
      
      // Financial
      'Base Project Price': propertyData.baseprojectprice,
      baseprojectprice: propertyData.baseprojectprice,
      Commission_percentage: propertyData.commission_percentage,
      Amount_For_Extra_Car_Parking: propertyData.amount_for_extra_car_parking,
      Home_Loan: propertyData.home_loan,
      What_is_there_Price: propertyData.what_is_there_price,
      What_is_Relai_Price: propertyData.what_is_relai_price,
      Floor_Rise_Charges: propertyData.floor_rise_charges,
      Floor_Rise_Amount_per_Floor: propertyData.floor_rise_amount_per_floor,
      Floor_Rise_Applicable_Above_Floor_No: propertyData.floor_rise_applicable_above_floor_no,
      Facing_Charges: propertyData.facing_charges,
      Preferential_Location_Charges: propertyData.preferential_location_charges,
      Preferential_Location_Charges_Conditions: propertyData.preferential_location_charges_conditions,
      Available_Banks_for_Loan: propertyData.available_banks_for_loan,
      
      // Builder Information
      Builder_Age: propertyData.builder_age,
      Builder_Total_Properties: propertyData.builder_total_properties,
      Builder_Upcoming_Properties: propertyData.builder_upcoming_properties,
      Builder_Completed_Properties: propertyData.builder_completed_properties,
      Builder_Ongoing_Projects: propertyData.builder_ongoing_projects,
      Builder_Origin_City: propertyData.builder_origin_city,
      Builder_Operating_Locations: propertyData.builder_operating_locations,
      Previous_Complaints_on_Builder: propertyData.previous_complaints_on_builder,
      Complaint_Details: propertyData.complaint_details,
      Construction_Material: propertyData.construction_material,
      
      // Lead Registration
      After_agreement_of_sale_what_is_payout_time_period: propertyData.after_agreement_of_sale_what_is_payout_time_period,
      Is_Lead_Registration_Required_Before_Site_Visit: propertyData.is_lead_registration_required_before_site_visit,
      Turnaround_Time_for_Lead_Acknowledgement: propertyData.turnaround_time_for_lead_acknowledgement,
      Is_There_Validity_Period_for_Registered_Lead: propertyData.is_there_validity_period_for_registered_lead,
      Validity_Period_Value: propertyData.validity_period_value,
      Person_to_Confirm_Registration: propertyData.person_to_confirm_registration,
      Notes_Comments_on_Lead_Registration_Workflow: propertyData.notes_comments_on_lead_registration_workflow,
      Accepted_Modes_of_Lead_Registration: propertyData.accepted_modes_of_lead_registration,
      
      // POC Information
      POC_Name: propertyData.poc_name,
      POC_Contact: propertyData.poc_contact,
      POC_Role: propertyData.poc_role,
      POC_CP: propertyData.cp || false,
      Contact: propertyData.contact,
      
      // Additional
      ProjectBrochure: propertyData.projectbrochure,
      Pricesheet_Link: propertyData.pricesheet_link_1,
      Project_Status: propertyData.project_status,
      
      // City and State
      City: propertyData.city,
      State: propertyData.state,
      
      // Location Data
      Google_Place_ID: propertyData.google_place_id,
      Google_Place_Name: propertyData.google_place_name,
      Google_Place_Address: propertyData.google_place_address,
      Google_Place_Location: propertyData.google_place_location,
      Google_Place_Rating: propertyData.google_place_rating,
      Google_Place_User_Ratings_Total: propertyData.google_place_user_ratings_total,
      Google_Maps_URL: propertyData.google_maps_url,
      Mobile_Google_Map_URL: propertyData.mobile_google_map_url,
      
      // Connectivity & Amenities Scores
      Connectivity_Score: propertyData.connectivity_score,
      Amenities_Score: propertyData.amenities_score,
      GRID_Score: propertyData.GRID_Score,
      
      // Nearby Places
      Hospitals_Count: propertyData.hospitals_count,
      Shopping_Malls_Count: propertyData.shopping_malls_count,
      Schools_Count: propertyData.schools_count,
      Restaurants_Count: propertyData.restaurants_count,
      Restaurants_Above_4_Stars_Count: propertyData.restaurants_above_4_stars_count,
      Supermarkets_Count: propertyData.supermarkets_count,
      IT_Offices_Count: propertyData.it_offices_count,
      Metro_Stations_Count: propertyData.metro_stations_count,
      Railway_Stations_Count: propertyData.railway_stations_count,
      Nearest_Hospitals: propertyData.nearest_hospitals,
      Nearest_Shopping_Malls: propertyData.nearest_shopping_malls,
      Nearest_Schools: propertyData.nearest_schools,
      Nearest_Restaurants: propertyData.nearest_restaurants,
      High_Rated_Restaurants: propertyData.high_rated_restaurants,
      Nearest_Supermarkets: propertyData.nearest_supermarkets,
      Nearest_IT_Offices: propertyData.nearest_it_offices,
      Nearest_Metro_Station: propertyData.nearest_metro_station,
      Nearest_Railway_Station: propertyData.nearest_railway_station,
      Nearest_ORR_Access: propertyData.nearest_orr_access,
      
      // Unit Configurations
      configurations: configurations
    };

    res.status(200).json({
      success: true,
      message: 'Property details fetched successfully from unified_data',
      data: mappedData,
      source: 'unified_data'
    });
  } catch (error) {
    console.error('❌ Error fetching property details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property details',
      error: error.message
    });
  }
};

// Get all properties from properties collection
const GetAllProperties = async (req, res) => {
  try {
    const properties = await Properties.find({}).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Fetched all properties from properties collection',
      data: properties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
};

// Update property sold out status
const UpdatePropertySoldOut = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { soldOut } = req.body;

    if (!soldOut || !['yes', 'no'].includes(soldOut)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid soldOut value. Must be "yes" or "no"'
      });
    }

    const updatedProperty = await Properties.findByIdAndUpdate(
      propertyId,
      { soldOut },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property sold out status updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property sold out status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property sold out status',
      error: error.message
    });
  }
};

module.exports = {
    SearchResidentialWithSuggestions,
    StatusCount,
    GetAllVerifiedResidentialData,
    GetDropdownValues,
    GetPropertyDetails,
    GetAllProperties,
    UpdatePropertySoldOut
};