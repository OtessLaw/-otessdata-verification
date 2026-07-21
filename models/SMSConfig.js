const mongoose = require('mongoose');

const SMSConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['arkesel', 'mnotify', 'hubtel', 'custom'],
    default: 'arkesel'
  },
  apiKey: {
    type: String,
    default: ''
  },
  senderId: {
    type: String,
    default: 'OTESS'
  },
  apiUrl: {
    type: String,
    default: 'https://api.arkesel.com/v2/sms/send'
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SMSConfig', SMSConfigSchema);
