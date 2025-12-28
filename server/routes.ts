import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertPropertySchema, insertLeadSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === USER ROUTES (Original API compatibility) ===

  app.post('/api/user/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Database not available. Please configure Supabase.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log('Login attempt for:', normalizedEmail);

      // Query the UsersData table via Supabase
      const { data: user, error } = await supabase
        .from('UsersData')
        .select('id, username, email, password, role')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error('Supabase query error:', error);
        return res.status(500).json({ message: 'Database error during login' });
      }

      if (!user) {
        console.log('User not found:', normalizedEmail);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('User found:', user.email);

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('Password mismatch for:', normalizedEmail);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('Login successful for:', normalizedEmail);
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  app.post('/api/user/signup', async (req, res) => {
    try {
      const { username, email, password, role = 'agent' } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Database not available. Please configure Supabase.' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists via Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from('UsersData')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (checkError) {
        console.error('Supabase query error:', checkError);
        return res.status(500).json({ message: 'Database error during registration' });
      }

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user via Supabase
      const { error: insertError } = await supabase
        .from('UsersData')
        .insert([{ username, email: normalizedEmail, password: hashedPassword, role }]);

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({ message: 'Error creating user account' });
      }

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });

  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  // === DRAFTS ROUTE (Frontend calls /api/properties/drafts/:email) ===
  
  app.get('/api/properties/drafts/:email', async (req, res) => {
    const { email } = req.params;

    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const decodedEmail = decodeURIComponent(email);
      console.log('Fetching drafts for email:', decodedEmail);
      
      const { data, error } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', decodedEmail)
        .order('updatedat', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      // Return empty array if no data
      res.status(200).json(data || []);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // === LEAD REGISTRATION ROUTES (Frontend calls /api/lead-registration/*) ===

  // Get all leads with pagination
  app.get('/api/lead-registration', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;

      const { data: leads, error, count } = await supabase
        .from('client_Requirements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching leads:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      res.status(200).json({
        success: true,
        data: leads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create lead
  app.post('/api/lead-registration', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { client_mobile, requirement_name, preferences, matched_properties, shortlisted_properties, site_visits } = req.body;

      if (!client_mobile) {
        return res.status(400).json({ message: 'Client mobile number is required' });
      }

      // Get next requirement number for this mobile
      const { data: existingLeads } = await supabase
        .from('client_Requirements')
        .select('requirement_number')
        .eq('client_mobile', client_mobile)
        .order('requirement_number', { ascending: false })
        .limit(1);

      let nextRequirementNumber = 1;
      if (existingLeads && existingLeads.length > 0) {
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

      const { data: newLead, error } = await supabase
        .from('client_Requirements')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        return res.status(500).json({ message: 'Error creating lead' });
      }

      res.status(201).json({ message: 'Lead created successfully', data: newLead });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get POC details
  app.post('/api/lead-registration/poc-details', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { rera_numbers } = req.body;

      if (!rera_numbers || !Array.isArray(rera_numbers) || rera_numbers.length === 0) {
        return res.status(200).json({ success: true, data: {} });
      }

      const limitedReraNumbers = rera_numbers.slice(0, 100);

      const { data: pocData, error } = await supabase
        .from('unified_data')
        .select('rera_number, projectname, buildername, poc_name, poc_contact, poc_role, GRID_Score, baseprojectprice')
        .in('rera_number', limitedReraNumbers);

      if (error) {
        console.error('Error fetching POC details:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      const pocMap: Record<string, any> = {};
      (pocData || []).forEach((item: any) => {
        if (item.rera_number) {
          pocMap[item.rera_number] = {
            poc_name: item.poc_name || '',
            poc_contact: item.poc_contact || '',
            poc_role: item.poc_role || '',
            projectname: item.projectname || '',
            buildername: item.buildername || '',
            grid_score: item.GRID_Score || '',
            price_range: item.baseprojectprice || ''
          };
        }
      });

      res.status(200).json({ success: true, data: pocMap });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get Zoho leads (placeholder - returns empty for now)
  app.get('/api/lead-registration/zoho-leads', async (req, res) => {
    res.status(200).json({ success: true, data: [] });
  });

  // Update lead
  app.put('/api/lead-registration/:id', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error } = await supabase
        .from('client_Requirements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        return res.status(500).json({ message: 'Error updating lead' });
      }

      res.status(200).json({ message: 'Lead updated successfully', data: updated });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete lead
  app.delete('/api/lead-registration/:id', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('client_Requirements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lead:', error);
        return res.status(500).json({ message: 'Error deleting lead' });
      }

      res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // === VERIFIED PROPERTIES ROUTES ===

  // Get status count for an agent
  app.get('/api/verified/status-count/:email', async (req, res) => {
    const { email } = req.params;
    console.log('StatusCount - Fetching data for email:', email);

    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const decodedEmail = decodeURIComponent(email);
      
      // Fetch drafts (Unverified status)
      const { data: draftsData, error: draftsError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', decodedEmail)
        .eq('status', 'Unverified')
        .order('updatedat', { ascending: false });

      // Fetch submitted
      const { data: submittedData, error: submittedError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', decodedEmail)
        .eq('status', 'Submitted')
        .order('updatedat', { ascending: false });

      if (draftsError || submittedError) {
        console.error('Error fetching data:', draftsError || submittedError);
        return res.status(500).json({ message: 'Database error' });
      }

      const drafts = (draftsData || []).map((doc: any) => ({
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
        Open_Space: doc.open_space ? doc.open_space + '%' : null,
        Carpet_Area_Percentage: doc.carpet_area_percentage ? doc.carpet_area_percentage + '%' : null,
        Floor_to_Ceiling_Height: doc.floor_to_ceiling_height ? doc.floor_to_ceiling_height + ' ft' : null,
        Commission_Percentage: doc.commission_percentage ? doc.commission_percentage + '%' : null,
        POC_Name: doc.poc_name,
        POC_Contact: doc.poc_contact,
        POC_Role: doc.poc_role,
        POC_CP: doc.cp || false
      }));

      const submitted = (submittedData || []).map((doc: any) => ({
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
        Open_Space: doc.open_space ? doc.open_space + '%' : null,
        Carpet_Area_Percentage: doc.carpet_area_percentage ? doc.carpet_area_percentage + '%' : null,
        Floor_to_Ceiling_Height: doc.floor_to_ceiling_height ? doc.floor_to_ceiling_height + ' ft' : null,
        Commission_Percentage: doc.commission_percentage ? doc.commission_percentage + '%' : null,
        POC_Name: doc.poc_name,
        POC_Contact: doc.poc_contact,
        POC_Role: doc.poc_role,
        POC_CP: doc.cp || false
      }));

      res.status(200).json({
        email: decodedEmail,
        total: drafts.length + submitted.length,
        draftsCount: drafts.length,
        submittedCount: submitted.length,
        drafts,
        submitted
      });
    } catch (error) {
      console.error('Error fetching status count:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get dropdown values
  app.get('/api/verified/dropdown-values', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    try {
      // Fetch all records to get complete dropdown values
      // Use pagination to fetch all data
      const allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('unified_data')
          .select('projectname, buildername, rera_number, city, state, areaname')
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching dropdown values:', error);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (data && data.length > 0) {
          allData.push(...data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const projectNamesSet = new Set<string>();
      const builderNamesSet = new Set<string>();
      const reraNumbersSet = new Set<string>();
      const citiesSet = new Set<string>();
      const statesSet = new Set<string>();
      const areasSet = new Set<string>();

      allData.forEach((item: any) => {
        if (item.projectname) projectNamesSet.add(String(item.projectname).trim());
        if (item.buildername) builderNamesSet.add(String(item.buildername).trim());
        if (item.rera_number) reraNumbersSet.add(String(item.rera_number).trim());
        if (item.city) citiesSet.add(String(item.city).trim());
        if (item.state) statesSet.add(String(item.state).trim());
        if (item.areaname) areasSet.add(String(item.areaname).trim());
      });

      res.status(200).json({
        success: true,
        data: {
          projectNames: Array.from(projectNamesSet).sort(),
          builderNames: Array.from(builderNamesSet).sort(),
          reraNumbers: Array.from(reraNumbersSet).sort(),
          cities: Array.from(citiesSet).sort(),
          states: Array.from(statesSet).sort(),
          areas: Array.from(areasSet).sort()
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Helper function to map property data to frontend format
  const mapPropertyToFrontendFormat = (propertyData: any) => {
    // Handle configurations
    let configurations: any[] = [];
    const isVillaProject = propertyData.project_type === 'Villa' || propertyData.project_type === 'Villas';
    
    if (propertyData.configurations && Array.isArray(propertyData.configurations) && propertyData.configurations.length > 0) {
      configurations = propertyData.configurations.map((config: any) => {
        const transformedConfig: any = {
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

    return {
      ProjectName: propertyData.projectname,
      BuilderName: propertyData.buildername,
      RERA_Number: propertyData.rera_number,
      AreaName: propertyData.areaname,
      ProjectLocation: propertyData.projectlocation,
      Project_Type: propertyData.project_type,
      BuildingName: propertyData.buildingname,
      CommunityType: propertyData.communitytype,
      Total_land_Area: propertyData.total_land_area,
      Number_of_Towers: propertyData.number_of_towers,
      Number_of_Floors: propertyData.number_of_floors,
      Number_of_Flats_Per_Floor: propertyData.number_of_flats_per_floor,
      Total_Number_of_Units: propertyData.total_number_of_units,
      Launch_Date: propertyData.project_launch_date,
      Possession_Date: propertyData.possession_date,
      Construction_Status: propertyData.construction_status,
      Open_Space: propertyData.open_space,
      Carpet_area_Percentage: propertyData.carpet_area_percentage,
      Floor_to_Ceiling_Height: propertyData.floor_to_ceiling_height,
      Price_per_sft: propertyData.price_per_sft,
      Total_Buildup_Area: propertyData.total_buildup_area,
      UDS: propertyData.uds,
      FSI: propertyData.fsi,
      Main_Door_Height: propertyData.main_door_height,
      External_Amenities: propertyData.external_amenities,
      Specification: propertyData.specification,
      PowerBackup: propertyData.powerbackup,
      No_of_Passenger_lift: propertyData.no_of_passenger_lift,
      No_of_Service_lift: propertyData.no_of_service_lift,
      Visitor_Parking: propertyData.visitor_parking,
      Ground_vehicle_Movement: propertyData.ground_vehicle_movement,
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
      After_agreement_of_sale_what_is_payout_time_period: propertyData.after_agreement_of_sale_what_is_payout_time_period,
      Is_Lead_Registration_Required_Before_Site_Visit: propertyData.is_lead_registration_required_before_site_visit,
      Turnaround_Time_for_Lead_Acknowledgement: propertyData.turnaround_time_for_lead_acknowledgement,
      Is_There_Validity_Period_for_Registered_Lead: propertyData.is_there_validity_period_for_registered_lead,
      Validity_Period_Value: propertyData.validity_period_value,
      Person_to_Confirm_Registration: propertyData.person_to_confirm_registration,
      Notes_Comments_on_Lead_Registration_Workflow: propertyData.notes_comments_on_lead_registration_workflow,
      Accepted_Modes_of_Lead_Registration: propertyData.accepted_modes_of_lead_registration,
      POC_Name: propertyData.poc_name,
      POC_Contact: propertyData.poc_contact,
      POC_Role: propertyData.poc_role,
      POC_CP: propertyData.cp || false,
      Contact: propertyData.contact,
      ProjectBrochure: propertyData.projectbrochure,
      Pricesheet_Link: propertyData.pricesheet_link_1,
      Project_Status: propertyData.project_status || null,
      City: propertyData.city || null,
      State: propertyData.state || null,
      Google_Place_ID: propertyData.google_place_id || null,
      Google_Place_Name: propertyData.google_place_name || null,
      Google_Place_Address: propertyData.google_place_address || null,
      Google_Place_Location: propertyData.google_place_location || null,
      Google_Place_Rating: propertyData.google_place_rating || null,
      Google_Place_User_Ratings_Total: propertyData.google_place_user_ratings_total || null,
      Google_Maps_URL: propertyData.google_maps_url || null,
      Mobile_Google_Map_URL: propertyData.mobile_google_map_url || null,
      Connectivity_Score: propertyData.connectivity_score || null,
      Amenities_Score: propertyData.amenities_score || null,
      GRID_Score: propertyData.GRID_Score || null,
      Hospitals_Count: propertyData.hospitals_count || null,
      Shopping_Malls_Count: propertyData.shopping_malls_count || null,
      Schools_Count: propertyData.schools_count || null,
      Restaurants_Count: propertyData.restaurants_count || null,
      configurations: configurations
    };
  };

  // Get property details - First check Unverified_Properties, then unified_data
  app.get('/api/verified/property-details', async (req, res) => {
    const { projectName, reraNumber } = req.query;

    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    if (!projectName && !reraNumber) {
      return res.status(400).json({ success: false, message: 'Please provide projectName or reraNumber' });
    }

    try {
      console.log(`Fetching property details for: ${projectName || reraNumber}`);

      // Step 1: First search in Unverified_Properties table
      console.log('Step 1: Searching in Unverified_Properties table...');
      let unverifiedQuery = supabase.from('Unverified_Properties').select('*');

      if (projectName) {
        unverifiedQuery = unverifiedQuery.eq('projectname', projectName);
      } else if (reraNumber) {
        unverifiedQuery = unverifiedQuery.ilike('rera_number', String(reraNumber));
      }

      const { data: unverifiedData, error: unverifiedError } = await unverifiedQuery.maybeSingle();

      if (unverifiedError && unverifiedError.code !== 'PGRST116') {
        console.error('Error querying Unverified_Properties:', unverifiedError);
      }

      // If found in Unverified_Properties, return that data
      if (unverifiedData && !unverifiedError) {
        console.log(`Found property in Unverified_Properties: ${unverifiedData.projectname || unverifiedData.rera_number}`);
        const mappedData = mapPropertyToFrontendFormat(unverifiedData);
        
        return res.status(200).json({
          success: true,
          message: 'Property details fetched successfully from Unverified_Properties',
          data: mappedData,
          source: 'Unverified_Properties'
        });
      }

      console.log('Property not found in Unverified_Properties, searching in unified_data...');

      // Step 2: If not found in Unverified_Properties, search in unified_data table
      let query = supabase.from('unified_data').select('*');
      
      if (projectName) {
        query = query.eq('projectname', projectName);
      } else if (reraNumber) {
        query = query.ilike('rera_number', String(reraNumber));
      }

      // Fetch all rows for the project (some projects have multiple rows for different configurations)
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching from unified_data:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (!data || data.length === 0) {
        console.log('Property not found in either Unverified_Properties or unified_data table');
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const propertyData = data[0];
      console.log(`Found property in unified_data: ${propertyData.projectname} (${data.length} row(s) found)`);

      // Handle configurations from multiple rows if needed
      let configurations: any[] = [];
      const isVillaProject = propertyData.project_type === 'Villa';
      
      if (propertyData.configurations && Array.isArray(propertyData.configurations) && propertyData.configurations.length > 0) {
        configurations = propertyData.configurations.map((config: any) => {
          const transformedConfig: any = {
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
      } else if (data.length > 0) {
        configurations = data
          .filter((row: any) => row.bhk || row.sqfeet || row.sqyard)
          .map((row: any) => {
            const config: any = {
              type: row.bhk ? `${row.bhk} BHK` : null,
              facing: row.facing || null,
              No_of_car_Parking: row.no_of_car_parkings ? parseInt(row.no_of_car_parkings) : null,
              configsoldoutstatus: row.configsoldoutstatus || 'active'
            };
            
            if (isVillaProject) {
              config.sizeSqFt = row.sqfeet ? parseFloat(row.sqfeet) : null;
              config.sizeSqYd = row.sqyard ? parseFloat(row.sqyard) : null;
            } else {
              config.sizeRange = row.sqfeet ? parseFloat(row.sqfeet) : null;
              config.sizeUnit = 'Sq ft';
            }
            
            return config;
          })
          .filter((config: any) => config.type !== null);
      }

      const mappedData = mapPropertyToFrontendFormat(propertyData);
      mappedData.configurations = configurations;

      res.status(200).json({ 
        success: true, 
        message: 'Property details fetched successfully from unified_data',
        data: mappedData,
        source: 'unified_data'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Get all properties
  app.get('/api/verified/all-properties', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    try {
      const { data, error } = await supabase
        .from('unified_data')
        .select('*')
        .order('projectname', { ascending: true })
        .limit(500);

      if (error) {
        console.error('Error fetching properties:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // === UNVERIFIED PROPERTIES ROUTES ===

  // Get drafts by email
  app.get('/api/unverified/DraftData/:email', async (req, res) => {
    const { email } = req.params;

    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const decodedEmail = decodeURIComponent(email);
      const { data, error } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('useremail', decodedEmail)
        .order('updatedat', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!data || data.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Submit short form
  app.post('/api/unverified/shortform', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    try {
      const {
        ProjectName, BuilderName, RERA_Number, Project_Type, Number_of_Floors,
        Number_of_Flats_Per_Floor, Possession_Date, Open_Space, Carpet_area_Percentage,
        Floor_to_Ceiling_Height, Ground_vehicle_Movement, Wow_Factor_Amenity,
        Amount_For_Extra_Car_Parking, PowerBackup, Commission_percentage,
        After_agreement_of_sale_what_is_payout_time_period, configurations,
        POC_Name, POC_Contact, POC_Role, UserEmail, BaseProjectPrice,
        CommunityType, Total_land_Area, Number_of_Towers, Total_Number_of_Units,
        Construction_Status, Price_per_sft
      } = req.body;

      if (!UserEmail) {
        return res.status(400).json({ success: false, message: 'UserEmail is required' });
      }

      const newProject = {
        projectname: ProjectName,
        buildername: BuilderName,
        rera_number: RERA_Number,
        project_type: Project_Type,
        number_of_floors: Number_of_Floors,
        number_of_flats_per_floor: Number_of_Flats_Per_Floor,
        possession_date: Possession_Date,
        open_space: Open_Space,
        carpet_area_percentage: Carpet_area_Percentage,
        floor_to_ceiling_height: Floor_to_Ceiling_Height,
        ground_vehicle_movement: Ground_vehicle_Movement,
        specification: Wow_Factor_Amenity,
        amount_for_extra_car_parking: Amount_For_Extra_Car_Parking,
        powerbackup: PowerBackup,
        commission_percentage: Commission_percentage,
        after_agreement_of_sale_what_is_payout_time_period: After_agreement_of_sale_what_is_payout_time_period,
        configurations: configurations || [],
        poc_name: POC_Name,
        poc_contact: POC_Contact,
        poc_role: POC_Role,
        useremail: UserEmail,
        baseprojectprice: BaseProjectPrice || 0,
        communitytype: CommunityType || 'Gated Community',
        total_land_area: Total_land_Area || 'Not specified',
        number_of_towers: Number_of_Towers || 1,
        total_number_of_units: Total_Number_of_Units || (Number_of_Floors * Number_of_Flats_Per_Floor),
        construction_status: Construction_Status || 'Ongoing',
        price_per_sft: Price_per_sft || 0,
        status: 'Unverified',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('Unverified_Properties')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ success: false, message: 'Error creating project' });
      }

      res.status(201).json({ success: true, message: 'Project created successfully', data });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Verify/Update project
  app.put('/api/unverified/verifyProject/:reraNumber', async (req, res) => {
    const { reraNumber } = req.params;
    const data = req.body;
    const { action = 'update' } = req.query;

    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      // Find the unverified project
      const { data: existingProject, error: findError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('rera_number', reraNumber)
        .maybeSingle();

      if (findError || !existingProject) {
        return res.status(404).json({ message: 'Unverified project not found' });
      }

      if (action === 'verify') {
        // Move to verified table (onboarded_data)
        const verifiedData = {
          rera_number: reraNumber,
          projectname: data.ProjectName || existingProject.projectname,
          buildername: data.BuilderName || existingProject.buildername,
          project_type: data.Project_Type || existingProject.project_type,
          communitytype: data.CommunityType || existingProject.communitytype,
          number_of_floors: data.Number_of_Floors || existingProject.number_of_floors,
          possession_date: data.Possession_Date || existingProject.possession_date,
          open_space: data.Open_Space || existingProject.open_space,
          commission_percentage: data.Commission_percentage || existingProject.commission_percentage,
          poc_name: data.POC_Name || existingProject.poc_name,
          poc_contact: data.POC_Contact || existingProject.poc_contact,
          poc_role: data.POC_Role || existingProject.poc_role,
          useremail: existingProject.useremail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('onboarded_data')
          .insert([verifiedData]);

        if (insertError) {
          console.error('Error inserting to verified:', insertError);
          return res.status(500).json({ message: 'Error verifying project' });
        }

        // Delete from unverified
        await supabase
          .from('Unverified_Properties')
          .delete()
          .eq('rera_number', reraNumber);

        res.status(200).json({ message: 'Project verified and saved successfully', data: verifiedData });
      } else {
        // Just update the existing record
        const updateData = {
          ...existingProject,
          ...data,
          updatedat: new Date().toISOString()
        };

        delete updateData.id;

        const { data: updated, error: updateError } = await supabase
          .from('Unverified_Properties')
          .update(updateData)
          .eq('rera_number', reraNumber)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating project:', updateError);
          return res.status(500).json({ message: 'Error updating project' });
        }

        res.status(200).json({ message: 'Project updated successfully', data: updated, action: 'updated' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // === LEAD REGISTRATION ROUTES ===

  // Get all leads
  app.get('/api/leads', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;

      const { data: leads, error, count } = await supabase
        .from('client_Requirements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching leads:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      res.status(200).json({
        success: true,
        data: leads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create lead
  app.post('/api/leads', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { client_mobile, requirement_name, preferences, matched_properties, shortlisted_properties, site_visits } = req.body;

      if (!client_mobile) {
        return res.status(400).json({ message: 'Client mobile number is required' });
      }

      // Get next requirement number for this mobile
      const { data: existingLeads } = await supabase
        .from('client_Requirements')
        .select('requirement_number')
        .eq('client_mobile', client_mobile)
        .order('requirement_number', { ascending: false })
        .limit(1);

      let nextRequirementNumber = 1;
      if (existingLeads && existingLeads.length > 0) {
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

      const { data: newLead, error } = await supabase
        .from('client_Requirements')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        return res.status(500).json({ message: 'Error creating lead' });
      }

      res.status(201).json({ message: 'Lead created successfully', data: newLead });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get leads by mobile
  app.get('/api/leads/mobile/:mobile', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { mobile } = req.params;
      const { data: leads, error } = await supabase
        .from('client_Requirements')
        .select('*')
        .eq('client_mobile', mobile)
        .order('requirement_number', { ascending: true });

      if (error) {
        console.error('Error fetching leads:', error);
        return res.status(404).json({ message: 'Leads not found' });
      }

      res.status(200).json({ success: true, data: leads || [] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get lead by ID
  app.get('/api/leads/:id', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const { data: lead, error } = await supabase
        .from('client_Requirements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update lead
  app.put('/api/leads/:id', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error } = await supabase
        .from('client_Requirements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        return res.status(500).json({ message: 'Error updating lead' });
      }

      res.status(200).json({ message: 'Lead updated successfully', data: updated });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete lead
  app.delete('/api/leads/:id', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('client_Requirements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lead:', error);
        return res.status(500).json({ message: 'Error deleting lead' });
      }

      res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get POC details by RERA numbers
  app.post('/api/leads/poc-details', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { rera_numbers } = req.body;

      if (!rera_numbers || !Array.isArray(rera_numbers) || rera_numbers.length === 0) {
        return res.status(400).json({ message: 'RERA numbers array is required' });
      }

      const limitedReraNumbers = rera_numbers.slice(0, 100);

      const { data: pocData, error } = await supabase
        .from('unified_data')
        .select('rera_number, projectname, buildername, poc_name, poc_contact, poc_role, GRID_Score, baseprojectprice')
        .in('rera_number', limitedReraNumbers);

      if (error) {
        console.error('Error fetching POC details:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      const pocMap: Record<string, any> = {};
      (pocData || []).forEach((item: any) => {
        if (item.rera_number) {
          pocMap[item.rera_number] = {
            poc_name: item.poc_name || '',
            poc_contact: item.poc_contact || '',
            poc_role: item.poc_role || '',
            projectname: item.projectname || '',
            buildername: item.buildername || '',
            grid_score: item.GRID_Score || '',
            price_range: item.baseprojectprice || ''
          };
        }
      });

      res.status(200).json({ success: true, data: pocMap });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // === ADMIN ROUTES ===

  // Get all properties for admin
  app.get('/api/admin/properties', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { email } = req.query;

      let query = supabase.from('Unverified_Properties').select('*').order('updatedat', { ascending: false });

      if (email) {
        query = query.eq('useremail', email);
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('Error fetching properties:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get all agent emails
  app.get('/api/admin/agent-emails', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { data, error } = await supabase
        .from('Unverified_Properties')
        .select('useremail')
        .not('useremail', 'is', null);

      if (error) {
        console.error('Error fetching agent emails:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      const emailsSet = new Set((data || []).map((d: any) => d.useremail).filter(Boolean));
      res.status(200).json({ success: true, data: Array.from(emailsSet).sort() });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Verify property (admin action)
  app.post('/api/admin/properties/:id/verify', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { id } = req.params;

      // Get the property
      const { data: property, error: getError } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .eq('id', id)
        .single();

      if (getError || !property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Insert into verified table
      const verifiedData = {
        rera_number: property.rera_number,
        projectname: property.projectname,
        buildername: property.buildername,
        project_type: property.project_type,
        communitytype: property.communitytype,
        number_of_floors: property.number_of_floors,
        possession_date: property.possession_date,
        open_space: property.open_space,
        commission_percentage: property.commission_percentage,
        poc_name: property.poc_name,
        poc_contact: property.poc_contact,
        poc_role: property.poc_role,
        useremail: property.useremail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('onboarded_data')
        .insert([verifiedData]);

      if (insertError) {
        console.error('Error inserting verified property:', insertError);
        return res.status(500).json({ message: 'Error verifying property' });
      }

      // Delete from unverified
      await supabase
        .from('Unverified_Properties')
        .delete()
        .eq('id', id);

      res.status(200).json({ message: 'Property verified successfully', data: verifiedData });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Agent reports endpoint
  app.get('/api/agent/reports', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { email } = req.query;

      let query = supabase.from('Unverified_Properties').select('*');
      
      if (email) {
        query = query.eq('useremail', email);
      }

      const { data, error } = await query.order('updatedat', { ascending: false });

      if (error) {
        console.error('Error fetching agent reports:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // === PROPERTIES ===

  app.get(api.properties.list.path, async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        agentId: req.query.agentId as string,
      };
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get(api.properties.get.path, async (req, res) => {
    try {
      const property = await storage.getProperty(Number(req.params.id));
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post(api.properties.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(input);
      res.status(201).json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put(api.properties.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(Number(req.params.id), input);
      if (!property) return res.status(404).json({ message: "Property not found" });
      res.json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete(api.properties.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteProperty(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // === LEADS ===

  app.get(api.leads.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const filters = {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
      };
      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post(api.leads.create.path, async (req, res) => {
    try {
      const input = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put(api.leads.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), input);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // === PROFILE ===

  app.get(api.profile.get.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const profile = await storage.getProfile(req.user.claims.sub);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put(api.profile.update.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const profile = await storage.updateProfile(req.user.claims.sub, req.body);
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
