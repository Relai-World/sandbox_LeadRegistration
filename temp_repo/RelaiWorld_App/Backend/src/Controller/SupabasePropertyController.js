const supabase = require('../../superbase');

const validateAndFormatDate = (dateValue) => {
  if (!dateValue) return null;

  // Handle RTM as a special string value - save as null since timestamp field can't store 'RTM'
  // We'll handle 'RTM' display on the frontend based on construction_status
  if (typeof dateValue === 'string' && dateValue.toUpperCase() === 'RTM') {
    return null; // Save as null, frontend will handle 'RTM' display
  }

  if (typeof dateValue === 'string' && dateValue.trim() === '') {
    return null;
  }

  // Try to parse the date
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    // If not a valid date, return null
    return null;
  }

  // Return the date value as-is (should be in YYYY-MM-DD format from frontend)
  // Supabase will convert it to timestamp automatically
  return dateValue;
};

const toTitleCase = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Map CommunityType to valid enum values
const mapCommunityType = (communityType) => {
  if (!communityType) return 'Gated Community';
  
  const normalized = communityType.trim();
  
  // Handle all possible variations
  if (normalized === 'Gated' || normalized === 'Gated Community') {
    return 'Gated Community';
  }
  if (normalized === 'Semi-Gated' || normalized === 'Semi_Gated' || normalized === 'Semi-Gated Community') {
    return 'Semi-Gated Community';
  }
  if (normalized === 'Standalone' || normalized === 'Stand-alone' || normalized === 'Open Community') {
    return 'Standalone';
  }
  
  // Default to Gated Community if unknown value
  return 'Gated Community';
};

