import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { api } from "@shared/routes";
import { z } from "zod";
import { insertPropertySchema, insertLeadSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const UNIFIED_DATA_KEYS = [
  'id', 'rera_number', 'projectname', 'buildername', 'baseprojectprice', 'projectbrochure', 'contact', 'projectlocation', 'project_type', 'buildingname', 'communitytype', 'total_land_area', 'number_of_towers', 'number_of_floors', 'number_of_flats_per_floor', 'total_number_of_units', 'project_launch_date', 'possession_date', 'construction_status', 'open_space', 'carpet_area_percentage', 'floor_to_ceiling_height', 'price_per_sft', 'external_amenities', 'specification', 'powerbackup', 'no_of_passenger_lift', 'no_of_service_lift', 'visitor_parking', 'ground_vehicle_movement', 'bhk', 'facing', 'sqfeet', 'sqyard', 'no_of_car_parkings', 'amount_for_extra_car_parking', 'home_loan', 'complaint_details', 'construction_material', 'commission_percentage', 'what_is_there_price', 'what_is_relai_price', 'after_agreement_of_sale_what_is_payout_time_period', 'is_lead_registration_required_before_site_visit', 'turnaround_time_for_lead_acknowledgement', 'is_there_validity_period_for_registered_lead', 'validity_period_value', 'person_to_confirm_registration', 'notes_comments_on_lead_registration_workflow', 'accepted_modes_of_lead_registration', 'status', 'useremail', 'poc_name', 'poc_contact', 'poc_role', 'createdat', 'updatedat', 'verified', 'areaname', 'pricesheet_link', 'pricesheet_link_1', 'total_buildup_area', 'uds', 'fsi', 'main_door_height', 'available_banks_for_loan', 'floor_rise_charges', 'floor_rise_amount_per_floor', 'floor_rise_applicable_above_floor_no', 'facing_charges', 'preferential_location_charges', 'preferential_location_charges_conditions', 'project_status', 'google_place_id', 'google_place_name', 'google_place_address', 'google_place_location', 'google_place_rating', 'google_place_user_ratings_total', 'google_maps_location', 'google_place_raw_data', 'hospitals_count', 'shopping_malls_count', 'schools_count', 'restaurants_count', 'restaurants_above_4_stars_count', 'supermarkets_count', 'it_offices_count', 'metro_stations_count', 'railway_stations_count', 'nearest_hospitals', 'nearest_shopping_malls', 'nearest_schools', 'nearest_restaurants', 'high_rated_restaurants', 'nearest_supermarkets', 'nearest_it_offices', 'nearest_metro_station', 'nearest_railway_station', 'nearest_orr_access', 'connectivity_score', 'amenities_score', 'amenities_raw_data', 'amenities_updated_at', 'mobile_google_map_url', 'GRID_Score', 'isavailable', 'configsoldoutstatus', 'city', 'state', 'cp',
  'builder_age', 'builder_completed_properties', 'builder_ongoing_projects', 'builder_operating_locations', 'builder_origin_city', 'builder_total_properties', 'builder_upcoming_properties'
];

function filterUnifiedData(data: any): any {
  const filtered: any = {};
  UNIFIED_DATA_KEYS.forEach(key => {
    if (key in data && data[key] !== undefined) {
      filtered[key] = data[key];
    }
  });
  return filtered;
}

function normalizeBhk(bhk: any): string {
  if (!bhk) return '';
  return String(bhk).toLowerCase().replace(/[^0-9.]/g, '').trim() || String(bhk).toLowerCase().trim();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {



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

  // Get all leads with pagination and search
  app.get('/api/lead-registration', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const offset = (page - 1) * limit;
      const search = (req.query.search as string)?.trim() || '';

      // Build query with optional search filter
      // Only fetch leads that have actual shortlisted_properties values
      let query = supabase
        .from('client_Requirements')
        .select('*', { count: 'exact' })
        .not('shortlisted_properties', 'is', null)
        .neq('shortlisted_properties', '[]');

      // Apply search filter if provided
      if (search) {
        // Search by client_mobile or requirement_name. 
        // We use a more robust or string and ensure patterns are correctly formatted.
        const searchPattern = `%${search}%`;

        // Check if we should also search by client_name (if it exists)
        // For now, we'll keep it as it's in the interface, but we'll make it safe
        query = query.or(`client_mobile.ilike.${searchPattern},requirement_name.ilike.${searchPattern},lead_name.ilike.${searchPattern},lead_mobile.ilike.${searchPattern}`);
      }

      const { data: leads, error, count } = await query
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
        .select('*')
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
            price_range: item.baseprojectprice || '',
            accepted_modes_of_lead_registration: item.accepted_modes_of_lead_registration || item.Accepted_Modes_of_Lead_Registration || item.mode_of_registration || item.accepted_modes || null,
            alternative_contact: item.alternative_contact || ''
          };
        }
      });

      res.status(200).json({ success: true, data: pocMap });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update Alternative Contact
  app.put('/api/lead-registration/update-alt-contact', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { rera_number, alternative_contact } = req.body;

      if (!rera_number) {
        return res.status(400).json({ message: 'RERA number is required' });
      }

      const { error } = await supabase
        .from('unified_data')
        .update({ alternative_contact })
        .eq('rera_number', rera_number);

      if (error) {
        console.error('Error updating alternative contact:', error);
        return res.status(500).json({ message: 'Failed to update contact' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get Zoho lead names by mobile numbers (placeholder - would need Zoho API integration)
  app.post('/api/lead-registration/zoho-leads', async (req, res) => {
    // This endpoint would integrate with Zoho CRM API to fetch lead names
    // For now, return empty data since Zoho API credentials aren't configured
    res.status(200).json({ success: true, data: {} });
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
        // Prepare data for unified_data table
        const baseProjectData = {
          ...existingProject,
          ...data,
          verified: 'true',
          updatedat: new Date().toISOString()
        };

        const configurations = existingProject.configurations || data.configurations || [];
        const rowsToUpsert: any[] = [];

        // Try to find existing rows in unified_data to update instead of create new ones
        let matches: any[] = [];
        const searchKey = existingProject.rera_number || data.ReraNumber;
        const searchName = data.ProjectName || existingProject.projectname;

        if (searchKey || searchName) {
          let query = supabase.from('unified_data').select('id, rera_number, projectname, bhk, sqfeet, facing');
          if (searchKey) {
            query = query.eq('rera_number', String(searchKey).trim());
          } else {
            query = query.eq('projectname', String(searchName).trim());
          }
          const { data: existingMatches } = await query;
          matches = existingMatches || [];
        }

        const usedMatchIds = new Set<string>();

        if (configurations.length > 0) {
          // Create/Update a row for each configuration
          configurations.forEach((config: any, index: number) => {
            const { configurations: _, bhk: __, BHK: ___, ...cleanBaseData } = baseProjectData;

            const currentBhk = config.type || config.bhk || '';
            const currentSqfeet = config.sizeUnit === 'Sq ft' ? config.sizeRange : null;
            const currentFacing = config.facing || '';

            const normalizedInputBhk = normalizeBhk(currentBhk);

            // Tier 1: Perfect Match
            let match = matches.find(m => {
              if (usedMatchIds.has(m.id)) return false;
              const bhkMatch = normalizeBhk(m.bhk) === normalizedInputBhk;
              const facingMatch = !currentFacing || !m.facing ||
                m.facing.toLowerCase().trim() === currentFacing.toLowerCase().trim();
              const sqfeetMatch = !currentSqfeet || !m.sqfeet ||
                String(m.sqfeet).trim() === String(currentSqfeet).trim();
              return bhkMatch && facingMatch && sqfeetMatch;
            });

            // Tier 2: BHK + Facing
            if (!match) {
              match = matches.find(m => {
                if (usedMatchIds.has(m.id)) return false;
                const bhkMatch = normalizeBhk(m.bhk) === normalizedInputBhk;
                const facingMatch = !currentFacing || !m.facing ||
                  m.facing.toLowerCase().trim() === currentFacing.toLowerCase().trim();
                return bhkMatch && facingMatch;
              });
            }

            // Tier 3: BHK Match
            if (!match) {
              match = matches.find(m => {
                if (usedMatchIds.has(m.id)) return false;
                return normalizeBhk(m.bhk) === normalizedInputBhk;
              });
            }

            // Tier 4: Greedy match (Any unused row for this project)
            if (!match) {
              match = matches.find(m => !usedMatchIds.has(m.id));
            }

            if (match) usedMatchIds.add(match.id);

            const rowData = {
              ...cleanBaseData,
              id: match ? match.id : `${existingProject.id}_${index}`,
              bhk: normalizeBhk(currentBhk),
              sqfeet: currentSqfeet,
              sqyard: config.sizeUnit === 'Sq yard' ? config.sizeRange : null,
              no_of_car_parkings: config.No_of_car_Parking || config.no_of_car_parkings || null,
              uds: config.uds || null,
              facing: currentFacing,
              configsoldoutstatus: config.configsoldoutstatus || config.configSoldOutStatus || 'active'
            };
            rowsToUpsert.push(filterUnifiedData(rowData));
          });
        } else {
          // No configurations, just one row
          const { configurations: _, bhk: __, BHK: ___, ...cleanBaseData } = baseProjectData;

          // Match by rera/name alone if no configs
          const match = matches[0];

          const rowData = {
            ...cleanBaseData,
            id: match ? match.id : existingProject.id,
            bhk: normalizeBhk(cleanBaseData.bhk)
          };
          rowsToUpsert.push(filterUnifiedData(rowData));
        }

        // Apply creation timestamp if missing
        rowsToUpsert.forEach(row => {
          if (!row.createdat) {
            row.createdat = baseProjectData.createdat || existingProject.created_at || new Date().toISOString();
          }
        });

        console.log('Upserting to unified_data (Agent):', JSON.stringify(rowsToUpsert, null, 2));
        const { error: insertError } = await supabase
          .from('unified_data')
          .upsert(rowsToUpsert, { onConflict: 'id' });

        if (insertError) {
          console.error('Error inserting to unified_data:', insertError);
          return res.status(500).json({
            message: 'Error verifying project',
            success: false,
            error: insertError.message,
            details: insertError.details
          });
        }

        // Export the first row's data for the response compatibility
        const unifiedData = rowsToUpsert[0];

        // Delete from unverified
        await supabase
          .from('Unverified_Properties')
          .delete()
          .eq('rera_number', reraNumber);

        res.status(200).json({ success: true, message: 'Project verified and saved successfully', data: unifiedData });
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
        .select('*')
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
            price_range: item.baseprojectprice || '',
            accepted_modes_of_lead_registration: item.accepted_modes_of_lead_registration || item.Accepted_Modes_of_Lead_Registration || item.mode_of_registration || item.accepted_modes || null
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

      const { data, error } = await query;

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
      res.status(200).json({ success: true, emails: Array.from(emailsSet).sort() });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get property from unified/master table by project name
  app.get('/api/admin/properties/mongodb/:projectName', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { projectName } = req.params;

      // Search in the unified/master properties table
      const { data, error } = await supabase
        .from('unified_data')
        .select('*')
        .ilike('projectname', `%${projectName}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching unified data:', error);
        return res.status(500).json({ message: 'Database error', success: false });
      }

      res.status(200).json({ success: true, data: data || null });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error', success: false });
    }
  });

  // Get property from verified/onboarded table by project name
  app.get('/api/admin/properties/verified/:projectName', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: 'Database not available' });
    }

    try {
      const { projectName } = req.params;

      // Search in the Unverified_Properties table (agent submissions)
      const { data, error } = await supabase
        .from('Unverified_Properties')
        .select('*')
        .ilike('projectname', `%${projectName}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching verified data:', error);
        return res.status(500).json({ message: 'Database error', success: false });
      }

      res.status(200).json({ success: true, data: data || null });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error', success: false });
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

      // Prepare data for unified_data table
      const configurations = property.configurations || [];
      const rowsToUpsert: any[] = [];

      // Try to find existing rows in unified_data to update
      let matches: any[] = [];
      if (property.rera_number || property.projectname) {
        let query = supabase.from('unified_data').select('id, rera_number, projectname, bhk, sqfeet, facing');
        if (property.rera_number) {
          query = query.eq('rera_number', String(property.rera_number).trim());
        } else {
          query = query.eq('projectname', String(property.projectname).trim());
        }
        const { data: existingMatches } = await query;
        matches = existingMatches || [];
      }

      const usedMatchIds = new Set<string>();

      if (configurations.length > 0) {
        // Create/Update a row for each configuration
        configurations.forEach((config: any, index: number) => {
          // Explicitly remove configurations and bhk to avoid schema or double-key errors
          const { configurations: _, bhk: __, BHK: ___, ...cleanProperty } = property;

          const currentBhk = config.type || config.bhk || '';
          const currentSqfeet = config.sizeUnit === 'Sq ft' ? config.sizeRange : null;
          const currentFacing = config.facing || '';

          const normalizedInputBhk = normalizeBhk(currentBhk);

          // Tier 1: Perfect Match
          let match = matches.find(m => {
            if (usedMatchIds.has(m.id)) return false;
            const bhkMatch = normalizeBhk(m.bhk) === normalizedInputBhk;
            const facingMatch = !currentFacing || !m.facing ||
              m.facing.toLowerCase().trim() === currentFacing.toLowerCase().trim();
            const sqfeetMatch = !currentSqfeet || !m.sqfeet ||
              String(m.sqfeet).trim() === String(currentSqfeet).trim();
            return bhkMatch && facingMatch && sqfeetMatch;
          });

          // Tier 2: BHK + Facing
          if (!match) {
            match = matches.find(m => {
              if (usedMatchIds.has(m.id)) return false;
              const bhkMatch = normalizeBhk(m.bhk) === normalizedInputBhk;
              const facingMatch = !currentFacing || !m.facing ||
                m.facing.toLowerCase().trim() === currentFacing.toLowerCase().trim();
              return bhkMatch && facingMatch;
            });
          }

          // Tier 3: BHK Match
          if (!match) {
            match = matches.find(m => {
              if (usedMatchIds.has(m.id)) return false;
              return normalizeBhk(m.bhk) === normalizedInputBhk;
            });
          }

          // Tier 4: Greedy match (Any unused row for this project)
          if (!match) {
            match = matches.find(m => !usedMatchIds.has(m.id));
          }

          if (match) usedMatchIds.add(match.id);

          const rowData = {
            ...cleanProperty,
            id: match ? match.id : `${property.id}_${index}`,
            verified: 'true',
            updatedat: new Date().toISOString(),
            bhk: normalizeBhk(currentBhk),
            sqfeet: currentSqfeet,
            sqyard: config.sizeUnit === 'Sq yard' ? config.sizeRange : null,
            no_of_car_parkings: config.No_of_car_Parking || config.no_of_car_parkings || null,
            uds: config.uds || null,
            facing: currentFacing,
            configsoldoutstatus: config.configsoldoutstatus || config.configSoldOutStatus || 'active'
          };

          const filtered = filterUnifiedData(rowData);
          if (!filtered.createdat) {
            filtered.createdat = property.createdat || property.created_at || new Date().toISOString();
          }
          rowsToUpsert.push(filtered);
        });
      } else {
        // No configurations, just one row
        const { configurations: _, bhk: __, BHK: ___, ...cleanProperty } = property;

        // Match by rera/name alone if no configs
        const match = matches[0];

        const filtered = filterUnifiedData({
          ...cleanProperty,
          verified: 'true',
          id: match ? match.id : property.id,
          bhk: normalizeBhk(cleanProperty.bhk),
          updatedat: new Date().toISOString()
        });
        if (!filtered.createdat) {
          filtered.createdat = property.createdat || property.created_at || new Date().toISOString();
        }
        rowsToUpsert.push(filtered);
      }

      console.log('Upserting to unified_data (Admin):', JSON.stringify(rowsToUpsert, null, 2));
      const { error: insertError } = await supabase
        .from('unified_data')
        .upsert(rowsToUpsert, { onConflict: 'id' });

      if (insertError) {
        console.error('Error inserting unified property:', insertError);
        return res.status(500).json({
          message: 'Error verifying property',
          success: false,
          error: insertError.message,
          details: insertError.details
        });
      }

      const unifiedData = rowsToUpsert[0];

      // Delete from unverified
      await supabase
        .from('Unverified_Properties')
        .delete()
        .eq('id', id);

      res.status(200).json({ success: true, message: 'Property verified successfully', data: unifiedData });
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

  // === PROPERTIES SAVE (for ProjectForm submission) ===

  // Helper functions to sanitize values for database
  const sanitizeNumeric = (value: any, defaultValue: number = 0): number | null => {
    if (value === null || value === undefined || value === '' || value === '---' || value === 'N/A') {
      return defaultValue;
    }
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? defaultValue : num;
  };

  const sanitizeInteger = (value: any, defaultValue: number = 0): number | null => {
    if (value === null || value === undefined || value === '' || value === '---' || value === 'N/A') {
      return defaultValue;
    }
    const num = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
    return isNaN(num) ? defaultValue : num;
  };

  const sanitizeText = (value: any, defaultValue: string | null = null): string | null => {
    if (value === null || value === undefined || value === '' || value === '---') {
      return defaultValue;
    }
    return String(value);
  };

  const sanitizeEnum = (value: any, validValues: string[], defaultValue: string): string => {
    if (!value || value === '---' || value === '') return defaultValue;
    const strValue = String(value);
    return validValues.includes(strValue) ? strValue : defaultValue;
  };

  app.post('/api/properties/save', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Database not available' });
    }

    try {
      const propertyData = req.body;
      console.log('Received property data for save:', JSON.stringify(propertyData, null, 2).substring(0, 500));

      // Check if we have a RERA number to identify the property
      const reraNumber = propertyData.RERA_Number || propertyData.rera_number;

      if (!reraNumber) {
        return res.status(400).json({
          success: false,
          message: 'RERA number is required'
        });
      }

      // Valid enum values based on database schema
      const projectTypes = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Independent House', 'Row House', 'Villa Apartment', 'Plotting'];
      const communityTypes = ['Gated Community', 'Non-Gated Community', 'Standalone', 'Semi Gated Community', 'Semi-Gated Community'];
      const constructionStatuses = ['Pre-Launch', 'Under Construction', 'Ongoing', 'Ready to Move in', 'Nearing Possession', 'Completed', 'About to RTM', 'RTM'];
      const powerBackupTypes = ['Full', 'Partial', 'None', 'DG Backup'];
      const visitorParkingTypes = ['yes', 'no'];
      const groundMovementTypes = ['yes', 'no'];
      const constructionMaterials = ['Concrete', 'Steel', 'Hybrid', 'Pre-Fabricated', 'Brick', 'Wood'];
      const yesNoTypes = ['yes', 'no'];

      // Map frontend format to database format with proper sanitization
      const dbData: any = {
        rera_number: reraNumber,
        projectname: sanitizeText(propertyData.ProjectName || propertyData.projectname, 'Untitled Project'),
        buildername: sanitizeText(propertyData.BuilderName || propertyData.buildername, 'Unknown Builder'),
        areaname: sanitizeText(propertyData.AreaName || propertyData.areaname),
        projectlocation: sanitizeText(propertyData.ProjectLocation || propertyData.projectlocation),
        project_type: sanitizeEnum(propertyData.Project_Type || propertyData.project_type, projectTypes, 'Apartment'),
        buildingname: sanitizeText(propertyData.BuildingName || propertyData.buildingname),
        communitytype: sanitizeEnum(propertyData.CommunityType || propertyData.communitytype, communityTypes, 'Gated Community'),
        total_land_area: sanitizeText(propertyData.Total_land_Area || propertyData.total_land_area, '0'),
        number_of_towers: sanitizeInteger(propertyData.Number_of_Towers || propertyData.number_of_towers, 1),
        number_of_floors: sanitizeInteger(propertyData.Number_of_Floors || propertyData.number_of_floors, 1),
        number_of_flats_per_floor: sanitizeInteger(propertyData.Number_of_Flats_Per_Floor || propertyData.number_of_flats_per_floor, 1),
        total_number_of_units: sanitizeInteger(propertyData.Total_Number_of_Units || propertyData.total_number_of_units, 1),
        project_launch_date: sanitizeText(propertyData.Launch_Date || propertyData.project_launch_date),
        possession_date: sanitizeText(propertyData.Possession_Date || propertyData.possession_date),
        construction_status: sanitizeEnum(propertyData.Construction_Status || propertyData.construction_status, constructionStatuses, 'Ongoing'),
        open_space: sanitizeNumeric(propertyData.Open_Space || propertyData.open_space, 0),
        carpet_area_percentage: sanitizeNumeric(propertyData.Carpet_area_Percentage || propertyData.carpet_area_percentage, 0),
        floor_to_ceiling_height: sanitizeNumeric(propertyData.Floor_to_Ceiling_Height || propertyData.floor_to_ceiling_height, 0),
        price_per_sft: sanitizeNumeric(propertyData.Price_per_sft || propertyData.price_per_sft, 0),
        total_buildup_area: sanitizeText(propertyData.Total_Buildup_Area || propertyData.total_buildup_area),
        uds: sanitizeText(propertyData.UDS || propertyData.uds),
        fsi: sanitizeText(propertyData.FSI || propertyData.fsi),
        main_door_height: sanitizeText(propertyData.Main_Door_Height || propertyData.main_door_height),
        external_amenities: propertyData.External_Amenities || propertyData.external_amenities || null,
        specification: propertyData.Specification || propertyData.specification || null,
        powerbackup: sanitizeEnum(propertyData.PowerBackup || propertyData.powerbackup, powerBackupTypes, 'Full'),
        no_of_passenger_lift: sanitizeInteger(propertyData.No_of_Passenger_lift || propertyData.no_of_passenger_lift, 0),
        no_of_service_lift: sanitizeInteger(propertyData.No_of_Service_lift || propertyData.no_of_service_lift, 0),
        visitor_parking: sanitizeEnum(propertyData.Visitor_Parking || propertyData.visitor_parking, visitorParkingTypes, 'yes'),
        ground_vehicle_movement: sanitizeEnum(propertyData.Ground_vehicle_Movement || propertyData.ground_vehicle_movement, groundMovementTypes, 'yes'),
        baseprojectprice: sanitizeNumeric(propertyData.baseprojectprice || propertyData['Base Project Price'], 0),
        commission_percentage: sanitizeNumeric(propertyData.Commission_percentage || propertyData.commission_percentage, 0),
        amount_for_extra_car_parking: sanitizeNumeric(propertyData.Amount_For_Extra_Car_Parking || propertyData.amount_for_extra_car_parking, 0),
        home_loan: sanitizeText(propertyData.Home_Loan || propertyData.home_loan),
        what_is_there_price: sanitizeText(propertyData.What_is_there_Price || propertyData.what_is_there_price),
        what_is_relai_price: sanitizeText(propertyData.What_is_Relai_Price || propertyData.what_is_relai_price),
        floor_rise_charges: sanitizeText(propertyData.Floor_Rise_Charges || propertyData.floor_rise_charges),
        floor_rise_amount_per_floor: sanitizeText(propertyData.Floor_Rise_Amount_per_Floor || propertyData.floor_rise_amount_per_floor),
        floor_rise_applicable_above_floor_no: sanitizeText(propertyData.Floor_Rise_Applicable_Above_Floor_No || propertyData.floor_rise_applicable_above_floor_no),
        facing_charges: sanitizeText(propertyData.Facing_Charges || propertyData.facing_charges),
        preferential_location_charges: sanitizeText(propertyData.Preferential_Location_Charges || propertyData.preferential_location_charges),
        preferential_location_charges_conditions: sanitizeText(propertyData.Preferential_Location_Charges_Conditions || propertyData.preferential_location_charges_conditions),
        available_banks_for_loan: propertyData.Available_Banks_for_Loan || propertyData.available_banks_for_loan || null,
        builder_age: sanitizeText(propertyData.Builder_Age || propertyData.builder_age),
        builder_total_properties: sanitizeText(propertyData.Builder_Total_Properties || propertyData.builder_total_properties),
        builder_upcoming_properties: sanitizeText(propertyData.Builder_Upcoming_Properties || propertyData.builder_upcoming_properties),
        builder_completed_properties: sanitizeText(propertyData.Builder_Completed_Properties || propertyData.builder_completed_properties),
        builder_ongoing_projects: sanitizeText(propertyData.Builder_Ongoing_Projects || propertyData.builder_ongoing_projects),
        builder_origin_city: sanitizeText(propertyData.Builder_Origin_City || propertyData.builder_origin_city),
        builder_operating_locations: propertyData.Builder_Operating_Locations || propertyData.builder_operating_locations || null,
        previous_complaints_on_builder: sanitizeText(propertyData.Previous_Complaints_on_Builder || propertyData.previous_complaints_on_builder),
        complaint_details: sanitizeText(propertyData.Complaint_Details || propertyData.complaint_details),
        construction_material: sanitizeEnum(propertyData.Construction_Material || propertyData.construction_material, constructionMaterials, 'Concrete'),
        configurations: propertyData.configurations || [],
        status: propertyData.status === 'Submitted' ? 'Submitted' : 'Unverified',
        useremail: sanitizeText(propertyData.userEmail || propertyData.useremail, 'unknown@example.com'),
        poc_name: sanitizeText(propertyData.POC_Name || propertyData.poc_name, 'Unknown'),
        poc_contact: sanitizeNumeric(propertyData.POC_Contact || propertyData.poc_contact, 0),
        poc_role: sanitizeText(propertyData.POC_Role || propertyData.poc_role, 'Agent'),
        person_to_confirm_registration: propertyData.Person_to_Confirm_Registration || propertyData.person_to_confirm_registration || {},
        after_agreement_of_sale_what_is_payout_time_period: sanitizeNumeric(propertyData.After_Agreement_of_Sale_Payout_Time || propertyData.after_agreement_of_sale_what_is_payout_time_period, 0),
        turnaround_time_for_lead_acknowledgement: sanitizeNumeric(propertyData.Turnaround_Time_for_Lead || propertyData.turnaround_time_for_lead_acknowledgement, 0),
        is_there_validity_period_for_registered_lead: sanitizeEnum(propertyData.Is_There_Validity_Period || propertyData.is_there_validity_period_for_registered_lead, yesNoTypes, 'no'),
        is_lead_registration_required_before_site_visit: propertyData.Is_lead_Registration_required_before_Site_visit || propertyData.is_lead_registration_required_before_site_visit || null,
        accepted_modes_of_lead_registration: propertyData.Accepted_Modes_of_Lead_Registration || propertyData.accepted_modes_of_lead_registration || null,
        notes_comments_on_lead_registration_workflow: propertyData.Notes_Comments_on_lead_registration_workflow || propertyData.notes_comments_on_lead_registration_workflow || null,
        validity_period_value: propertyData.validity_period_value || null,
        cp: propertyData.POC_CP || propertyData.cp || null,
        projectbrochure: sanitizeText(propertyData.ProjectBrochure || propertyData.projectbrochure),
        pricesheet_link_1: sanitizeText(propertyData.Pricesheet_Link || propertyData.pricesheet_link_1),
        city: sanitizeText(propertyData.City || propertyData.city),
        state: sanitizeText(propertyData.State || propertyData.state),
        updatedat: new Date().toISOString()
      };

      // Check if property already exists in Unverified_Properties
      const { data: existingProperty, error: checkError } = await supabase
        .from('Unverified_Properties')
        .select('id')
        .eq('rera_number', reraNumber)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing property:', checkError);
      }

      let result;
      if (existingProperty) {
        // Update existing property
        console.log('Updating existing property with RERA:', reraNumber);
        const { data, error } = await supabase
          .from('Unverified_Properties')
          .update(dbData)
          .eq('rera_number', reraNumber)
          .select()
          .single();

        if (error) {
          console.error('Error updating property:', error);
          return res.status(500).json({ success: false, message: 'Failed to update property', error: error.message });
        }
        result = data;
      } else {
        // Insert new property
        console.log('Creating new property with RERA:', reraNumber);
        dbData.createdat = new Date().toISOString();
        const { data, error } = await supabase
          .from('Unverified_Properties')
          .insert(dbData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting property:', error);
          return res.status(500).json({ success: false, message: 'Failed to save property', error: error.message });
        }
        result = data;
      }

      console.log('Property saved successfully:', result?.rera_number);
      res.status(200).json({
        success: true,
        message: existingProperty ? 'Property updated successfully' : 'Property saved successfully',
        data: result
      });

    } catch (error: any) {
      console.error('Error in /api/properties/save:', error);
      res.status(500).json({
        success: false,
        message: 'Server error saving property',
        error: error.message
      });
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
    try {
      await storage.deleteProperty(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // === LEADS ===

  app.get(api.leads.list.path, async (req, res) => {
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
    try {
      // Auth removed, using placeholder or email from query/body if available
      const userId = req.query.userId as string || "local-user";
      const profile = await storage.getProfile(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put(api.profile.update.path, async (req: any, res) => {
    try {
      const userId = req.body.userId as string || "local-user";
      const profile = await storage.updateProfile(userId, req.body);
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // === SHARE LINKS (stored in client_Requirements.share_links field) ===

  // Generate a unique share link
  app.post('/api/share/create', async (req, res) => {
    try {
      const { leadName, leadMobile, propertyReraNumbers, createdBy, leadId } = req.body;

      if (!leadName || !leadMobile || !propertyReraNumbers || !Array.isArray(propertyReraNumbers) || propertyReraNumbers.length === 0) {
        return res.status(400).json({ success: false, message: 'Lead name, mobile, and at least one property are required' });
      }

      if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database not available' });
      }

      // Generate a unique token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(16).toString('hex');

      // Create share link data object
      const shareLinkData = {
        token,
        lead_name: leadName,
        lead_mobile: leadMobile,
        property_rera_numbers: propertyReraNumbers,
        created_by: createdBy || null,
        created_at: new Date().toISOString(),
      };

      // Find the client_Requirements record by mobile number
      const { data: existingRecord, error: findError } = await supabase
        .from('client_Requirements')
        .select('id, share_links')
        .eq('client_mobile', leadMobile)
        .limit(1)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding client_Requirements:', findError);
      }

      if (existingRecord) {
        // Append to existing share_links array or create new one
        const existingLinks = Array.isArray(existingRecord.share_links) ? existingRecord.share_links : [];
        const updatedLinks = [...existingLinks, shareLinkData];

        const { error: updateError } = await supabase
          .from('client_Requirements')
          .update({ share_links: updatedLinks })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('Error updating share_links:', updateError);
          throw new Error(updateError.message);
        }
        console.log('Share link stored in client_Requirements for mobile:', leadMobile);
      } else {
        console.log('No client_Requirements record found for mobile:', leadMobile);
        return res.status(400).json({ success: false, message: 'No lead found with this mobile number' });
      }

      const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;

      res.json({
        success: true,
        token,
        shareUrl,
        shareLink: shareLinkData
      });
    } catch (error: any) {
      console.error('Share link creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create share link', error: error.message });
    }
  });

  // Get share link data by token (public endpoint)
  app.get('/api/share/:token', async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
      }

      if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database not available' });
      }

      // Search for the token in client_Requirements.share_links array
      // Fetch all records that might have share_links
      const { data: records, error: fetchError } = await supabase
        .from('client_Requirements')
        .select('id, client_mobile, share_links, shortlisted_properties');

      if (fetchError) {
        console.error('Error fetching client_Requirements:', fetchError);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      console.log('Searching for token:', token);
      console.log('Total records fetched:', records?.length || 0);

      // Find the share link with matching token
      let foundShareLink: any = null;
      let foundRecord: any = null;

      for (const record of records || []) {
        let shareLinks = record.share_links;

        // Handle case where share_links might be a string (JSON)
        if (typeof shareLinks === 'string') {
          try {
            shareLinks = JSON.parse(shareLinks);
          } catch (e) {
            continue;
          }
        }

        // Ensure share_links is an array before searching
        if (!Array.isArray(shareLinks)) continue;

        const matchingLink = shareLinks.find((link: any) => link.token === token);
        if (matchingLink) {
          foundShareLink = matchingLink;
          foundRecord = record;
          console.log('Found matching record id:', record.id);
          break;
        }
      }

      if (!foundShareLink) {
        return res.status(404).json({ success: false, message: 'Share link not found or expired' });
      }

      // Fetch property details from Supabase unified_data
      const properties: any[] = [];
      const reraNumbers = foundShareLink.property_rera_numbers || [];

      for (const reraNumber of reraNumbers) {
        const { data: propertyDataArray, error } = await supabase
          .from('unified_data')
          .select('*')
          .eq('rera_number', reraNumber)
          .limit(1);

        if (!error && propertyDataArray && propertyDataArray.length > 0) {
          properties.push(propertyDataArray[0]);
        }
      }

      res.json({
        success: true,
        leadName: foundShareLink.lead_name,
        leadMobile: foundShareLink.lead_mobile,
        properties,
        createdAt: foundShareLink.created_at,
      });
    } catch (error: any) {
      console.error('Share link fetch error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch share link', error: error.message });
    }
  });

  // Save friend info for share link
  app.post('/api/share/:token/friend', async (req, res) => {
    try {
      const { token } = req.params;
      const { friend_name, friend_number } = req.body;

      if (!token || !friend_name || !friend_number) {
        return res.status(400).json({ success: false, message: 'Token, friend name, and friend number are required' });
      }

      if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database not available' });
      }

      console.log('Saving friend info for token:', token);

      // Find the record with this share token
      const { data: allRecords, error: fetchError } = await supabase
        .from('client_Requirements')
        .select('id, share_links');

      if (fetchError || !allRecords) {
        console.error('Error fetching records:', fetchError);
        return res.status(500).json({ success: false, message: 'Failed to find share link' });
      }

      let foundRecord: any = null;
      let foundLinkIndex: number = -1;

      for (const record of allRecords) {
        let shareLinks = record.share_links;

        if (typeof shareLinks === 'string') {
          try {
            shareLinks = JSON.parse(shareLinks);
          } catch (e) {
            continue;
          }
        }

        if (!Array.isArray(shareLinks)) continue;

        const linkIndex = shareLinks.findIndex((link: any) => link.token === token);
        if (linkIndex >= 0) {
          foundRecord = { ...record, share_links: shareLinks };
          foundLinkIndex = linkIndex;
          break;
        }
      }

      if (!foundRecord || foundLinkIndex < 0) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }

      // Update the share link with friend info
      const updatedLinks = [...foundRecord.share_links];
      updatedLinks[foundLinkIndex] = {
        ...updatedLinks[foundLinkIndex],
        friend_name,
        friend_number,
        friend_added_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('client_Requirements')
        .update({ share_links: JSON.stringify(updatedLinks) })
        .eq('id', foundRecord.id);

      if (updateError) {
        console.error('Error updating friend info:', updateError);
        return res.status(500).json({ success: false, message: 'Failed to save friend info' });
      }

      console.log('Friend info saved successfully for record:', foundRecord.id);
      res.json({ success: true, message: 'Friend info saved successfully' });

    } catch (error: any) {
      console.error('Save friend info error:', error);
      res.status(500).json({ success: false, message: 'Failed to save friend info', error: error.message });
    }
  });

  // === PDF GENERATION ===
  app.post('/api/pdf/generate-pdf', async (req, res) => {
    try {
      const { leadName, leadMobile, projects } = req.body;

      if (!projects || !Array.isArray(projects) || projects.length === 0) {
        return res.status(400).json({ success: false, message: 'No projects provided' });
      }

      console.log('PDF Generation requested for', projects.length, 'projects');

      // Fetch full property details from unified_data for each project
      const enrichedProjects: any[] = [];

      if (supabase) {
        for (const project of projects) {
          const reraNumber = project.RERA_Number || project.rera_number;

          if (reraNumber && reraNumber !== 'N/A') {
            const { data: propertyDataArray, error } = await supabase
              .from('unified_data')
              .select('*')
              .eq('rera_number', reraNumber)
              .limit(1);

            if (error) {
              console.log('PDF: Error fetching from unified_data for', reraNumber, error.message);
            }

            const propertyData = propertyDataArray && propertyDataArray.length > 0 ? propertyDataArray[0] : null;

            if (propertyData) {
              console.log('PDF: Found unified_data for', reraNumber, '- Keys:', Object.keys(propertyData).length);
              enrichedProjects.push({ ...project, ...propertyData });
            } else {
              console.log('PDF: No unified_data found for', reraNumber);
              enrichedProjects.push(project);
            }
          } else {
            enrichedProjects.push(project);
          }
        }
      } else {
        console.log('PDF: Supabase not available');
        enrichedProjects.push(...projects);
      }

      // Helper function to fetch image from Supabase Storage
      const fetchImageFromStorage = async (bucket: string, path: string): Promise<Buffer | null> => {
        if (!supabase) return null;
        try {
          const { data, error } = await supabase.storage.from(bucket).download(path);
          if (error || !data) {
            console.log('PDF: Error fetching image from storage:', path, error?.message);
            return null;
          }
          const arrayBuffer = await data.arrayBuffer();
          return Buffer.from(arrayBuffer);
        } catch (err: any) {
          console.log('PDF: Failed to fetch image:', path, err.message);
          return null;
        }
      };

      // Helper function to load local template image
      const loadLocalTemplate = (filename: string): string | null => {
        const templatePath = path.join(process.cwd(), 'public', 'pdf-templates', filename);
        if (fs.existsSync(templatePath)) {
          return templatePath;
        }
        return null;
      };

      // Create PDF document - Landscape for comparison table layout
      const doc = new PDFDocument({
        size: [842, 595], // A4 Landscape
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true
      });

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Lead_${(leadName || 'Report').replace(/\s/g, '_')}_${leadMobile || ''}_${Date.now()}.pdf`);

      // Pipe PDF to response
      doc.pipe(res);

      const pageWidth = 842;
      const pageHeight = 595;

      // Helper function to safely get value
      const getValue = (obj: any, ...keys: string[]): string => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '' && obj[key] !== '---') {
            return String(obj[key]);
          }
          const lowerKey = key.toLowerCase();
          if (obj[lowerKey] !== undefined && obj[lowerKey] !== null && obj[lowerKey] !== '' && obj[lowerKey] !== '---') {
            return String(obj[lowerKey]);
          }
        }
        return 'N/A';
      };

      // Format price for display
      const formatPrice = (value: any): string => {
        if (!value || value === 'N/A' || value === '---') return 'N/A';
        const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        if (isNaN(num)) return String(value);
        if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `${(num / 100000).toFixed(2)} Lac`;
        return num.toLocaleString('en-IN');
      };

      // ==================== SLIDE 1: Cover Page ====================
      const coverImage = await fetchImageFromStorage('property_images', 'images/slide1_cover.png');
      const localCover = loadLocalTemplate('cover_bg.png');

      if (coverImage) {
        doc.image(coverImage, 0, 0, { width: 842, height: 595 });
      } else if (localCover) {
        doc.image(localCover, 0, 0, { width: 842, height: 595 });
      } else {
        doc.rect(0, 0, 842, 595).fill('#ffffff');
        doc.rect(30, 80, 782, 180).fillAndStroke('#3B5998', '#3B5998');
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#3B5998').text('relai.', 720, 30);
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('for right home', 720, 55);
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#00FF00').text('RELAI', 260, 150);
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#ffffff').text(' RIGHT HOME REPORT', 340, 150);
        doc.fontSize(14).font('Helvetica').fillColor('#ffffff').text('www.relai.world', 260, 200);
      }

      // ==================== SLIDE 2: Property Selection ====================
      doc.addPage();

      const selectionImage = await fetchImageFromStorage('property_images', 'images/slide2_selection.png');
      const localSelection = loadLocalTemplate('selection_bg.png');

      if (selectionImage) {
        doc.image(selectionImage, 0, 0, { width: 842, height: 595 });
      } else if (localSelection) {
        doc.image(localSelection, 0, 0, { width: 842, height: 595 });
      } else {
        doc.rect(0, 0, 842, 595).fill('#f5f5f5');
        doc.roundedRect(311, 120, 220, 300, 10).fillAndStroke('#ffffff', '#3B5998');
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#3B5998').text('Selected Properties', 340, 250);
      }

      // ==================== PROPERTY DETAIL SLIDES (3 slides per property) ====================
      const propertyDetailsBg = loadLocalTemplate('property_details_bg.png');
      const propertyDetails2ColBg = loadLocalTemplate('property_details_2col_bg.png');

      // Define all property fields organized by slide
      const slideAFields = [
        { label: 'PROJECT', keys: ['projectname', 'projectName'] },
        { label: 'BUILDER', keys: ['buildername', 'builderName'] },
        { label: 'AREA', keys: ['areaname', 'city', 'projectlocation'] },
        { label: 'RERA', keys: ['rera_number', 'RERA_Number'] },
        { label: 'PROJECT TYPE', keys: ['project_type', 'Project_Type'] },
        { label: 'LAND AREA', keys: ['total_land_area', 'totalLandArea'] },
        { label: 'POSSESSION DATE', keys: ['possession_date', 'possessionDate'] },
      ];

      const slideBFieldsCol1 = [
        { label: 'GRID Score', keys: ['grid_score', 'GRID_Score'] },
        { label: 'Price Range', keys: ['price_range', 'priceRange'] },
        { label: 'Price Per Sq Ft', keys: ['price_per_sft', 'pricePerSft'] },
        { label: 'Size Range', keys: ['size_range', 'sizeRange', 'sqfeet'] },
        { label: 'Configurations', keys: ['configurations', 'config'] },
        { label: 'Number of Towers', keys: ['number_of_towers'] },
        { label: 'Flats Per Floor', keys: ['number_of_flats_per_floor'] },
        { label: 'Launch Date', keys: ['project_launch_date'] },
      ];

      const slideBFieldsCol2 = [
        { label: 'Construction Status', keys: ['construction_status'] },
        { label: 'Open Space', keys: ['open_space'] },
        { label: 'Floor Rise Charges', keys: ['floor_rise_charges'] },
        { label: 'Floor Rise Amount', keys: ['floor_rise_amount_per_floor'] },
        { label: 'Facing Charges', keys: ['facing_charges'] },
        { label: 'PLC Charges', keys: ['preferential_location_charges'] },
        { label: 'Passenger Lifts', keys: ['no_of_passenger_lift'] },
        { label: 'Visitor Parking', keys: ['visitor_parking'] },
      ];

      const slideCFieldsCol1 = [
        { label: 'Car Parking Charges', keys: ['car_parking_charges'] },
        { label: 'Corpus Fund', keys: ['corpus_fund'] },
        { label: 'Maintenance Charges', keys: ['maintenance_charges'] },
        { label: 'Club House Charges', keys: ['club_house_charges'] },
        { label: 'GST', keys: ['gst'] },
        { label: 'Legal Charges', keys: ['legal_charges'] },
        { label: 'Registration Charges', keys: ['registration_charges'] },
        { label: 'Stamp Duty', keys: ['stamp_duty'] },
      ];

      const slideCFieldsCol2 = [
        { label: 'Total Units', keys: ['total_units'] },
        { label: 'Units Sold', keys: ['units_sold'] },
        { label: 'Available Units', keys: ['available_units'] },
        { label: 'Bank Approvals', keys: ['bank_approvals'] },
        { label: 'Amenities', keys: ['external_amenities', 'amenities'] },
        { label: 'Connectivity', keys: ['connectivity'] },
        { label: 'Nearby Schools', keys: ['nearby_schools'] },
        { label: 'Nearby Hospitals', keys: ['nearby_hospitals'] },
      ];

      // Generate slides for each property
      enrichedProjects.forEach((property, propIdx) => {
        // ========== SLIDE A: Property Details (Overview) ==========
        doc.addPage();

        if (propertyDetailsBg) {
          doc.image(propertyDetailsBg, 0, 0, { width: 842, height: 595 });
        } else {
          doc.rect(0, 0, 842, 595).fill('#ffffff');
          doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a365d').text('PROPERTY', 50, 30);
          doc.fontSize(20).font('Helvetica').fillColor('#1a365d').text('DETAILS', 165, 30);
          doc.moveTo(250, 40).lineTo(700, 40).dash(3, { space: 3 }).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica').fillColor('#666666').text('www.relai.world', 720, 30);
          doc.fontSize(24).font('Helvetica-Bold').fillColor('#3B5998').text('r.', 790, 550);
        }

        // Draw property details on left side
        let yPos = 130;
        slideAFields.forEach((field) => {
          let value = getValue(property, ...field.keys);

          // Bullet point
          doc.circle(70, yPos + 6, 4).fill('#3B5998');
          doc.moveTo(74, yPos + 6).lineTo(95, yPos + 6).stroke('#3B5998');

          // Label
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d')
            .text(field.label + ' :', 100, yPos);

          // Value
          doc.fontSize(11).font('Helvetica').fillColor('#333333')
            .text(value.substring(0, 40), 220, yPos, { width: 200 });

          yPos += 45;
        });

        // ========== SLIDE B: Property Details (Two Column) ==========
        doc.addPage();

        if (propertyDetails2ColBg) {
          doc.image(propertyDetails2ColBg, 0, 0, { width: 842, height: 595 });
        } else {
          doc.rect(0, 0, 842, 595).fill('#ffffff');
          doc.roundedRect(30, 30, 782, 500, 8).stroke('#3B5998');
          doc.moveTo(250, 40).lineTo(700, 40).dash(3, { space: 3 }).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica').fillColor('#666666').text('www.relai.world', 720, 30);
          doc.moveTo(421, 80).lineTo(421, 480).stroke('#3B5998');
          doc.circle(421, 80, 5).fill('#3B5998');
          doc.circle(421, 480, 5).fill('#3B5998');
          doc.fontSize(24).font('Helvetica-Bold').fillColor('#3B5998').text('r.', 790, 550);
        }

        // Column 1
        yPos = 100;
        slideBFieldsCol1.forEach((field) => {
          let value = getValue(property, ...field.keys);
          if (field.keys.includes('configurations') && Array.isArray(property.configurations)) {
            value = property.configurations.map((c: any) => c.type || c).slice(0, 3).join(', ') || 'N/A';
          }
          if (field.keys.includes('price_range')) value = formatPrice(value);

          doc.circle(55, yPos + 6, 4).fill('#3B5998');
          doc.moveTo(59, yPos + 6).lineTo(75, yPos + 6).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d').text(field.label + ':', 80, yPos);
          doc.fontSize(10).font('Helvetica').fillColor('#333333').text(value.substring(0, 30), 80, yPos + 15, { width: 320 });
          yPos += 45;
        });

        // Column 2
        yPos = 100;
        slideBFieldsCol2.forEach((field) => {
          let value = getValue(property, ...field.keys);

          doc.circle(455, yPos + 6, 4).fill('#3B5998');
          doc.moveTo(459, yPos + 6).lineTo(475, yPos + 6).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d').text(field.label + ':', 480, yPos);
          doc.fontSize(10).font('Helvetica').fillColor('#333333').text(value.substring(0, 30), 480, yPos + 15, { width: 320 });
          yPos += 45;
        });

        // ========== SLIDE C: Property Details (More Details) ==========
        doc.addPage();

        if (propertyDetails2ColBg) {
          doc.image(propertyDetails2ColBg, 0, 0, { width: 842, height: 595 });
        } else {
          doc.rect(0, 0, 842, 595).fill('#ffffff');
          doc.roundedRect(30, 30, 782, 500, 8).stroke('#3B5998');
          doc.moveTo(250, 40).lineTo(700, 40).dash(3, { space: 3 }).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica').fillColor('#666666').text('www.relai.world', 720, 30);
          doc.moveTo(421, 80).lineTo(421, 480).stroke('#3B5998');
          doc.circle(421, 80, 5).fill('#3B5998');
          doc.circle(421, 480, 5).fill('#3B5998');
          doc.fontSize(24).font('Helvetica-Bold').fillColor('#3B5998').text('r.', 790, 550);
        }

        // Column 1
        yPos = 100;
        slideCFieldsCol1.forEach((field) => {
          let value = getValue(property, ...field.keys);

          doc.circle(55, yPos + 6, 4).fill('#3B5998');
          doc.moveTo(59, yPos + 6).lineTo(75, yPos + 6).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d').text(field.label + ':', 80, yPos);
          doc.fontSize(10).font('Helvetica').fillColor('#333333').text(value.substring(0, 30), 80, yPos + 15, { width: 320 });
          yPos += 45;
        });

        // Column 2
        yPos = 100;
        slideCFieldsCol2.forEach((field) => {
          let value = getValue(property, ...field.keys);
          if (field.keys.includes('external_amenities') && value.length > 50) {
            value = value.substring(0, 47) + '...';
          }

          doc.circle(455, yPos + 6, 4).fill('#3B5998');
          doc.moveTo(459, yPos + 6).lineTo(475, yPos + 6).stroke('#3B5998');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d').text(field.label + ':', 480, yPos);
          doc.fontSize(10).font('Helvetica').fillColor('#333333').text(value.substring(0, 30), 480, yPos + 15, { width: 320 });
          yPos += 45;
        });
      });

      // ==================== COMPARISON CARD SLIDE ====================
      const compareCardsBg = loadLocalTemplate('compare_cards_bg.png');
      doc.addPage();

      if (compareCardsBg) {
        doc.image(compareCardsBg, 0, 0, { width: 842, height: 595 });
      } else {
        doc.rect(0, 0, 842, 595).fill('#ffffff');
        doc.roundedRect(30, 50, 782, 480, 8).stroke('#3B5998');
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a365d').text('COMPARE', 50, 25);
        doc.fontSize(20).font('Helvetica').fillColor('#1a365d').text('PROPERTY', 155, 25);
        doc.moveTo(260, 35).lineTo(700, 35).dash(3, { space: 3 }).stroke('#3B5998');
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('www.relai.world', 720, 25);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#3B5998').text('r.', 790, 550);
      }

      // Draw property cards dynamically based on number of properties
      const numProps = Math.min(enrichedProjects.length, 5);
      const cardWidth = 140;
      const cardHeight = 350;
      const cardSpacing = 20;
      const totalCardsWidth = (cardWidth * numProps) + (cardSpacing * (numProps - 1));
      let cardStartX = (pageWidth - totalCardsWidth) / 2;
      const cardY = 100;

      enrichedProjects.slice(0, 5).forEach((property, idx) => {
        const cardX = cardStartX + (idx * (cardWidth + cardSpacing));

        // White circle at top
        doc.circle(cardX + cardWidth / 2, cardY + 30, 35).fill('#ffffff').stroke('#3B5998');

        // Blue card body
        doc.roundedRect(cardX, cardY + 50, cardWidth, cardHeight - 50, 15).fill('#3B5998');

        // Property name in card
        const projectName = getValue(property, 'projectname', 'projectName');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
          .text(projectName.substring(0, 15), cardX + 10, cardY + 80, { width: cardWidth - 20, align: 'center' });

        // Key metrics in stripes
        const metrics = [
          { label: 'Price', value: formatPrice(getValue(property, 'price_range', 'priceRange')) },
          { label: 'Area', value: getValue(property, 'areaname', 'city').substring(0, 12) },
          { label: 'Type', value: getValue(property, 'project_type', 'Project_Type').substring(0, 12) },
          { label: 'GRID', value: getValue(property, 'grid_score', 'GRID_Score') },
          { label: 'Status', value: getValue(property, 'construction_status').substring(0, 12) },
        ];

        let stripeY = cardY + 120;
        metrics.forEach((metric, mIdx) => {
          const isEvenStripe = mIdx % 2 === 0;
          doc.rect(cardX, stripeY, cardWidth, 40).fill(isEvenStripe ? '#4A69BD' : '#3B5998');
          doc.fontSize(7).font('Helvetica').fillColor('#a0c4ff').text(metric.label, cardX + 10, stripeY + 5, { width: cardWidth - 20 });
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text(metric.value, cardX + 10, stripeY + 18, { width: cardWidth - 20 });
          stripeY += 40;
        });
      });

      // ==================== COMPARISON TABLE SLIDE ====================
      const compareTableBg = loadLocalTemplate('compare_table_bg.png');
      doc.addPage();

      if (compareTableBg) {
        doc.image(compareTableBg, 0, 0, { width: 842, height: 595 });
      } else {
        doc.rect(0, 0, 842, 595).fill('#ffffff');
        doc.roundedRect(30, 50, 782, 480, 8).stroke('#3B5998');
        doc.moveTo(250, 35).lineTo(700, 35).dash(3, { space: 3 }).stroke('#3B5998');
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('www.relai.world', 720, 25);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#3B5998').text('r.', 790, 550);
      }

      // Table setup
      const margin = 50;
      const usableWidth = pageWidth - (margin * 2);
      const numCols = Math.min(enrichedProjects.length, 5);
      const colWidth = usableWidth / numCols;
      const tableY = 100;
      const rowHeight = 40;

      // Header row with property names
      let xPos = margin;
      enrichedProjects.slice(0, 5).forEach((property) => {
        doc.rect(xPos, tableY, colWidth, rowHeight).fillAndStroke('#1a365d', '#ffffff');
        const projectName = getValue(property, 'projectname', 'projectName');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
          .text(projectName.substring(0, 18), xPos + 5, tableY + 12, { width: colWidth - 10, align: 'center' });
        xPos += colWidth;
      });

      // Comparison metrics rows
      const tableMetrics = [
        { label: 'Price Range', keys: ['price_range', 'priceRange'], format: 'price' },
        { label: 'Price/Sq Ft', keys: ['price_per_sft', 'pricePerSft'] },
        { label: 'Size Range', keys: ['size_range', 'sizeRange'] },
        { label: 'GRID Score', keys: ['grid_score', 'GRID_Score'] },
        { label: 'Location', keys: ['areaname', 'city'] },
        { label: 'Possession', keys: ['possession_date', 'possessionDate'] },
        { label: 'Status', keys: ['construction_status'] },
        { label: 'Towers', keys: ['number_of_towers'] },
      ];

      tableMetrics.forEach((metric, rowIdx) => {
        const rowY = tableY + rowHeight + (rowIdx * rowHeight);
        const isEvenRow = rowIdx % 2 === 0;

        xPos = margin;
        enrichedProjects.slice(0, 5).forEach((property) => {
          doc.rect(xPos, rowY, colWidth, rowHeight)
            .fillAndStroke(isEvenRow ? '#c8f7dc' : '#a8f0c8', '#ffffff');

          let value = getValue(property, ...metric.keys);
          if (metric.format === 'price') value = formatPrice(value);

          doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a')
            .text(value.substring(0, 20), xPos + 5, rowY + 12, { width: colWidth - 10, align: 'center' });

          xPos += colWidth;
        });
      });

      // Finalize PDF
      doc.end();

    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  });

  return httpServer;
}
