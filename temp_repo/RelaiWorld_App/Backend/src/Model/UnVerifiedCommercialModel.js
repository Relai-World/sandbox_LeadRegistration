const mongoose = require('mongoose');

const UnVerifiedCommercialSchema = new mongoose.Schema({
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
      ProjectType:{
        type: String,
        enum: ['']
      },
      LaunchDate:{
        type: Date,
        required: true
      },
      HandoverDate:{
        type: Date,
        required: true
      },
      Area:{
        type: String,
        required: true
      },
      Zone:{
        type: String,
        required: true
      },
    })


module.exports = mongoose.model('UnVerifiedCommercialData', UnVerifiedCommercialSchema);


