const express = require('express');
const router = express.Router();
const UnVerifiedResidential = require('../Model/UnVerifiedResidentialModel'); // Update path as needed
const VerifiedResidential = require('../Model/VerifiedResidentialModel'); // Update path as needed
const supabase = require('../../superbase.js');

// const ShortForm = async (req, res) => {
//     try {
//         const {
//           RERA_Number,
//           ProjectName,
//           BuilderName,
//           BuildingType,
//           Numbger_of_Floors,
//           Number_of_Flats_Per_Floor,
//           Possession_Date,
//           Open_Space,
//           Carpet_area_Percentage,
//           Floor_to_Ceiling_Height,
//           PowerBackip,
//           Ground_vehicle_Movement,
//           Commision_percentage,
//           Price_per_sft,
//           After_agreement_of_sale_what_is_payout_time_period,
//           Amount_For_Extra_Car_Parking,
//           configurations,
//           POC_Name,
//           POC_Contact,
//           POC_Role,
//           UserEmail
//         } = req.body;

//         // 🔐 Check for required fields
//         if (
//           !RERA_Number || !ProjectName || !BuilderName || !BuildingType ||
//           !Numbger_of_Floors || !Number_of_Flats_Per_Floor || !Possession_Date ||
//           Open_Space == undefined || Carpet_area_Percentage == undefined || Floor_to_Ceiling_Height == undefined ||
//           !PowerBackip || !Ground_vehicle_Movement || Commision_percentage == undefined ||
//           Price_per_sft == undefined || 
//           After_agreement_of_sale_what_is_payout_time_period == undefined || Amount_For_Extra_Car_Parking == undefined ||
//           !configurations || !Array.isArray(configurations) || configurations.length === 0 ||
//           !UserEmail || !POC_Name || !POC_Contact || !POC_Role
//         ) {
//           return res.status(400).json({ message: "Missing required fields or invalid configuration data" });
//         }

//         // 🔍 Check for existing project
//         const existingProject = await UnVerifiedResidential.findOne({ RERA_Number });
//         if (existingProject) {
//           return res.status(409).json({ message: "Project with this RERA_Number already exists." });
//         }

//         // Calculate Total_Number_of_Units based on floors and flats per floor
//         const Total_Number_of_Units = Numbger_of_Floors * Number_of_Flats_Per_Floor;


//         // 🧮 Calculate BaseProjectPrice dynamically
//         let calculatedBasePrice = 0;
//         if (Array.isArray(configurations)) {
//           for (const config of configurations) {
//             if (config.sizeRange && !isNaN(config.sizeRange)) {
//               calculatedBasePrice += Price_per_sft * Number(config.sizeRange);
//             }
//           }
//         }

//         const newShortForm = new UnVerifiedResidential({
//           RERA_Number,
//           ProjectName,
//           BuilderName,
//           BuildingType,
//           CommunityType: 'Gated Community',
//           Total_land_Area: 'Not specified',
//           Number_of_Towers: 1,
//           Numbger_of_Floors,
//           Number_of_Flats_Per_Floor,
//           Total_Number_of_Units,
//           Possession_Date,
//           Construction_Status: 'Ongoing',
//           Open_Space,
//           Carpet_area_Percentage,
//           Floor_to_Ceiling_Height,
//           Price_per_sft,
//           PowerBackip,
//           No_of_Passenger_lift: 1,
//           No_of_Service_lift: 1,
//           Visitor_Parking: 'yes',
//           Ground_vehicle_Movement,
//           configurations,
//           Amount_For_Extra_Car_Parking,
//           Construction_Material: 'Concrete',
//           Commision_percentage,
//           BaseProjectPrice: calculatedBasePrice,
//           After_agreement_of_sale_what_is_payout_time_period,
//           Turnaround_Time_for_Lead_Acknowledgement: 24,
//           Is_there_validity_period_for_registered_lead: 'no',
//           person_to_confirm_registration: {
//             name: 'Not specified',
//             contact: 0
//           },
//           Accepted_Modes_of_Lead_Registration: {
//             WhatsApp: 'Not specified',
//             Email: 'Not specified',
//             Web_Form: 'Not specified',
//             CRM_App_Access: 'Not specified',
//             Physical_Register_Along_With_Lead: 'Not specified',
//             Others: 'Not specified'
//           },
//           status: "Unverified",
//           UserEmail,
//           POC_Name,
//           POC_Contact,
//           POC_Role,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         });

//         await newShortForm.save();
//         res.status(201).json({ message: "Short form project saved successfully", data: newShortForm });

