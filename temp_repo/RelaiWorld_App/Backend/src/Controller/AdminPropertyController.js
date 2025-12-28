const supabase = require('../../superbase');
const Properties = require('../Model/PropertiesModel');

// Get all properties with optional email filter
const GetAllPropertiesForAdmin = async (req, res) => {
  try {
    const { email, status } = req.query;

    let query = supabase
      .from('Unverified_Properties')
      .select('*')
      .order('updatedat', { ascending: false });

    if (email && email !== 'all' && email !== 'admin@relai.world') {
      query = query.eq('useremail', email);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        message: 'Error fetching properties',
        error: error.message
      });
    }

    // Map Supabase data to frontend format
    const mappedData = data.map(item => ({
      _id: item.id,
      ProjectName: item.projectname,
      BuilderName: item.buildername,
      RERA_Number: item.rera_number,
      UserEmail: item.useremail,
      status: item.status,
      createdAt: item.createdat,
      updatedAt: item.updatedat,
      ProjectType: item.project_type,
      Number_of_Floors: item.number_of_floors,
      Flats_Per_Floor: item.number_of_flats_per_floor,
      Possession_Date: item.possession_date,
      Open_Space: item.open_space,
      Carpet_Area_Percentage: item.carpet_area_percentage,
      Floor_to_Ceiling_Height: item.floor_to_ceiling_height,
      Commission_Percentage: item.commission_percentage,
      POC_Name: item.poc_name,
      POC_Contact: item.poc_contact,
      POC_Role: item.poc_role,
      POC_CP: item.cp || false,
      configurations: item.configurations
    }));

    return res.status(200).json({
      success: true,
      data: mappedData
    });
  } catch (error) {
    console.error('❌ Unexpected error in GetAllPropertiesForAdmin:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all unique agent emails
const GetAllAgentEmails = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Unverified_Properties')
      .select('useremail')
      .not('useremail', 'is', null)
      .order('useremail');

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        message: 'Error fetching agent emails',
        error: error.message
      });
    }

    // Get unique emails
    const uniqueEmails = [...new Set(data.map(item => item.useremail))].filter(Boolean);

    return res.status(200).json({
      success: true,
      emails: uniqueEmails
    });
  } catch (error) {
    console.error('❌ Unexpected error in GetAllAgentEmails:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify a property - copy to unified_data and delete from Unverified_Properties
const VerifyProperty = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🔄 Starting verification for property ID: ${id}`);

    // Step 1: Fetch the property from Unverified_Properties
    const { data: sourceProperty, error: fetchError } = await supabase
      .from('Unverified_Properties')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching property:', fetchError);
      return res.status(404).json({
        message: 'Property not found',
        error: fetchError.message
      });
    }

    if (!sourceProperty) {
      return res.status(404).json({
        message: 'Property not found'
      });
    }

    console.log(`📋 Found property: ${sourceProperty.projectname} (RERA: ${sourceProperty.rera_number})`);

    // Step 2: Fetch ALL existing rows from unified_data for this RERA number
    const { data: existingRows, error: checkError } = await supabase
      .from('unified_data')
      .select('*')
      .eq('rera_number', sourceProperty.rera_number);

    if (checkError) {
      console.error('❌ Error checking unified_data:', checkError);
      return res.status(500).json({
        message: 'Error checking for existing property in unified_data',
        error: checkError.message
      });
    }

    console.log(`📊 Found ${existingRows?.length || 0} existing row(s) in unified_data`);

    // Helper to check if value is actually empty (including literal "null"/"undefined" strings)
    const isValueEmpty = (val) => {
      if (val === null || val === undefined || val === '') return true;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' || trimmed === 'null' || trimmed === 'undefined';
      }
      return false;
    };

    // Helper to normalize a value for signature matching (treats empty values as empty string)
    const normalizeForSignature = (val) => {
      if (isValueEmpty(val)) return '';
      return String(val).trim().toLowerCase();
    };

    // Helper function to normalize signature value (treats all empty values as null)
    const normalizeSignatureValue = (val) => {
      if (isValueEmpty(val)) return null;
      return String(val).trim().toLowerCase();
    };

    // Helper function to extract normalized signature components
    const getSignatureComponents = (config) => {
      const bhkValue = config.type ? config.type.replace(' BHK', '') : config.bhk;
      return {
        bhk: normalizeSignatureValue(bhkValue),
        facing: normalizeSignatureValue(config.facing),
        size: normalizeSignatureValue(config.sizeRange || config.sqfeet),
        parking: normalizeSignatureValue(config.No_of_car_Parking !== undefined ? config.No_of_car_Parking : config.no_of_car_parkings)
      };
    };

    // Create strict signature for exact matching
    const getStrictSignature = (components) => {
      return `${components.bhk || ''}|${components.facing || ''}|${components.size || ''}|${components.parking || ''}`;
    };

    // Apply updates to cached row for future strict matches
    const applyUpdatesInCache = (cachedRow, updateData) => {
      // Update row object fields
      for (const [key, value] of Object.entries(updateData)) {
        cachedRow.row[key] = value;
      }
      // Update signature if signature fields changed
      cachedRow.signature = getSignatureComponents(cachedRow.row);
    };

    // Find strict match (checks all rows, even consumed ones)
    const findStrictMatch = (normConfig, rowsById) => {
      const subSignature = getStrictSignature(normConfig);
      for (const cached of rowsById) {
        const rowSignature = getStrictSignature(cached.signature);
        if (rowSignature === subSignature) {
          return cached;
        }
      }
      return null;
    };

    // Find wildcard match (skips consumed rows)
    const findWildcardMatch = (normConfig, rowsById, consumedRowIds) => {
      const wildcardCandidates = [];

      for (const cached of rowsById) {
        // Skip already consumed rows
        if (consumedRowIds.has(cached.row.id)) continue;

        let isCandidate = true;
        // Check each signature field
        ['bhk', 'facing', 'size', 'parking'].forEach(field => {
          const rowVal = cached.signature[field];
          const subVal = normConfig[field];

          // If both have values, they must match
          if (rowVal !== null && subVal !== null && rowVal !== subVal) {
            isCandidate = false;
          }
        });

        if (isCandidate) {
          wildcardCandidates.push(cached);
        }
      }

      // Accept wildcard match only if exactly one candidate
      if (wildcardCandidates.length === 1) {
        console.log(`🔍 Wildcard match found for config (filling empty fields)`);
        return wildcardCandidates[0];
      } else if (wildcardCandidates.length > 1) {
        console.warn(`⚠️ Ambiguous match: ${wildcardCandidates.length} candidates found - treating as new configuration`);
      }

      return null;
    };

    // Step 3: Build cached row structures
    const rowsById = (existingRows || []).map(row => ({
      row: row,
      signature: getSignatureComponents(row)
    }));
    const consumedRowIds = new Set(); // Track rows used by wildcard matches

    // Step 4: Process configurations - update existing or prepare for insert
    const configurations = sourceProperty.configurations || [];
    const rowsToUpdate = [];
    const rowsToInsert = [];

    if (configurations.length > 0) {
      configurations.forEach(config => {
        // Normalize submission config once
        const normConfig = getSignatureComponents(config);

        // Stage 1: Try strict match (checks all rows, even consumed ones)
        let matchedCached = findStrictMatch(normConfig, rowsById);
        let matchType = matchedCached ? 'strict' : null;

        // Stage 2: If no strict match, try wildcard (skips consumed rows)
        if (!matchedCached) {
          matchedCached = findWildcardMatch(normConfig, rowsById, consumedRowIds);
          matchType = matchedCached ? 'wildcard' : null;
        }

        const existingRow = matchedCached?.row;

        // Build the data object from agent submission
        const submissionData = {
          rera_number: sourceProperty.rera_number,
          projectname: sourceProperty.projectname,
          buildername: sourceProperty.buildername,
          baseprojectprice: sourceProperty.baseprojectprice,
          projectbrochure: sourceProperty.projectbrochure,
          contact: sourceProperty.contact,
          projectlocation: sourceProperty.projectlocation,
          project_type: sourceProperty.project_type,
          buildingname: sourceProperty.buildingname,
          communitytype: sourceProperty.communitytype,
          total_land_area: sourceProperty.total_land_area,
          number_of_towers: sourceProperty.number_of_towers,
          number_of_floors: sourceProperty.number_of_floors,
          number_of_flats_per_floor: sourceProperty.number_of_flats_per_floor,
          total_number_of_units: sourceProperty.total_number_of_units,
          project_launch_date: sourceProperty.project_launch_date,
          possession_date: sourceProperty.possession_date,
          construction_status: sourceProperty.construction_status,
          open_space: sourceProperty.open_space,
          carpet_area_percentage: sourceProperty.carpet_area_percentage,
          floor_to_ceiling_height: sourceProperty.floor_to_ceiling_height,
          price_per_sft: sourceProperty.price_per_sft,
          external_amenities: sourceProperty.external_amenities,
          specification: sourceProperty.specification,
          powerbackup: sourceProperty.powerbackup,
          no_of_passenger_lift: sourceProperty.no_of_passenger_lift,
          no_of_service_lift: sourceProperty.no_of_service_lift,
          visitor_parking: sourceProperty.visitor_parking,
          ground_vehicle_movement: sourceProperty.ground_vehicle_movement,
          // Configuration-specific fields
          bhk: config.type ? config.type.replace(' BHK', '') : null,
          facing: config.facing || null,
          sqfeet: config.sizeRange ? String(config.sizeRange) : null,
          sqyard: null,
          no_of_car_parkings: config.No_of_car_Parking !== undefined && config.No_of_car_Parking !== null ? String(config.No_of_car_Parking) : null,
          // Additional fields
          amount_for_extra_car_parking: sourceProperty.amount_for_extra_car_parking,
          home_loan: sourceProperty.home_loan,
          // previous_complaints_on_builder removed - column doesn't exist in unified_data table
          complaint_details: sourceProperty.complaint_details,
          construction_material: sourceProperty.construction_material,
          commission_percentage: sourceProperty.commission_percentage,
          what_is_there_price: sourceProperty.what_is_there_price,
          what_is_relai_price: sourceProperty.what_is_relai_price,
          after_agreement_of_sale_what_is_payout_time_period: sourceProperty.after_agreement_of_sale_what_is_payout_time_period,
          is_lead_registration_required_before_site_visit: sourceProperty.is_lead_registration_required_before_site_visit,
          turnaround_time_for_lead_acknowledgement: sourceProperty.turnaround_time_for_lead_acknowledgement,
          is_there_validity_period_for_registered_lead: sourceProperty.is_there_validity_period_for_registered_lead,
          validity_period_value: sourceProperty.validity_period_value,
          person_to_confirm_registration: sourceProperty.person_to_confirm_registration,
          notes_comments_on_lead_registration_workflow: sourceProperty.notes_comments_on_lead_registration_workflow,
          accepted_modes_of_lead_registration: sourceProperty.accepted_modes_of_lead_registration,
          status: sourceProperty.status,
          useremail: sourceProperty.useremail,
          poc_name: sourceProperty.poc_name,
          poc_contact: sourceProperty.poc_contact,
          poc_role: sourceProperty.poc_role,
          cp: sourceProperty.cp || false,
          areaname: sourceProperty.areaname,
          pricesheet_link_1: sourceProperty.pricesheet_link_1,
          total_buildup_area: sourceProperty.total_buildup_area,
          uds: sourceProperty.uds,
          fsi: sourceProperty.fsi,
          main_door_height: sourceProperty.main_door_height,
          // Builder-related fields removed - these columns don't exist in unified_data table:
          // builder_age, builder_total_properties, builder_upcoming_properties,
          // builder_completed_properties, builder_ongoing_projects, builder_origin_city,
          // builder_operating_locations
          available_banks_for_loan: sourceProperty.available_banks_for_loan,
          floor_rise_charges: sourceProperty.floor_rise_charges,
          floor_rise_amount_per_floor: sourceProperty.floor_rise_amount_per_floor,
          floor_rise_applicable_above_floor_no: sourceProperty.floor_rise_applicable_above_floor_no,
          facing_charges: sourceProperty.facing_charges,
          preferential_location_charges: sourceProperty.preferential_location_charges,
          preferential_location_charges_conditions: sourceProperty.preferential_location_charges_conditions,
          project_status: 'Verified',
          verified: true
        };

        if (existingRow) {
          // Configuration exists - build update object with only null fields
          const updateData = {};
          let hasUpdates = false;

          for (const [key, value] of Object.entries(submissionData)) {
            // Skip id and rera_number
            if (key === 'id' || key === 'rera_number') continue;
wh
            // Update if existing value is null/empty and submission has a value
            const isExistingNull = isValueEmpty(existingRow[key]);
            const hasSubmissionValue = !isValueEmpty(value);

            if (isExistingNull && hasSubmissionValue) {
              updateData[key] = value;
              hasUpdates = true;
            }
          }

          if (hasUpdates) {
            rowsToUpdate.push({
              id: existingRow.id,
              updates: updateData,
              matchType: matchType
            });
            // Apply updates to cache so future iterations see filled values
            applyUpdatesInCache(matchedCached, updateData);
            // Mark wildcard matches as consumed
            if (matchType === 'wildcard') {
              consumedRowIds.add(existingRow.id);
            }
          } else {
            // Even if no updates, mark wildcard match as consumed
            if (matchType === 'wildcard') {
              consumedRowIds.add(existingRow.id);
            }
          }
        } else {
          // Configuration doesn't exist - prepare for insert
          rowsToInsert.push(submissionData);
        }
      });
    }

    // Step 5: Execute updates for matched configurations
    for (const updateItem of rowsToUpdate) {
      const { error: updateError } = await supabase
        .from('unified_data')
        .update(updateItem.updates)
        .eq('id', updateItem.id);

      if (updateError) {
        console.error(`❌ Error updating row ${updateItem.id}:`, updateError);
        return res.status(500).json({
          message: `Error updating unified_data row ${updateItem.id}`,
          error: updateError.message
        });
      }
      console.log(`✅ Updated row ${updateItem.id} with ${Object.keys(updateItem.updates).length} field(s) [${updateItem.matchType} match]`);
    }

    // Step 6: Insert new configurations (if any)
    if (rowsToInsert.length > 0) {
      // Get max ID for new rows
      const { data: maxIdData } = await supabase
        .from('unified_data')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextId = 1;
      if (maxIdData && maxIdData.id) {
        nextId = parseInt(maxIdData.id) + 1;
      }

      // Assign IDs to new rows
      rowsToInsert.forEach((row, index) => {
        row.id = nextId + index;
      });

      const { error: insertError } = await supabase
        .from('unified_data')
        .insert(rowsToInsert);

      if (insertError) {
        console.error('❌ Error inserting new configurations:', insertError);
        return res.status(500).json({
          message: 'Error inserting new configurations to unified_data',
          error: insertError.message,
          details: insertError.details
        });
      }
      console.log(`✅ Inserted ${rowsToInsert.length} new configuration(s)`);
    }

    console.log(`📊 Verification summary: ${rowsToUpdate.length} updated, ${rowsToInsert.length} inserted`);

    // Step 7: Delete from Unverified_Properties
    const { error: deleteError } = await supabase
      .from('Unverified_Properties')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting from unverified table:', deleteError);
      return res.status(500).json({
        message: 'Error removing property from unverified table',
        error: deleteError.message
      });
    }

    console.log(`✅ Property removed from unverified table`);
    console.log(`🎉 Verification complete for: ${sourceProperty.projectname}`);

    return res.status(200).json({
      success: true,
      message: rowsToUpdate.length > 0
        ? `Property verified: ${rowsToUpdate.length} configuration(s) updated, ${rowsToInsert.length} new configuration(s) added`
        : `Property verified: ${rowsToInsert.length} configuration(s) added to unified_data`,
      data: {
        projectname: sourceProperty.projectname,
        rera_number: sourceProperty.rera_number,
        updated: rowsToUpdate.length,
        inserted: rowsToInsert.length
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in VerifyProperty:', error);
    return res.status(500).json({
      message: 'Server error during verification',
      error: error.message
    });
  }
};

// Get unified_data property data by project name for comparison
const GetMongoPropertyByName = async (req, res) => {
  try {
    const { projectName } = req.params;

    if (!projectName) {
      return res.status(400).json({
        message: 'Project name is required'
      });
    }

    console.log(`🔍 Fetching unified_data property for: ${projectName}`);

    // Find property in unified_data table
    const { data: properties, error } = await supabase
      .from('unified_data')
      .select('*')
      .ilike('projectname', projectName);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        message: 'Error fetching property from unified_data',
        error: error.message
      });
    }

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        message: 'Property not found in unified_data',
        projectName
      });
    }

    console.log(`✅ Found property in unified_data: ${projectName} (${properties.length} row(s))`);

    // Merge multiple rows into a single object with configurations array
    if (properties.length === 0) {
      return res.status(404).json({
        message: 'Property not found in unified_data',
        projectName
      });
    }

    // Take the first row as base (common fields)
    const baseProperty = { ...properties[0] };

    // Extract configurations from all rows
    const configurations = properties.map(row => ({
      type: row.bhk ? `${row.bhk} BHK` : null,
      facing: row.facing || null,
      sizeUnit: 'Sq ft',
      sizeRange: row.sqfeet ? parseFloat(row.sqfeet) : null,
      No_of_car_Parking: row.no_of_car_parkings ? parseInt(row.no_of_car_parkings) : null
    })).filter(config => config.type || config.sizeRange); // Only include valid configurations

    // Remove configuration-specific fields from base object
    delete baseProperty.bhk;
    delete baseProperty.facing;
    delete baseProperty.sqfeet;
    delete baseProperty.sqyard;
    delete baseProperty.no_of_car_parkings;

    // Remove Google/location data fields (from project_status to GRID_Score)
    const fieldsToExclude = [
      'project_status',
      'google_place_id',
      'google_place_name',
      'google_place_address',
      'google_place_location',
      'google_place_rating',
      'google_place_user_ratings_total',
      'google_maps_url',
      'google_place_raw_data',
      'hospitals_count',
      'shopping_malls_count',
      'schools_count',
      'restaurants_count',
      'restaurants_above_4_stars_count',
      'supermarkets_count',
      'it_offices_count',
      'metro_stations_count',
      'railway_stations_count',
      'nearest_hospitals',
      'nearest_shopping_malls',
      'nearest_schools',
      'nearest_restaurants',
      'high_rated_restaurants',
      'nearest_supermarkets',
      'nearest_it_offices',
      'nearest_metro_station',
      'nearest_railway_station',
      'nearest_orr_access',
      'connectivity_score',
      'amenities_score',
      'amenities_raw_data',
      'amenities_updated_at',
      'mobile_google_map_url',
      'GRID_Score'
    ];

    fieldsToExclude.forEach(field => delete baseProperty[field]);

    // Add configurations array to base object
    baseProperty.configurations = configurations;

    // Return merged object
    return res.status(200).json({
      success: true,
      data: baseProperty
    });

  } catch (error) {
    console.error('❌ Error in GetMongoPropertyByName:', error);
    return res.status(500).json({
      message: 'Server error fetching property from unified_data',
      error: error.message
    });
  }
};

// Get Supabase unverified property data by project name for comparison
const GetVerifiedPropertyByName = async (req, res) => {
  try {
    const { projectName } = req.params;

    if (!projectName) {
      return res.status(400).json({
        message: 'Project name is required'
      });
    }

    console.log(`🔍 Fetching unverified property data for: ${projectName}`);

    // Find property in Unverified_Properties table (agent submissions)
    const { data: property, error } = await supabase
      .from('Unverified_Properties')
      .select('*')
      .ilike('projectname', projectName)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        message: 'Error fetching unverified property',
        error: error.message
      });
    }

    if (!property) {
      return res.status(404).json({
        message: 'Property not found in unverified properties',
        projectName
      });
    }

    console.log(`✅ Found unverified property: ${property.projectname}`);

    return res.status(200).json({
      success: true,
      data: property
    });

  } catch (error) {
    console.error('❌ Error in GetVerifiedPropertyByName:', error);
    return res.status(500).json({
      message: 'Server error fetching unverified property',
      error: error.message
    });
  }
};

module.exports = {
  GetAllPropertiesForAdmin,
  GetAllAgentEmails,
  VerifyProperty,
  GetMongoPropertyByName,
  GetVerifiedPropertyByName
};
