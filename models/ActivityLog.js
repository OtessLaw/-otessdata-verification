const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  admin: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