//       } catch (error) {
//         console.error("Error saving short form project:", error);
//         res.status(500).json({ message: "Internal server error", error: error.message });
//       }
//     };

const ShortForm = async (req, res) => {
  const {
    // Frontend is sending snake_case field names, so we'll use those directly
    ProjectName,
    BuilderName,
    RERA_Number,
    Project_Type,
    Number_of_Floors,
    Number_of_Flats_Per_Floor,
    Possession_Date,
    Open_Space,
    Carpet_area_Percentage,
    Floor_to_Ceiling_Height,
    Ground_vehicle_Movement,
    Wow_Factor_Amenity,
    Amount_For_Extra_Car_Parking,
    PowerBackup,
    Commission_percentage,
    After_agreement_of_sale_what_is_payout_time_period,
    configurations = [],
    POC_Name,
    POC_Contact,
    POC_Role,
    UserEmail,
    BaseProjectPrice,
    CommunityType,
    Total_land_Area,
    Number_of_Towers,
    Total_Number_of_Units,
    Construction_Status,
    Price_per_sft,
    No_of_Passenger_lift,
    No_of_Service_lift,
    Visitor_Parking,
    Construction_Material,
    Turnaround_Time_for_Lead_Acknowledgement,
    Is_there_validity_period_for_registered_lead,
    validity_period_value,
    person_to_confirm_registration,
    Accepted_Modes_of_Lead_Registration,
    Is_lead_Registration_required_before_Site_visit,
    Project_Launch_Date
  } = req.body;

  try {
    // Validate that we have a user email
    if (!UserEmail) {
      return res.status(400).json({
        success: false,
        message: 'UserEmail is required. Please ensure you are properly authenticated.',
        error: 'Missing UserEmail field'
      });
    }

    const newProject = new UnVerifiedResidential({
      // Map all the fields directly from the request body
      ProjectName,
      BuilderName,
      RERA_Number,
      Project_Type,
      Number_of_Floors,
      Number_of_Flats_Per_Floor,
      Possession_Date: Possession_Date || null,
      Open_Space,
      Carpet_area_Percentage,
      Floor_to_Ceiling_Height,
      Ground_vehicle_Movement,
      Specification: Wow_Factor_Amenity,
      Amount_For_Extra_Car_Parking,
      PowerBackup,
      Commission_percentage,
      After_agreement_of_sale_what_is_payout_time_period,
      POC_Name,
      POC_Contact,
      POC_Role,
      UserEmail,

      // Handle configurations array
      configurations: configurations.map(config => ({
        type: config.type,
        sizeRange: config.sizeRange,
        sizeUnit: config.sizeUnit || 'Sq ft',
        sizeSqFt: config.sizeSqFt,
        sizeSqYd: config.sizeSqYd,
        No_of_car_Parking: config.No_of_car_Parking,
        facing: config.facing
      })),

      // Set default values for required fields that might not be provided
      BaseProjectPrice: BaseProjectPrice || 0,
      CommunityType: CommunityType || 'Gated Community',
      Total_land_Area: Total_land_Area || 'Not specified',
      Number_of_Towers: Number_of_Towers || 1,
      Total_Number_of_Units: Total_Number_of_Units || (Number_of_Floors * Number_of_Flats_Per_Floor),
      Construction_Status: Construction_Status || 'Ongoing',
      Price_per_sft: Price_per_sft || 0,
      No_of_Passenger_lift: No_of_Passenger_lift || 1,
      No_of_Service_lift: No_of_Service_lift || 1,
      Visitor_Parking: Visitor_Parking || 'yes',
      Construction_Material: Construction_Material || 'Concrete',
      Turnaround_Time_for_Lead_Acknowledgement: Turnaround_Time_for_Lead_Acknowledgement || 24,
      Is_there_validity_period_for_registered_lead: Is_there_validity_period_for_registered_lead || 'no',
      validity_period_value: validity_period_value || undefined,
      Project_Launch_Date: Project_Launch_Date || null,
      Is_lead_Registration_required_before_Site_visit: Is_lead_Registration_required_before_Site_visit || undefined,

      // Use actual values from request or fallback to defaults
      person_to_confirm_registration: person_to_confirm_registration || {
        name: POC_Name || 'Not specified',
        contact: POC_Contact || 0
      },
      Accepted_Modes_of_Lead_Registration: Accepted_Modes_of_Lead_Registration || {
        WhatsApp: {
          enabled: 'no',
          details: ''
        },
        Email: {
          enabled: 'no',
          details: ''
        },
        Web_Form: {
          enabled: 'no',
          details: ''
        },
        CRM_App_Access: {
          enabled: 'no',
          details: ''
        },
        During_Site_Visit: 'no'
      },

      status: 'Unverified',
    });

    const savedProject = await newProject.save();

    res.status(201).json({
      success: true,
      message: 'Unverified project created successfully.',
      data: savedProject,
    });

  } catch (error) {
    console.error('Error creating project:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A project with this RERA Number already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: error.message // Also good to send the error message in dev
    });
  }
};

