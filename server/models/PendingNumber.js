const mongoose = require('mongoose');

const PendingNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  submissionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  estimatedDate: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // Default 48 hours
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PendingNumber', PendingNumberSchema);
