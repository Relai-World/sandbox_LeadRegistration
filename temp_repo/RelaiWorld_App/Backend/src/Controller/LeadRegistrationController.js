const supabase = require('../../superbase');

const GetAllLeadRegistrations = async (req, res) => {
  console.log('GetAllLeadRegistrations called');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Request query:', req.query);

  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase client is null/undefined');
      return res.status(500).json({
        message: 'Error fetching lead registrations',
        error: 'Supabase client not initialized'
      });
    }

    if (supabase.isConfigured === false) {
      console.error('Supabase is not configured (isConfigured = false)');
      return res.status(500).json({
        message: 'Error fetching lead registrations',
        error: 'Supabase connection not configured'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || parseInt(req.query.p) || 1;
    const limit = Math.min(parseInt(req.query.limit) || parseInt(req.query.l) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    console.log('Supabase is configured, executing query...');
    console.log(`Pagination: page=${page}, limit=${limit}, offset=${offset} (Default limit: 1000)`);

    // Get paginated data with count in single query
    const { data: leads, error, count: totalCount } = await supabase
      .from('client_Requirements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

    console.log('Query completed. Error:', error ? error.message : 'none');
    console.log('Data length:', leads ? leads.length : 0);
    console.log('Total count:', totalCount);

    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return res.status(500).json({
        message: 'Error fetching lead registrations',
        error: error.message,
        code: error.code
      });
    }

    console.log(`Sending response with ${leads?.length || 0} leads (page ${page} of ${totalPages})`);

    // Ensure response is sent properly
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: leads || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } else {
      console.warn('Response already sent, cannot send again');
    }

  } catch (error) {
    console.error('Unexpected error in GetAllLeadRegistrations:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Ensure response is sent - critical for serverless
    if (!res.headersSent) {
      try {
        res.status(500).json({
          message: 'Server error fetching lead registrations',
          error: error.message || 'Unknown error',
          name: error.name || 'Error'
        });
      } catch (sendError) {
        console.error('Failed to send error response:', sendError);
      }
    } else {
      console.warn('Response already sent, cannot send error response');
    }
  }
};

const GetLeadsByMobile = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { mobile } = req.params;

    if (!mobile) {
      return res.status(400).json({ message: 'Client mobile number is required' });
    }

    console.log(`Fetching leads for mobile: ${mobile}`);
    const { data: leads, error } = await supabase
      .from('client_Requirements')
      .select('*')
      .eq('client_mobile', mobile)
      .order('requirement_number', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(404).json({ message: 'Leads not found', error: error.message });
    }

    console.log(`Found ${leads?.length || 0} leads for mobile ${mobile}`);
    res.status(200).json({ success: true, data: leads || [] });

  } catch (error) {
    console.error('Unexpected error fetching leads by mobile:', error);
    res.status(500).json({ message: 'Server error fetching leads', error: error.message });
  }
};

const GetLeadById = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    console.log(`Fetching lead with ID: ${id}`);
    const { data: lead, error } = await supabase
      .from('client_Requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(404).json({ message: 'Lead not found', error: error.message });
    }

    res.status(200).json({ success: true, data: lead });

  } catch (error) {
    console.error('Unexpected error fetching lead:', error);
    res.status(500).json({ message: 'Server error fetching lead', error: error.message });
  }
};

const CreateLead = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const {
      client_mobile,
      requirement_name,
      preferences,
      matched_properties,
      shortlisted_properties,
      site_visits
    } = req.body;

    if (!client_mobile) {
      return res.status(400).json({ message: 'Client mobile number is required' });
    }

    const { data: existingLeads, error: countError } = await supabase
      .from('client_Requirements')
      .select('requirement_number')
      .eq('client_mobile', client_mobile)
      .order('requirement_number', { ascending: false })
      .limit(1);

    let nextRequirementNumber = 1;
    if (!countError && existingLeads && existingLeads.length > 0) {
      nextRequirementNumber = existingLeads[0].requirement_number + 1;
    }

    const leadData = {
      client_mobile,
      requirement_number: nextRequirementNumber,
      requirement_name: requirement_name || '',
      preferences: preferences || {},
      matched_properties: matched_properties || [],
      shortlisted_properties: shortlisted_properties || [],
      site_visits: site_visits || []
    };

    const { data: newLead, error: insertError } = await supabase
      .from('client_Requirements')
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({
        message: 'Error creating lead registration',
        error: insertError.message
      });
    }

    res.status(201).json({
      message: 'Lead registration created successfully',
      data: newLead
    });

  } catch (error) {
    console.error('Unexpected error creating lead:', error);
    res.status(500).json({ message: 'Server error creating lead', error: error.message });
  }
};