const mapFrontendDataToSupabaseSchema = (data) => {
  const configurations = Array.isArray(data.configurations)
    ? data.configurations
    : [];

  const personToConfirmRegistration = Array.isArray(data.person_to_confirm_registration)
    ? data.person_to_confirm_registration
    : [data.person_to_confirm_registration || { name: '', contact: '' }];

  const acceptedModesOfLeadRegistration = data.Accepted_Modes_of_Lead_Registration || {};

  const totalNumberOfUnits = data.Total_Number_of_Units ||
    (data.Numbger_of_Floors && data.Number_of_Flats_Per_Floor
      ? data.Numbger_of_Floors * data.Number_of_Flats_Per_Floor
      : 0);

  return {
    rera_number: data.RERA_Number || '',
    projectname: data.ProjectName || '',
    buildername: data.BuilderName || '',
    baseprojectprice: parseFloat(data.BaseProjectPrice) || 0,
    projectbrochure: data.ProjectBrochure || null,
    contact: data.Contact ? parseFloat(data.Contact) : null,
    projectlocation: data.ProjectLocation || null,
    project_type: data.Project_Type || data.BuildingType || 'Apartment',
    buildingname: data.BuildingName || null,
    communitytype: mapCommunityType(data.CommunityType),
    total_land_area: data.Total_land_Area || 'Not specified',
    number_of_towers: parseInt(data.Number_of_Towers) || 1,
    number_of_floors: parseInt(data.Numbger_of_Floors || data.Number_of_Floors) || 0,
    number_of_flats_per_floor: parseInt(data.Number_of_Flats_Per_Floor) || 0,
    total_number_of_units: parseInt(totalNumberOfUnits) || 0,
    project_launch_date: validateAndFormatDate(data.Project_Launch_Date),
    possession_date: validateAndFormatDate(data.Possession_Date),
    // Map construction status - Try to save exact frontend values, fallback to old enum if needed
    // Note: Supabase enum must be updated to include new values (see update_construction_status_enum.sql)
    // If migration not run yet, this will fallback to old enum values
    construction_status: (() => {
      const status = data.Construction_Status || 'Under Construction';
      const statusTrimmed = status.trim();
      const statusLower = statusTrimmed.toLowerCase();
      
      // Try to save exact frontend values first (requires enum migration)
      // If enum migration not run, these will fail and we'll need to use fallback
      if (statusTrimmed === 'RTM' || statusLower === 'rtm') {
        // Try new value first, but will fallback if enum doesn't support it
        return 'RTM';
      } else if (statusTrimmed === 'About to RTM' || statusLower === 'about to rtm') {
        return 'About to RTM';
      } else if (statusTrimmed === 'Under Construction' || statusLower === 'under construction') {
        return 'Under Construction';
      } else if (statusTrimmed === 'Not Started' || statusLower === 'not started' || 
                 statusLower === 'planning') {
        return 'Not Started'; // This exists in old enum
      } else if (statusTrimmed === 'Ongoing' || statusLower === 'ongoing' || 
                 statusLower === 'on-going') {
        // Keep old enum value for now (will be migrated to "Under Construction" after enum update)
        return 'Ongoing';
      } else if (statusTrimmed === 'Ready to Move in' || statusLower === 'ready to move in' ||
                 statusTrimmed === 'Ready to Move' || statusLower === 'ready to move' ||
                 statusLower === 'ready' || statusLower === 'completed') {
        // Keep old enum value for now (will be migrated to "RTM" after enum update)
        return 'Ready to Move in';
      }
      
      // Default to old enum value until migration is run
      return 'Ongoing';
    })(),
    open_space: parseFloat(data.Open_Space) || 0,
    areaname: data.areaname || null,
    pricesheet_link_1: data.PriceSheetLink || data.pricesheet_link_1 || null,
    total_buildup_area: data.total_buildup_area || null,
    uds: data.uds || null,
    fsi: data.fsi || null,
    carpet_area_percentage: parseFloat(data.Carpet_area_Percentage) || 0,
    floor_to_ceiling_height: parseFloat(data.Floor_to_Ceiling_Height) || 0,
    main_door_height: data.main_door_height || null,
    price_per_sft: parseFloat(data.Price_per_sft) || 0,
    external_amenities: data.External_Amenities || null,
    specification: data.Specification || null,
    powerbackup: toTitleCase(data.PowerBackup || data.PowerBackip || 'None'),
    no_of_passenger_lift: parseInt(data.No_of_Passenger_lift) || 0,
    no_of_service_lift: parseInt(data.No_of_Service_lift) || 0,
    visitor_parking: data.Visitor_Parking?.toLowerCase() || 'no',
    ground_vehicle_movement: data.Ground_vehicle_Movement?.toLowerCase() || 'no',
    configurations: configurations,
    amount_for_extra_car_parking: parseFloat(data.Amount_For_Extra_Car_Parking) || 0,
    home_loan: data.Home_loan || null,
    available_banks_for_loan: data.available_banks_for_loan || [],
    previous_complaints_on_builder: data.previous_complaints_on_builder || null,
    complaint_details: data.complaint_details || null,
    construction_material: data.Construction_Material || 'Concrete',
    commission_percentage: parseFloat(data.Commission_percentage || data.Commision_percentage) || 0,
    what_is_there_price: data.What_is_there_Price ? parseFloat(data.What_is_there_Price) : null,
    what_is_relai_price: data.What_is_relai_price ? parseFloat(data.What_is_relai_price) : null,
    after_agreement_of_sale_what_is_payout_time_period: parseFloat(data.After_agreement_of_sale_what_is_payout_time_period) || 0,
    is_lead_registration_required_before_site_visit: data.Is_lead_Registration_required_before_Site_visit || null,
    turnaround_time_for_lead_acknowledgement: parseFloat(data.Turnaround_Time_for_Lead_Acknowledgement) || 0,
    is_there_validity_period_for_registered_lead: data.Is_there_validity_period_for_registered_lead?.toLowerCase() || 'no',
    validity_period_value: data.validity_period_value ? parseFloat(data.validity_period_value) : null,
    person_to_confirm_registration: personToConfirmRegistration,
    notes_comments_on_lead_registration_workflow: data.Notes_Comments_on_lead_registration_workflow || null,
    accepted_modes_of_lead_registration: Object.keys(acceptedModesOfLeadRegistration).length > 0
      ? [acceptedModesOfLeadRegistration]
      : null,
    builder_age: data.builder_age || null,
    builder_total_properties: data.builder_total_properties || null,
    builder_upcoming_properties: data.builder_upcoming_properties || null,
    builder_completed_properties: data.builder_completed_properties || null,
    builder_ongoing_projects: data.builder_ongoing_projects || null,
    builder_origin_city: data.builder_origin_city || null,
    builder_operating_locations: data.builder_operating_locations || [],
    floor_rise_charges: data.floor_rise_charges || null,
    floor_rise_amount_per_floor: data.floor_rise_amount_per_floor || null,
    floor_rise_applicable_above_floor_no: data.floor_rise_applicable_above_floor_no || null,
    facing_charges: data.facing_charges || null,
    preferential_location_charges: data.preferential_location_charges || null,
    preferential_location_charges_conditions: data.preferential_location_charges_conditions || null,
    status: data.status || data.Status || 'Unverified',
    useremail: data.UserEmail || data.useremail || '',
    poc_name: data.POC_Name || '',
    poc_contact: parseFloat(data.POC_Contact) || 0,
    poc_role: data.POC_Role || '',
    // CP is now a string: 'Accepting', 'On-boarded', 'Not-accepted', or empty string
    // Note: Database column must be updated from boolean to text (see update_cp_column_type.sql)
    // Handle backward compatibility with boolean values
    cp: (() => {
      const cpValue = data.POC_CP;
      
      // Handle boolean values (backward compatibility)
      if (cpValue === true || cpValue === 'true') {
        return 'Accepting'; // Migrate old true to 'Accepting'
      } else if (cpValue === false || cpValue === 'false') {
        return ''; // Empty string for false
      }
      
      // Handle string values
      if (typeof cpValue === 'string') {
        const trimmed = cpValue.trim();
        if (['Accepting', 'On-boarded', 'Not-accepted'].includes(trimmed)) {
          return trimmed; // Valid string value
        }
        if (trimmed === '') {
          return ''; // Empty string is valid
        }
      }
      
      // Default to empty string
      return '';
    })(),
    city: data.City || null,
    state: data.State || null
  };
};

