const mongoose = require('mongoose');

const WaterDataSchema = new mongoose.Schema({
  District: {
    type: String,
    required: true,
  },
  Mandal: {
    type: String,
    required: true,
  },
  Approx_Sample_Exceeding_Safe_Limits: {
    type: Number,
    required: true
  },
  Notes: {
    type: String,
    required: true
  },
  Net_availability_for_future_use:{
    type: Number,
    required:true
  },
  Watershed:{
    type: String,
    required: true
  },
  Annual_GW_Recharge:{
    type: Number,
    required: true
  },
  Annual_Extractable_GW_Resource:{
    type: Number,
    required: true
  },
  GW_Extraction_For_All_Users:{
    type: Number,
    required: true
  },
  Stage_Of_GW_Extraction:{
    type: Number,
    required: true
  }
});


module.exports = mongoose.model('WaterData', WaterDataSchema);