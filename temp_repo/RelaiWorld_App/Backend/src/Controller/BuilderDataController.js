const supabase = require('../../superbase');

const GetAllBuilders = async (req, res) => {
  try {
    const { data: builders, error } = await supabase
      .from('builder_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ message: 'Error fetching builders', error: error.message });
    }

    res.status(200).json({ success: true, data: builders || [] });

  } catch (error) {
    console.error('Unexpected error fetching builders:', error);
    res.status(500).json({ message: 'Server error fetching builders', error: error.message });
  }
};

const GetProjectNames = async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('unified_data')
      .select('projectname, rera_number')
      .not('projectname', 'is', null)
      .order('projectname', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ message: 'Error fetching project names', error: error.message });
    }

    const projectMap = {};
    projects.forEach(p => {
      if (p.projectname && !projectMap[p.projectname]) {
        projectMap[p.projectname] = {
          projectname: p.projectname,
          rera_number: p.rera_number || ''
        };
      }
    });

    const uniqueProjects = Object.values(projectMap);

    res.status(200).json({ success: true, data: uniqueProjects });

  } catch (error) {
    console.error('Unexpected error fetching project names:', error);
    res.status(500).json({ message: 'Server error fetching project names', error: error.message });
  }
};

const GetProjectDetails = async (req, res) => {
  try {
    const { projectName } = req.params;

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const { data: project, error } = await supabase
      .from('unified_data')
      .select('projectname, rera_number, buildername')
      .eq('projectname', projectName)
      .limit(1)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });

  } catch (error) {
    console.error('Unexpected error fetching project details:', error);
    res.status(500).json({ message: 'Server error fetching project details', error: error.message });
  }
};

const GetBuilderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Builder ID is required' });
    }

    const { data: builder, error } = await supabase
      .from('builder_data')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(404).json({ message: 'Builder not found' });
    }

    res.status(200).json({ success: true, data: builder });

  } catch (error) {
    console.error('Unexpected error fetching builder:', error);
    res.status(500).json({ message: 'Server error fetching builder', error: error.message });
  }
};

const CreateBuilder = async (req, res) => {
  try {
    const {
      rera_builder_name,
      standard_builder_name,
      builder_age,
      builder_total_properties,
      builder_upcoming_properties,
      builder_completed_properties,
      builder_ongoing_projects,
      builder_origin_city,
      builder_operating_locations,
      previous_complaints_on_builder,
      project_name,
      rera_number
    } = req.body;

    if (!rera_number) {
      return res.status(400).json({ message: 'RERA Number is required' });
    }

    if (!rera_builder_name) {
      return res.status(400).json({ message: 'RERA Builder Name is required' });
    }

    if (!standard_builder_name) {
      return res.status(400).json({ message: 'Builder Name is required' });
    }

    if (!project_name) {
      return res.status(400).json({ message: 'Project Name is required' });
    }

    // Insert into builder_data table only
    const builderData = {
      rera_builder_name,
      standard_builder_name,
      builder_age: builder_age || null,
      builder_total_properties: builder_total_properties || null,
      builder_upcoming_properties: builder_upcoming_properties || null,
      builder_completed_properties: builder_completed_properties || null,
      builder_ongoing_projects: builder_ongoing_projects || null,
      builder_origin_city: builder_origin_city || null,
      builder_operating_locations: builder_operating_locations || null,
      previous_complaints_on_builder: previous_complaints_on_builder || null
    };

    console.log(`📝 Inserting into builder_data:`, builderData);

    const { data: newBuilder, error: insertError } = await supabase
      .from('builder_data')
      .insert([builderData])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ 
        message: 'Error creating builder', 
        error: insertError.message 
      });
    }

    console.log(`✅ Successfully inserted into builder_data: ${standard_builder_name} (RERA Builder: ${rera_builder_name})`);

    // Also save to Unverified_Properties table for property tracking
    const unverifiedData = {
      rera_number: rera_number,
      buildername: standard_builder_name,
      projectname: project_name,
      baseprojectprice: 0,
      project_type: 'Apartment',
      communitytype: 'Gated Community',
      total_land_area: 'Not specified',
      number_of_towers: 1,
      number_of_floors: 0,
      number_of_flats_per_floor: 0,
      total_number_of_units: 0,
      construction_status: 'Ongoing',
      open_space: 0,
      carpet_area_percentage: 0,
      floor_to_ceiling_height: 0,
      price_per_sft: 0,
      powerbackup: 'None',
      no_of_passenger_lift: 0,
      no_of_service_lift: 0,
      visitor_parking: 'no',
      ground_vehicle_movement: 'no',
      construction_material: 'Concrete',
      commission_percentage: 0,
      after_agreement_of_sale_what_is_payout_time_period: 0,
      turnaround_time_for_lead_acknowledgement: 0,
      is_there_validity_period_for_registered_lead: 'no',
      amount_for_extra_car_parking: 0,
      person_to_confirm_registration: [{ name: '', contact: '' }],
      poc_name: '',
      poc_contact: 0,
      poc_role: '',
      cp: false,
      useremail: '',
      status: 'Unverified'
    };

    const { error: unverifiedInsertError } = await supabase
      .from('Unverified_Properties')
      .insert([unverifiedData]);

    if (unverifiedInsertError) {
      console.error('Error inserting into Unverified_Properties:', unverifiedInsertError);
    } else {
      console.log(`✅ Successfully inserted into Unverified_Properties: ${project_name} (RERA: ${rera_number})`);
    }

    // Insert into unified_data with ONLY 3 fields (rera_number, buildername, projectname)
    // ID is auto-generated by Supabase, all other fields will remain NULL
    const { error: unifiedError } = await supabase
      .from('unified_data')
      .insert([
        {
          rera_number: rera_number,
          buildername: standard_builder_name,
          projectname: project_name
        }
      ]);

    if (unifiedError) {
      console.error('unified_data insert failed:', unifiedError);
    } else {
      console.log(`✅ Successfully inserted into unified_data: ${project_name} (RERA: ${rera_number})`);
    }

    res.status(201).json({ 
      message: 'Builder created successfully', 
      data: newBuilder,
      unverified_properties: !unverifiedInsertError,
      unified_data: !unifiedError ? { success: true } : { success: false, error: unifiedError?.message }
    });

  } catch (error) {
    console.error('Unexpected error creating builder:', error);
    res.status(500).json({ message: 'Server error creating builder', error: error.message });
  }
};

