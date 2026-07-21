const mongoose = require('mongoose');

const PendingNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerNumber: {
    type: String,
    trim: true,
    index: true
  },
  agentNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date,
    default: null
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
  smsSent: {
    type: Boolean,
    default: false
  },
  smsLogs: [{
    type: { type: String }, // 'SUBMISSION' | 'APPROVAL' | 'REJECTION' | 'RESEND'
    message: String,
    sentAt: { type: Date, default: Date.now },
    status: String, // 'SUCCESS' | 'FAILED'
    error: String
  }],
  estimatedDate: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Sync customerNumber field before save if not explicitly provided
PendingNumberSchema.pre('save', function (next) {
  if (!this.customerNumber && this.phoneNumber) {
    this.customerNumber = this.phoneNumber;
  }
  if (!this.phoneNumber && this.customerNumber) {
    this.phoneNumber = this.customerNumber;
  }
  if (!this.submittedAt && this.submittedDate) {
    this.submittedAt = this.submittedDate;
  }
  next();
});

module.exports = mongoose.model('PendingNumber', PendingNumberSchema);
