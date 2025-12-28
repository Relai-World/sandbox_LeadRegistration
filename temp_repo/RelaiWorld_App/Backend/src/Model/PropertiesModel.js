const mongoose = require('mongoose');

const PropertiesSchema = new mongoose.Schema({
  ProjectName: {
    type: String,
    required: false
  },
  BuilderName: {
    type: String,
    required: false
  },
  RERA_Number: {
    type: String,
    required: false
  }
}, { collection: 'properties', strict: false });

module.exports = mongoose.model('Properties', PropertiesSchema);
