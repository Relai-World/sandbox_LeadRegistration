const mongoose = require('mongoose');

const UnVerifiedResidentailschema = new mongoose.Schema({
  RERA_Number:{
    type: String,
    required:true,
    Unique:true
  },
  ProjectName: {
    type: String,
    required: true
  },
  BuilderName:{
    type: String,
    required: true
  },

  BaseProjectPrice:{
    type: Number,
    required: false
  },
  ProjectBrochure:{
    type: String,
    required: false
  },
  PriceSheetLink:{
    type: String,
    required: false
  },
  Contact:{
    type: Number,
    required: false
  },
  ProjectLocation: {
    type: String,
    required: false
  },
  Project_Type: {
    type: String,
    required: true,
    enum: ['Villa', 'Apartment']
  },
  BuildingName: {
    type: String,
    required: false
  },
  CommunityType: {
    type: String,
    required: true,
    enum: [ 'Gated Community','Semi-Gated Community','Standalone']
  },
  Total_land_Area:{
    type: String,
    required: true
  },
  Number_of_Towers:{
    type: Number,
    required: false
  },
  Number_of_Floors:{
    type: Number,
    required: true
  },
  Number_of_Flats_Per_Floor:{
    type: Number,
    required: false
  },
  Total_Number_of_Units:{
    type: Number,
    required: true
  },
  Project_Launch_Date:{
    type: Date,
    required: false
  },
  Possession_Date:{
    type: Date,
    required: false
  },
  Construction_Status: {
    type: String,
    required: true,
    enum: [ 'Not Started','Ongoing','Ready to Move in']
  },
  Open_Space:{
    type: Number,
    required: true
  },
  Carpet_area_Percentage:{
    type: Number,
    required: false
  },
  Floor_to_Ceiling_Height:{
    type: Number,
    required: true
  },

  Price_per_sft:{
    type: Number,
    required: true
  },
  External_Amenities:{
    type: String,
    enum:['Clubhouse','Gym', 'Swimming Pool', 'Kids Play Area', 'Banquet Hall','Guest Rooms','Co working Space', 'Jogging Track', 'Sports Facilities']
  },
  Specification:{
    type: String,
    required: false
  },
  PowerBackup: {
    type: String,
    required: true,
    enum: [ 'Full','Partial','None']
  },
  No_of_Passenger_lift:{
    type: Number,
    required: true
  },
  No_of_Service_lift:{
    type: Number,
    required: true
  },
  Visitor_Parking:{
    type: String,
    required: true,
    enum: ['yes','no']
  },
  Ground_vehicle_Movement:{
    type: String,
    required: true,
    enum: ['yes', 'no', 'partial']
  },
  configurations: [
    {
      type: {
        type: String,
        enum: ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', '6 BHK', 'Commercial', 'Plotting'],
        required: true
      },
      sizeRange: {
       type: Number,
       required: false
      },
      sizeUnit: {
        type: String,
        required: false,
        enum: ['Sq ft', 'Sq Yd'],
        default: 'Sq ft'
      },
      sizeSqFt: {
        type: Number,
        required: false
      },
      sizeSqYd: {
        type: Number,
        required: false
      },
      No_of_car_Parking: {
        type: Number,
        required: true
      },
      facing: {
        type: String,
        required: false,
        enum: ['North', 'East', 'West', 'South', 'North-East', 'North-West', 'South-East', 'South-West']
      }
    },
  ],
  Amount_For_Extra_Car_Parking:{
    type: Number,
    required: false
  },
  Home_loan:{
    type: String,
    enum: ['ICICI','Axis','SBI','UBI', 'HDFC', 'Kotak Mahindra']
  },
  previous_complaints_on_builder: {
    type: String,
    enum: ['yes', 'no'],
    required: false,
  },
  complaint_details: {
    type: String,
    required: function () {
      return this.previous_complaints_on_builder === 'yes';
    }
  },
  Construction_Material:{
    type: String,
    enum: ['Red Bricks', 'Cement Bricks', 'Concrete'],
    required: true
  },
  Commission_percentage:{
    type: Number,
    required:false
  },
  What_is_there_Price:{
    type: Number,
    required:false
  },
  What_is_relai_price:{
    type: Number,
    required:false
  },
  After_agreement_of_sale_what_is_payout_time_period:{
    type: Number,
    required:false
  },
  Is_lead_Registration_required_before_Site_visit:{
    type: String,
    enum:['yes','no']
  },
  Turnaround_Time_for_Lead_Acknowledgement:{
    type: Number,
    required: true
  },
  Is_there_validity_period_for_registered_lead:{
    type: String,
    enum: ['yes', 'no'],
    required: true,
  },
  validity_period_value: {
    type: Number,
    required: false
  },
  person_to_confirm_registration: {
    name: {
      type: String,
      required: true
    },
    contact: {
      type: Number,
      required: true
    }
  },
  Notes_Comments_on_lead_registration_workflow:{
    type: String,
    required: false
  },
  Accepted_Modes_of_Lead_Registration:{
    WhatsApp:{
        enabled: {
          type: String,
          required: false
        },
        details: {
          type: String,
          required: false
        }
      },
    Email:{
        enabled: {
          type: String,
          required: false
        },
        details: {
          type: String,
          required: false
        }
      },
    Web_Form:{
        enabled: {
          type: String,
          required: false
        },
        details: {
          type: String,
          required: false
        }
      },
    CRM_App_Access:{
        enabled: {
          type: String,
          required: false
        },
        details: {
          type: String,
          required: false
        }
      },
    During_Site_Visit:{
        type: String,
        required: false
      }
  },
  status:{
    type: String,
    required: true,
    default: 'Unverified',
    enum: ['Unverified', 'Verified']
  },
  UserEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  POC_Name:{
    type: String,
    required: true
  },
  POC_Contact:{
    type: Number,
    required: true
  },
  POC_Role:{
    type: String,
    required: true
  },
  POC_CP:{
    type: Boolean,
    required: false,
    default: false
  }

}, { collection: 'UnVerifiedResidentialData', timestamps: true }  );

// Pre-save middleware to update the updatedAt field
UnVerifiedResidentailschema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UnVerifiedResidential = mongoose.model('UnVerifiedResidentialData', UnVerifiedResidentailschema);
module.exports = UnVerifiedResidential;