const UpdateLead = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { id } = req.params;
    const {
      requirement_name,
      preferences,
      matched_properties,
      shortlisted_properties,
      site_visits
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (requirement_name !== undefined) {
      updateData.requirement_name = requirement_name;
    }
    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }
    if (matched_properties !== undefined) {
      updateData.matched_properties = matched_properties;
    }
    if (shortlisted_properties !== undefined) {
      updateData.shortlisted_properties = shortlisted_properties;
    }
    if (site_visits !== undefined) {
      updateData.site_visits = site_visits;
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('client_Requirements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({
        message: 'Error updating lead registration',
        error: updateError.message
      });
    }

    res.status(200).json({
      message: 'Lead registration updated successfully',
      data: updatedLead
    });

  } catch (error) {
    console.error('Unexpected error updating lead:', error);
    res.status(500).json({ message: 'Server error updating lead', error: error.message });
  }
};

const DeleteLead = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    const { error } = await supabase
      .from('client_Requirements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ message: 'Error deleting lead', error: error.message });
    }

    res.status(200).json({ message: 'Lead registration deleted successfully' });

  } catch (error) {
    console.error('Unexpected error deleting lead:', error);
    res.status(500).json({ message: 'Server error deleting lead', error: error.message });
  }
};

const GetPocDetailsByReraNumbers = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase || (supabase.isConfigured === false)) {
      return res.status(503).json({
        message: 'Database service unavailable',
        error: 'Supabase connection not configured.'
      });
    }

    const { rera_numbers } = req.body;

    if (!rera_numbers || !Array.isArray(rera_numbers) || rera_numbers.length === 0) {
      return res.status(400).json({ message: 'RERA numbers array is required' });
    }

    // Limit the number of RERA numbers to prevent timeout (max 100)
    const limitedReraNumbers = rera_numbers.slice(0, 100);
    if (rera_numbers.length > 100) {
      console.warn(`Limiting RERA numbers query to 100 (requested ${rera_numbers.length})`);
    }

    console.log(`Fetching POC details for ${limitedReraNumbers.length} RERA numbers...`);
    const { data: pocData, error } = await supabase
      .from('unified_data')
      .select('rera_number, projectname, buildername, poc_name, poc_contact, poc_role, GRID_Score, baseprojectprice, sqfeet, project_type, areaname, city, state, number_of_towers, number_of_flats_per_floor, price_per_sft, project_launch_date, floor_rise_charges, open_space, external_amenities, floor_rise_amount_per_floor, floor_rise_applicable_above_floor_no, facing_charges, preferential_location_charges, preferential_location_charges_conditions, no_of_passenger_lift, visitor_parking')
      .in('rera_number', limitedReraNumbers);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ message: 'Error fetching POC details', error: error.message });
    }

    const pocMap = {};
    (pocData || []).forEach(item => {
      if (item.rera_number) {
        pocMap[item.rera_number] = {
          poc_name: item.poc_name || '',
          poc_contact: item.poc_contact || '',
          poc_role: item.poc_role || '',
          projectname: item.projectname || '',
          buildername: item.buildername || '',
          grid_score: item.GRID_Score || '',
          price_range: item.baseprojectprice || '',
          size_range: item.sqfeet ? `${item.sqfeet} sq.ft` : '',
          project_type: item.project_type || '',
          areaname: item.areaname || '',
          city: item.city || '',
          areaname: item.areaname || '',
          city: item.city || '',
          state: item.state || '',
          number_of_towers: item.number_of_towers || '',
          number_of_flats_per_floor: item.number_of_flats_per_floor || '',
          price_per_sft: item.price_per_sft || '',
          project_launch_date: item.project_launch_date || '',
          floor_rise_charges: item.floor_rise_charges || '',
          open_space: item.open_space || '',
          external_amenities: item.external_amenities || '',
          floor_rise_amount_per_floor: item.floor_rise_amount_per_floor || '',
          floor_rise_applicable_above_floor_no: item.floor_rise_applicable_above_floor_no || '',
          facing_charges: item.facing_charges || '',
          preferential_location_charges: item.preferential_location_charges || '',
          preferential_location_charges_conditions: item.preferential_location_charges_conditions || '',
          no_of_passenger_lift: item.no_of_passenger_lift || '',
          visitor_parking: item.visitor_parking || ''
        };
      }
    });

    console.log(`Successfully fetched POC details for ${Object.keys(pocMap).length} RERA numbers`);
    if (pocData && pocData.length > 0) {
      console.log('Sample POC detail:', JSON.stringify(pocData[0], null, 2));
    }
    res.status(200).json({ success: true, data: pocMap });

  } catch (error) {
    console.error('Unexpected error fetching POC details:', error);
    res.status(500).json({ message: 'Server error fetching POC details', error: error.message });
  }
};