const VerifyProject = async (req, res) => {
  const { reraNumber } = req.params;
  const data = req.body;
  const { action = 'update' } = req.query; // 'update' for editing, 'verify' for moving to verified

  try {
    // 1. Find from Unverified collection
    const unverifiedProject = await UnVerifiedResidential.findOne({ RERA_Number: reraNumber });
    if (!unverifiedProject) {
      return res.status(404).json({ message: 'Unverified project not found' });
    }

    if (action === 'verify') {
      // Original verification logic - move to verified collection
      // 2. Prepare data for verified schema
      const verifiedData = {
        RERA_Number: reraNumber,
        ProjectName: data.ProjectName || unverifiedProject.ProjectName,
        BuilderName: data.BuilderName || unverifiedProject.BuilderName,
        Project_Type: data.Project_Type || unverifiedProject.Project_Type,
        CommunityType: data.CommunityType || unverifiedProject.CommunityType || 'Gated Community',
        Total_land_Area: data.Total_land_Area || unverifiedProject.Total_land_Area || 'Not specified',
        Number_of_Towers: data.Number_of_Towers || unverifiedProject.Number_of_Towers || 1,
        Number_of_Floors: data.Number_of_Floors || unverifiedProject.Number_of_Floors,
        Number_of_Flats_Per_Floor: data.Number_of_Flats_Per_Floor || unverifiedProject.Number_of_Flats_Per_Floor,
        Total_Number_of_Units: data.Total_Number_of_Units || unverifiedProject.Total_Number_of_Units,
        Possession_Date: data.Possession_Date || unverifiedProject.Possession_Date,
        Construction_Status: data.Construction_Status || unverifiedProject.Construction_Status || 'Ongoing',
        Open_Space: data.Open_Space || unverifiedProject.Open_Space,
        BaseProjectPrice: data.BaseProjectPrice || unverifiedProject.BaseProjectPrice,
        Carpet_area_Percentage: data.Carpet_area_Percentage || unverifiedProject.Carpet_area_Percentage,
        Floor_to_Ceiling_Height: data.Floor_to_Ceiling_Height || unverifiedProject.Floor_to_Ceiling_Height,
        Price_per_sft: data.Price_per_sft || unverifiedProject.Price_per_sft || unverifiedProject.What_is_there_Price,
        PowerBackup: data.PowerBackup || data.PowerBackip || unverifiedProject.PowerBackup || unverifiedProject.PowerBackip || 'Full',
        No_of_Passenger_lift: data.No_of_Passenger_lift || unverifiedProject.No_of_Passenger_lift || 1,
        No_of_Service_lift: data.No_of_Service_lift || unverifiedProject.No_of_Service_lift || 1,
        Visitor_Parking: data.Visitor_Parking || unverifiedProject.Visitor_Parking || 'yes',
        Ground_vehicle_Movement: data.Ground_vehicle_Movement || unverifiedProject.Ground_vehicle_Movement,
        configurations: data.configurations || unverifiedProject.configurations,
        Amount_For_Extra_Car_Parking: data.Amount_For_Extra_Car_Parking || unverifiedProject.Amount_For_Extra_Car_Parking,
        Construction_Material: data.Construction_Material || unverifiedProject.Construction_Material || 'Concrete',
        Commission_percentage: data.Commission_percentage || unverifiedProject.Commission_percentage,
        What_is_there_Price: data.What_is_there_Price || unverifiedProject.What_is_there_Price,
        What_is_relai_price: data.What_is_relai_price || unverifiedProject.What_is_relai_price,
        After_agreement_of_sale_what_is_payout_time_period: data.After_agreement_of_sale_what_is_payout_time_period || unverifiedProject.After_agreement_of_sale_what_is_payout_time_period,
        Turnaround_Time_for_Lead_Acknowledgement: data.Turnaround_Time_for_Lead_Acknowledgement || unverifiedProject.Turnaround_Time_for_Lead_Acknowledgement || 24,
        Is_there_validity_period_for_registered_lead: data.Is_there_validity_period_for_registered_lead || unverifiedProject.Is_there_validity_period_for_registered_lead || 'no',
        validity_period_value: data.validity_period_value || unverifiedProject.validity_period_value,
        person_to_confirm_registration: {
          name: data.person_to_confirm_registration?.name || unverifiedProject.person_to_confirm_registration?.name || 'Not specified',
          contact: data.person_to_confirm_registration?.contact || unverifiedProject.person_to_confirm_registration?.contact || 0,
        },
        Accepted_Modes_of_Lead_Registration: {
          WhatsApp: {
            enabled: (data.Accepted_Modes_of_Lead_Registration?.WhatsApp?.enabled || unverifiedProject.Accepted_Modes_of_Lead_Registration?.WhatsApp?.enabled || 'no').toString(),
            details: (data.Accepted_Modes_of_Lead_Registration?.WhatsApp?.details || unverifiedProject.Accepted_Modes_of_Lead_Registration?.WhatsApp?.details || '').toString()
          },
          Email: {
            enabled: (data.Accepted_Modes_of_Lead_Registration?.Email?.enabled || unverifiedProject.Accepted_Modes_of_Lead_Registration?.Email?.enabled || 'no').toString(),
            details: (data.Accepted_Modes_of_Lead_Registration?.Email?.details || unverifiedProject.Accepted_Modes_of_Lead_Registration?.Email?.details || '').toString()
          },
          Web_Form: {
            enabled: (data.Accepted_Modes_of_Lead_Registration?.Web_Form?.enabled || unverifiedProject.Accepted_Modes_of_Lead_Registration?.Web_Form?.enabled || 'no').toString(),
            details: (data.Accepted_Modes_of_Lead_Registration?.Web_Form?.details || unverifiedProject.Accepted_Modes_of_Lead_Registration?.Web_Form?.details || '').toString()
          },
          CRM_App_Access: {
            enabled: (data.Accepted_Modes_of_Lead_Registration?.CRM_App_Access?.enabled || unverifiedProject.Accepted_Modes_of_Lead_Registration?.CRM_App_Access?.enabled || 'no').toString(),
            details: (data.Accepted_Modes_of_Lead_Registration?.CRM_App_Access?.details || unverifiedProject.Accepted_Modes_of_Lead_Registration?.CRM_App_Access?.details || '').toString()
          },
          During_Site_Visit: (data.Accepted_Modes_of_Lead_Registration?.During_Site_Visit || unverifiedProject.Accepted_Modes_of_Lead_Registration?.During_Site_Visit || 'no').toString()
        },
        ProjectBrochure: data.ProjectBrochure || unverifiedProject.ProjectBrochure,
        Contact: data.Contact || unverifiedProject.Contact,
        ProjectLocation: data.ProjectLocation || unverifiedProject.ProjectLocation,
        BuildingName: data.BuildingName || unverifiedProject.BuildingName,
        Project_Launch_Date: data.Project_Launch_Date || unverifiedProject.Project_Launch_Date,
        External_Amenities: data.External_Amenities || unverifiedProject.External_Amenities,
        Specification: data.Specification || unverifiedProject.Specification,
        Home_loan: data.Home_loan || unverifiedProject.Home_loan,
        previous_complaints_on_builder: data.previous_complaints_on_builder || unverifiedProject.previous_complaints_on_builder,
        complaint_details: data.complaint_details || unverifiedProject.complaint_details,
        Is_lead_Registration_required_before_Site_visit: data.Is_lead_Registration_required_before_Site_visit || unverifiedProject.Is_lead_Registration_required_before_Site_visit,
        Notes_Comments_on_lead_registration_workflow: data.Notes_Comments_on_lead_registration_workflow || unverifiedProject.Notes_Comments_on_lead_registration_workflow,
        UserEmail: data.UserEmail || unverifiedProject.UserEmail,
        POC_Name: data.POC_Name || unverifiedProject.POC_Name,
        POC_Contact: data.POC_Contact || unverifiedProject.POC_Contact,
        POC_Role: data.POC_Role || unverifiedProject.POC_Role,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 3. Save to MongoDB (Verified)
      const newVerified = new VerifiedResidential(verifiedData);

      try {
        await newVerified.validate();
      } catch (validationError) {
        console.error('Validation error details:', validationError);
        return res.status(400).json({
          message: 'Validation failed',
          error: validationError.message,
          details: validationError.errors
        });
      }

      await newVerified.save();

      // 4. Send to Supabase
      const { error: supabaseError } = await supabase
        .from('onboarded_data')
        .insert([{
          rera_number: newVerified.RERA_Number,
          project_name: newVerified.ProjectName,
          base_project_price: newVerified.BaseProjectPrice,
          builder_name: newVerified.BuilderName,
          building_type: newVerified.Project_Type,
          community_type: newVerified.CommunityType,
          total_land_area: newVerified.Total_land_Area,
          number_of_towers: newVerified.Number_of_Towers,
          number_of_floors: newVerified.Number_of_Floors,
          number_of_flats_per_floor: newVerified.Number_of_Flats_Per_Floor,
          total_number_of_units: newVerified.Total_Number_of_Units,
          possession_date: newVerified.Possession_Date,
          construction_status: newVerified.Construction_Status,
          open_space: newVerified.Open_Space,
          carpet_area_percentage: newVerified.Carpet_area_Percentage,
          floor_to_ceiling_height: newVerified.Floor_to_Ceiling_Height,
          price_per_sft: newVerified.Price_per_sft,
          power_backup: newVerified.PowerBackup,
          no_of_passenger_lift: newVerified.No_of_Passenger_lift,
          no_of_service_lift: newVerified.No_of_Service_lift,
          visitor_parking: newVerified.Visitor_Parking,
          ground_vehicle_movement: newVerified.Ground_vehicle_Movement,
          configurations: newVerified.configurations,
          amount_for_extra_car_parking: newVerified.Amount_For_Extra_Car_Parking,
          construction_material: newVerified.Construction_Material,
          commission_percentage: newVerified.Commission_percentage,
          after_agreement_of_sale_what_is_payout_time_period: newVerified.After_agreement_of_sale_what_is_payout_time_period,
          turnaround_time_for_lead_acknowledgement: newVerified.Turnaround_Time_for_Lead_Acknowledgement,
          is_there_validity_period_for_registered_lead: newVerified.Is_there_validity_period_for_registered_lead,
          person_to_confirm_registration: newVerified.person_to_confirm_registration,
          accepted_modes_of_lead_registration: newVerified.Accepted_Modes_of_Lead_Registration,
          project_brochure: newVerified.ProjectBrochure,
          contact: newVerified.Contact,
          project_location: newVerified.ProjectLocation,
          building_name: newVerified.BuildingName,
          project_launch_date: newVerified.Project_Launch_Date,
          external_amenities: newVerified.External_Amenities,
          specification: newVerified.Specification,
          home_loan: newVerified.Home_loan,
          previous_complaints_on_builder: newVerified.previous_complaints_on_builder,
          complaint_details: newVerified.complaint_details,
          is_lead_registration_required_before_site_visit: newVerified.Is_lead_Registration_required_before_Site_visit,
          validity_period_value: newVerified.validity_period_value,
          notes_comments_on_lead_registration_workflow: newVerified.Notes_Comments_on_lead_registration_workflow,
          user_email: newVerified.UserEmail,
          poc_name: newVerified.POC_Name,
          poc_contact: newVerified.POC_Contact,
          poc_role: newVerified.POC_Role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (supabaseError) {
        console.error('Supabase insert error:', supabaseError);
      }

      // 5. Delete from Unverified
      await UnVerifiedResidential.deleteOne({ RERA_Number: reraNumber });

      res.status(200).json({ message: 'Project verified and saved successfully.', data: newVerified });
    } else {
      // Update existing data in unverified collection
      const updateData = {
        ...unverifiedProject.toObject(),
        ...data,
        updatedAt: new Date()
      };

      // Remove _id and __v to avoid conflicts
      delete updateData._id;
      delete updateData.__v;

      // Update the document
      const updatedProject = await UnVerifiedResidential.findOneAndUpdate(
        { RERA_Number: reraNumber },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProject) {
        return res.status(404).json({ message: 'Failed to update project' });
      }

      res.status(200).json({
        message: 'Project updated successfully.',
        data: updatedProject,
        action: 'updated'
      });
    }

  } catch (error) {
    console.error("Error processing project:", error);
    res.status(400).json({ message: 'Validation or save failed', error: error.message });
  }
};


const DraftsDataByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const projects = await UnVerifiedResidential.find({ UserEmail: email });

    if (projects.length === 0) {
      return res.status(404).json({ message: 'No projects found for this email.' });
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const DraftDataById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await UnVerifiedResidential.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Draft not found.' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching draft by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  ShortForm,
  VerifyProject,
  DraftsDataByEmail,
  DraftDataById
};