const UpdateBuilder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rera_builder_name,
      standard_builder_name,
      builder_age,
      builder_total_properties,
      builder_upcoming_properties,
      builder_completed_properties,
      builder_ongoing_projects,
      builder_origin_city,
      builder_operating_locations,
      previous_complaints_on_builder,
      project_name,
      rera_number
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Builder ID is required' });
    }

    if (!rera_number) {
      return res.status(400).json({ message: 'RERA Number is required' });
    }

    if (!rera_builder_name) {
      return res.status(400).json({ message: 'RERA Builder Name is required' });
    }

    if (!standard_builder_name) {
      return res.status(400).json({ message: 'Builder Name is required' });
    }

    if (!project_name) {
      return res.status(400).json({ message: 'Project Name is required' });
    }

    // Update builder_data table
    const updateData = {
      rera_builder_name,
      standard_builder_name,
      builder_age: builder_age || null,
      builder_total_properties: builder_total_properties || null,
      builder_upcoming_properties: builder_upcoming_properties || null,
      builder_completed_properties: builder_completed_properties || null,
      builder_ongoing_projects: builder_ongoing_projects || null,
      builder_origin_city: builder_origin_city || null,
      builder_operating_locations: builder_operating_locations || null,
      previous_complaints_on_builder: previous_complaints_on_builder || null,
      updated_at: new Date().toISOString()
    };

    console.log(`📝 Updating builder_data for id ${id}:`, updateData);

    const { data: updatedBuilder, error: updateError } = await supabase
      .from('builder_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ 
        message: 'Error updating builder', 
        error: updateError.message 
      });
    }

    console.log(`✅ Successfully updated builder_data: ${standard_builder_name} (RERA Builder: ${rera_builder_name})`);

    // Also update Unverified_Properties table by rera_number
    const unverifiedUpdateData = {
      buildername: standard_builder_name,
      projectname: project_name
    };

    const { error: unverifiedUpdateError } = await supabase
      .from('Unverified_Properties')
      .update(unverifiedUpdateData)
      .eq('rera_number', rera_number);

    if (unverifiedUpdateError) {
      console.error('Error updating Unverified_Properties:', unverifiedUpdateError);
    } else {
      console.log(`✅ Updated Unverified_Properties for RERA: ${rera_number}`);
    }
    
    res.status(200).json({ 
      message: 'Builder updated successfully', 
      data: updatedBuilder,
      unverified_properties: !unverifiedUpdateError
    });

  } catch (error) {
    console.error('Unexpected error updating builder:', error);
    res.status(500).json({ message: 'Server error updating builder', error: error.message });
  }
};

const DeleteBuilder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Builder ID is required' });
    }

    const { error } = await supabase
      .from('builder_data')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ message: 'Error deleting builder', error: error.message });
    }

    res.status(200).json({ message: 'Builder deleted successfully' });

  } catch (error) {
    console.error('Unexpected error deleting builder:', error);
    res.status(500).json({ message: 'Server error deleting builder', error: error.message });
  }
};

module.exports = {
  GetAllBuilders,
  GetProjectNames,
  GetProjectDetails,
  GetBuilderById,
  CreateBuilder,
  UpdateBuilder,
  DeleteBuilder
};
