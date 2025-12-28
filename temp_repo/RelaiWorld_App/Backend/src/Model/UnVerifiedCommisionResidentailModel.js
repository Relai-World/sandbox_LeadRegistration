const mongoose = require('mongoose');

const UnVerifiedCommisionResidentailschema = new mongoose.Schema({
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
  Contact:{
    type: Number,
    required: true
  },
  Commision_percentage:{
    type: Number,
    required:true
  },
  What_is_there_Price:{
    type: Number,
    required:true
  },
  What_is_relai_price:{
    type: Number,
    required:true
  },
  After_agreement_of_sale_what_is_payout_time_period:{
    type: Number,
    required:true
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
    type: Number,
    enum: ['yes', 'no'],
    required: true,
  },
  validity_period_value: {
    type: Number,
    required: function () {
      return this.is_there_validity_period_for_registered_lead === 'yes';
    }
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
    required: true
  },
  Accepted_Modes_of_Lead_Registration:{
    WhatsApp:{
        type: String,
        required: true
      },
    Email:{
        type: String,
        required: true
      },
    Web_Form:{
        type: String,
        required: true
      },
    CRM_App_Access:{
        type: String,
        required: true
      },
    Physical_Register_Along_With_Lead:{
        type: String,
        required: true
      },
    Others:{
        type: String,
        required: true
      }  
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
  POC:{
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
  }
});

module.exports = mongoose.model('UnVerifiedCommisionResidentialData',UnVerifiedCommisionResidentailschema);
