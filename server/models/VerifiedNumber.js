const mongoose = require('mongoose');

const VerifiedNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  verifiedDate: {
    type: Date,
    default: Date.now
  },
  batchId: {
    type: String,
    default: null,
    index: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'verified',
    enum: ['verified']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VerifiedNumber', VerifiedNumberSchema);