const SaveProperty = async (req, res) => {
  try {
    const propertyData = mapFrontendDataToSupabaseSchema(req.body);

    const { data: existingProperty, error: checkError } = await supabase
      .from('Unverified_Properties')
      .select('id, rera_number')
      .eq('rera_number', propertyData.rera_number)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Supabase query error:', checkError);
      return res.status(500).json({ message: 'Database error while checking existing property' });
    }

    let savedProperty = null;
    let isUpdate = false;

    if (existingProperty) {
      const updateData = { ...propertyData };
      delete updateData.createdat;

      const { data: updatedProperty, error: updateError } = await supabase
        .from('Unverified_Properties')
        .update(updateData)
        .eq('id', existingProperty.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        console.error('Update error code:', updateError.code);
        console.error('Update error hint:', updateError.hint);
        console.error('Property data being updated:', JSON.stringify(updateData, null, 2));
        
        // Check if error is related to enum values
        if (updateError.message && updateError.message.includes('enum')) {
          return res.status(500).json({
            message: 'Error updating property: Invalid enum value. Please run the SQL migration to update construction_status_enum.',
            error: updateError.message,
            details: updateError.details,
            hint: 'Run update_construction_status_enum.sql in Supabase SQL Editor'
          });
        }
        
        // Check if error is related to boolean type (cp column)
        if (updateError.message && (updateError.message.includes('boolean') || updateError.message.includes('invalid input syntax'))) {
          return res.status(500).json({
            message: 'Error updating property: CP column type mismatch. Please run the SQL migration to update cp column from boolean to text.',
            error: updateError.message,
            details: updateError.details,
            hint: 'Run update_cp_column_type.sql in Supabase SQL Editor to change cp column from boolean to text'
          });
        }
        
        return res.status(500).json({
          message: 'Error updating property',
          error: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      }

      savedProperty = updatedProperty;
      isUpdate = true;
    } else {
      const { data: newProperty, error: insertError } = await supabase
        .from('Unverified_Properties')
        .insert([propertyData])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        console.error('Insert error code:', insertError.code);
        console.error('Insert error hint:', insertError.hint);
        console.error('Property data being inserted:', JSON.stringify(propertyData, null, 2));
        
        // Check if error is related to enum values
        if (insertError.message && insertError.message.includes('enum')) {
          return res.status(500).json({
            message: 'Error saving property: Invalid enum value. Please run the SQL migration to update construction_status_enum.',
            error: insertError.message,
            details: insertError.details,
            hint: 'Run update_construction_status_enum.sql in Supabase SQL Editor'
          });
        }
        
        // Check if error is related to boolean type (cp column)
        if (insertError.message && (insertError.message.includes('boolean') || insertError.message.includes('invalid input syntax'))) {
          return res.status(500).json({
            message: 'Error saving property: CP column type mismatch. Please run the SQL migration to update cp column from boolean to text.',
            error: insertError.message,
            details: insertError.details,
            hint: 'Run update_cp_column_type.sql in Supabase SQL Editor to change cp column from boolean to text'
          });
        }
        
        return res.status(500).json({
          message: 'Error saving property',
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      }

      savedProperty = newProperty;
    }

    let unifiedDataResult = { success: true, message: '', required: false };

    if (propertyData.rera_number) {
      const { data: existingUnified, error: checkUnifiedError } = await supabase
        .from('unified_data')
        .select('id')
        .eq('rera_number', propertyData.rera_number)
        .limit(1);

      if (!checkUnifiedError && existingUnified && existingUnified.length > 0) {
        unifiedDataResult.required = true;

        const unifiedUpdateData = {
          cp: propertyData.cp,
          poc_name: propertyData.poc_name,
          poc_contact: propertyData.poc_contact,
          poc_role: propertyData.poc_role
        };

        const { data: updatedUnified, error: unifiedError } = await supabase
          .from('unified_data')
          .update(unifiedUpdateData)
          .eq('rera_number', propertyData.rera_number)
          .select();

        if (unifiedError) {
          console.error('❌ Error updating unified_data:', unifiedError);
          unifiedDataResult.success = false;
          unifiedDataResult.message = `Warning: Property saved but unified_data sync failed: ${unifiedError.message}`;
        } else if (updatedUnified && updatedUnified.length > 0) {
          console.log(`✅ Also updated ${updatedUnified.length} row(s) in unified_data for RERA: ${propertyData.rera_number}`);
          unifiedDataResult.success = true;
          unifiedDataResult.message = `Updated ${updatedUnified.length} row(s) in unified_data`;
        }
      } else {
        console.log(`ℹ️ No existing rows in unified_data for RERA: ${propertyData.rera_number} (normal for new properties)`);
        unifiedDataResult.message = 'No matching rows in unified_data (this is normal for new properties)';
      }
    }

    const statusCode = isUpdate ? 200 : 201;
    const message = isUpdate ? 'Property updated successfully' : 'Property saved successfully';

    res.status(statusCode).json({
      message: message,
      data: savedProperty,
      unified_data_update: unifiedDataResult
    });

  } catch (error) {
    console.error('Unexpected error saving property:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: 'Server error saving property', 
      error: error.message,
      details: error.details || error.hint || 'No additional details available'
    });
  }
};

const GetDraftsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    let query = supabase
      .from('Unverified_Properties')
      .select('*')
      .eq('status', 'Unverified')
      .order('createdat', { ascending: false });

    // If not admin, filter by email
    if (email !== 'admin@relai.world') {
      query = query.eq('useremail', email);
    } else {
      console.log('👑 Admin user detected - fetching ALL drafts');
    }

    const { data: drafts, error } = await query;

    if (email === 'admin@relai.world') {
      console.log(`👑 Admin: Found ${drafts?.length || 0} total drafts in DB`);
    }

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ message: 'Error fetching drafts' });
    }

    res.status(200).json(drafts || []);

  } catch (error) {
    console.error('Unexpected error fetching drafts:', error);
    res.status(500).json({ message: 'Server error fetching drafts', error: error.message });
  }
};

const GetSubmittedPropertiesByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('📊 GetSubmittedPropertiesByEmail - Received request for email:', email);

    if (!email) {
      console.log('❌ No email provided in request');
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    console.log('🔍 Querying Supabase for submitted properties...');
    let query = supabase
      .from('Unverified_Properties')
      .select('*')
      .eq('status', 'Submitted')
      .order('createdat', { ascending: false });

    // If not admin, filter by email
    if (email !== 'admin@relai.world') {
      query = query.eq('useremail', email);
    } else {
      console.log('👑 Admin user detected - fetching ALL submitted properties');
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({ message: 'Error fetching submitted properties', error: error.message });
    }

    console.log(`✅ Found ${properties?.length || 0} submitted properties for ${email}`);
    if (properties && properties.length > 0) {
      console.log('Properties:', properties.map(p => ({
        rera: p.rera_number,
        project: p.projectname,
        status: p.status
      })));
    }

    res.status(200).json({ success: true, data: properties || [] });

  } catch (error) {
    console.error('❌ Unexpected error fetching submitted properties:', error);
    res.status(500).json({ message: 'Server error fetching submitted properties', error: error.message });
  }
};

const GetPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    const { data: property, error } = await supabase
      .from('Unverified_Properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json(property);

  } catch (error) {
    console.error('Unexpected error fetching property:', error);
    res.status(500).json({ message: 'Server error fetching property', error: error.message });
  }
};

const UpdateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = mapFrontendDataToSupabaseSchema(req.body);

    const { data: updatedProperty, error } = await supabase
      .from('Unverified_Properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ message: 'Error updating property', error: error.message });
    }

    res.status(200).json({
      message: 'Property updated successfully',
      data: updatedProperty
    });

  } catch (error) {
    console.error('Unexpected error updating property:', error);
    res.status(500).json({ message: 'Server error updating property', error: error.message });
  }
};

const DeleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Unverified_Properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ message: 'Error deleting property' });
    }

    res.status(200).json({ message: 'Property deleted successfully' });

  } catch (error) {
    console.error('Unexpected error deleting property:', error);
    res.status(500).json({ message: 'Server error deleting property', error: error.message });
  }
};

const UpdateCPInBothTables = async (req, res) => {
  try {
    const { rera_number, id, poc_cp } = req.body;

    if (!rera_number && !id) {
      return res.status(400).json({
        message: 'Either rera_number or id is required to identify the property'
      });
    }

    // CP is now a string: 'Accepting', 'On-boarded', 'Not-accepted', or empty string
    // Handle backward compatibility with boolean values
    let cpValue = poc_cp;
    if (typeof poc_cp === 'boolean') {
      // Migrate old boolean to new string format
      cpValue = poc_cp ? 'Accepting' : '';
    } else if (typeof poc_cp === 'string') {
      // Validate string value
      if (cpValue && !['Accepting', 'On-boarded', 'Not-accepted'].includes(cpValue)) {
        return res.status(400).json({
          message: 'poc_cp must be one of: "Accepting", "On-boarded", "Not-accepted", or empty string'
        });
      }
    } else if (poc_cp !== null && poc_cp !== undefined && poc_cp !== '') {
      return res.status(400).json({
        message: 'poc_cp must be a string value: "Accepting", "On-boarded", "Not-accepted", or empty string'
      });
    } else {
      cpValue = '';
    }

    console.log(`📝 UpdateCPInBothTables - Starting update for ${rera_number || `id: ${id}`}, cp: ${cpValue}`);

    const results = {
      unverified_properties: { success: false, message: '' },
      unified_data: { success: false, message: '' }
    };

    if (id) {
      const { data: updatedUnverified, error: unverifiedError } = await supabase
        .from('Unverified_Properties')
        .update({ cp: cpValue })
        .eq('id', id)
        .select()
        .single();

      if (unverifiedError) {
        console.error('❌ Error updating Unverified_Properties by id:', unverifiedError);
        results.unverified_properties.message = unverifiedError.message;
      } else if (updatedUnverified) {
        console.log('✅ Updated Unverified_Properties successfully');
        results.unverified_properties.success = true;
        results.unverified_properties.message = 'Updated successfully';
      }
    } else if (rera_number) {
      const { data: updatedUnverified, error: unverifiedError } = await supabase
        .from('Unverified_Properties')
        .update({ cp: cpValue })
        .eq('rera_number', rera_number)
        .select();

      if (unverifiedError) {
        console.error('❌ Error updating Unverified_Properties by rera_number:', unverifiedError);
        results.unverified_properties.message = unverifiedError.message;
      } else if (updatedUnverified && updatedUnverified.length > 0) {
        console.log(`✅ Updated ${updatedUnverified.length} row(s) in Unverified_Properties`);
        results.unverified_properties.success = true;
        results.unverified_properties.message = `Updated ${updatedUnverified.length} row(s)`;
      } else {
        results.unverified_properties.message = 'No matching records found';
      }
    }

    if (rera_number) {
      const { data: updatedUnified, error: unifiedError } = await supabase
        .from('unified_data')
        .update({ cp: cpValue })
        .eq('rera_number', rera_number)
        .select();

      if (unifiedError) {
        console.error('❌ Error updating unified_data:', unifiedError);
        results.unified_data.message = unifiedError.message;
      } else if (updatedUnified && updatedUnified.length > 0) {
        console.log(`✅ Updated ${updatedUnified.length} row(s) in unified_data`);
        results.unified_data.success = true;
        results.unified_data.message = `Updated ${updatedUnified.length} row(s)`;
      } else {
        results.unified_data.message = 'No matching records found in unified_data';
      }
    } else {
      const { data: property, error: fetchError } = await supabase
        .from('Unverified_Properties')
        .select('rera_number')
        .eq('id', id)
        .single();

      if (!fetchError && property && property.rera_number) {
        const { data: updatedUnified, error: unifiedError } = await supabase
          .from('unified_data')
          .update({ cp: cpValue })
          .eq('rera_number', property.rera_number)
          .select();

        if (unifiedError) {
          console.error('❌ Error updating unified_data:', unifiedError);
          results.unified_data.message = unifiedError.message;
        } else if (updatedUnified && updatedUnified.length > 0) {
          console.log(`✅ Updated ${updatedUnified.length} row(s) in unified_data`);
          results.unified_data.success = true;
          results.unified_data.message = `Updated ${updatedUnified.length} row(s)`;
        } else {
          results.unified_data.message = 'No matching records found in unified_data';
        }
      } else {
        results.unified_data.message = 'Could not find RERA number to update unified_data';
      }
    }

    const atLeastOneSuccess = results.unverified_properties.success || results.unified_data.success;
    const bothSuccess = results.unverified_properties.success && results.unified_data.success;

    if (bothSuccess) {
      return res.status(200).json({
        success: true,
        message: 'CP field updated successfully in both tables',
        results
      });
    } else if (atLeastOneSuccess) {
      return res.status(207).json({
        success: true,
        message: 'CP field updated in at least one table (partial success)',
        results
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update CP field in both tables',
        results
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in UpdateCPInBothTables:', error);
    res.status(500).json({
      message: 'Server error updating CP field',
      error: error.message
    });
  }
};

module.exports = {
  SaveProperty,
  GetDraftsByEmail,
  GetSubmittedPropertiesByEmail,
  GetPropertyById,
  UpdateProperty,
  DeleteProperty,
  UpdateCPInBothTables
};
