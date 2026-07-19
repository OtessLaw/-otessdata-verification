const mongoose = require('mongoose');

const UploadBatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  total: {
    type: Number,
    required: true
  },
  added: {
    type: Number,
    required: true
  },
  duplicates: {
    type: Number,
    default: 0
  },
  invalid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'rolled_back'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UploadBatch', UploadBatchSchema);