let cachedZohoAccessToken = null;

const refreshZohoToken = async () => {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return null;
  }

  try {
    const tokenUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;

    const response = await fetch(tokenUrl, { method: 'POST' });
    const data = await response.json();

    if (data.access_token) {
      console.log('Zoho token refreshed successfully');
      cachedZohoAccessToken = data.access_token;
      return data.access_token;
    }
    console.error('Failed to refresh Zoho token:', data);
    return null;
  } catch (err) {
    console.error('Error refreshing Zoho token:', err);
    return null;
  }
};

const searchZohoLead = async (accessToken, mobile) => {
  const cleanMobile = mobile.replace(/\D/g, '');
  const last10 = cleanMobile.slice(-10);

  const searchVariants = [mobile, last10, `+91${last10}`, `91${last10}`];

  for (const searchMobile of searchVariants) {
    try {
      const searchUrl = `https://www.zohoapis.in/crm/v2/Leads/search?criteria=(Mobile:equals:${encodeURIComponent(searchMobile)})`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const lead = data.data[0];
          const name = lead.Full_Name || `${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim() || lead.Last_Name || lead.First_Name || '';
          if (name) {
            console.log(`Found Zoho lead for ${mobile}: ${name}`);
            return name;
          }
        }
      } else if (response.status === 401) {
        return { error: 'unauthorized' };
      }
    } catch (err) {
      console.error(`Error searching Zoho for ${searchMobile}:`, err.message);
    }
  }
  return null;
};

const GetZohoLeadNames = async (req, res) => {
  try {
    const { mobile_numbers } = req.body;

    if (!mobile_numbers || !Array.isArray(mobile_numbers) || mobile_numbers.length === 0) {
      return res.status(400).json({ message: 'Mobile numbers array is required' });
    }

    // Limit the number of mobile numbers to prevent timeout (max 50 for serverless)
    const limitedMobileNumbers = mobile_numbers.slice(0, 50);
    if (mobile_numbers.length > 50) {
      console.warn(`Limiting mobile numbers query to 50 (requested ${mobile_numbers.length})`);
    }

    let accessToken = cachedZohoAccessToken || process.env.ZOHO_ACCESS_TOKEN;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!accessToken && !refreshToken) {
      console.log('Zoho API credentials not configured');
      return res.status(200).json({ success: true, data: {} });
    }

    if (!accessToken && refreshToken) {
      accessToken = await refreshZohoToken();
      if (!accessToken) {
        return res.status(200).json({ success: true, data: {}, message: 'Could not refresh Zoho token' });
      }
    }

    const leadNamesMap = {};
    let tokenRefreshed = false;
    const startTime = Date.now();

    // Process in batches to avoid timeout
    for (let i = 0; i < limitedMobileNumbers.length; i++) {
      const mobile = limitedMobileNumbers[i];

      // Check if we're approaching timeout (20 seconds max for this operation)
      if (Date.now() - startTime > 20000) {
        console.warn(`Zoho search timeout approaching, processed ${i} of ${limitedMobileNumbers.length}`);
        break;
      }

      let result = await searchZohoLead(accessToken, mobile);

      if (result && result.error === 'unauthorized' && !tokenRefreshed) {
        console.log('Access token expired, refreshing...');
        accessToken = await refreshZohoToken();
        tokenRefreshed = true;
        if (accessToken) {
          result = await searchZohoLead(accessToken, mobile);
        }
      }

      if (result && typeof result === 'string') {
        leadNamesMap[mobile] = result;
      }
    }

    console.log(`Zoho lead names fetched: ${Object.keys(leadNamesMap).length} of ${limitedMobileNumbers.length} (requested ${mobile_numbers.length})`);
    res.status(200).json({ success: true, data: leadNamesMap });

  } catch (error) {
    console.error('Unexpected error fetching Zoho lead names:', error);
    res.status(500).json({ message: 'Server error fetching Zoho lead names', error: error.message });
  }
};

module.exports = {
  GetAllLeadRegistrations,
  GetLeadsByMobile,
  GetLeadById,
  CreateLead,
  UpdateLead,
  DeleteLead,
  GetPocDetailsByReraNumbers,
  GetZohoLeadNames
};
