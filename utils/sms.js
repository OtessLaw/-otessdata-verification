const axios = require('axios');
const SMSConfig = require('../models/SMSConfig');
const { normalizePhoneNumber } = require('./normalize');

/**
 * Retrieves active SMS Configuration (from DB or process.env fallback)
 */
const getSMSConfig = async () => {
  try {
    let config = await SMSConfig.findOne();
    if (!config) {
      config = {
        provider: process.env.SMS_PROVIDER || 'arkesel',
        apiKey: process.env.SMS_API_KEY || process.env.ARKESEL_API_KEY || '',
        senderId: process.env.SMS_SENDER_ID || 'OTESS',
        apiUrl: process.env.SMS_API_URL || 'https://sms.arkesel.com/api/v2/sms/send',
        isEnabled: true
      };
    }
    return config;
  } catch (err) {
    return {
      provider: 'arkesel',
      apiKey: process.env.SMS_API_KEY || '',
      senderId: process.env.SMS_SENDER_ID || 'OTESS',
      apiUrl: 'https://sms.arkesel.com/api/v2/sms/send',
      isEnabled: true
    };
  }
};

/**
 * Sends SMS via Arkesel (with automatic domain failover) or mNotify / Hubtel.
 */
const sendSMS = async (toPhone, message) => {
  const { isValid, normalized } = normalizePhoneNumber(toPhone);
  if (!isValid) {
    console.error(`[SMS Error] Invalid recipient phone number: ${toPhone}`);
    return { success: false, error: 'Invalid phone number format' };
  }

  const config = await getSMSConfig();
  
  if (!config.isEnabled) {
    console.log(`[SMS Disabled] SMS gateway is disabled in settings.`);
    return { success: false, error: 'SMS Gateway is disabled in settings' };
  }

  // Format phone number for Ghana (e.g. 233241234567 or 0241234567)
  let formattedPhone = normalized.replace('+', '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '233' + formattedPhone.slice(1);
  }

  console.log(`[SMS Attempt] To: ${formattedPhone} | Provider: ${config.provider} | Sender: ${config.senderId}`);
  console.log(`[SMS Content]: "${message}"`);

  if (!config.apiKey) {
    console.log(`[SMS Mock Mode] No API Key provided for ${config.provider}. Simulating delivery to ${formattedPhone}.`);
    return { success: true, mock: true, messageId: `MOCK-SMS-${Date.now()}` };
  }

  const provider = (config.provider || 'arkesel').toLowerCase();

  if (provider === 'arkesel') {
    // 1. Try Arkesel V2 API first (sms.arkesel.com/api/v2/sms/send)
    try {
      const primaryUrl = config.apiUrl && config.apiUrl.includes('arkesel') 
        ? config.apiUrl 
        : 'https://sms.arkesel.com/api/v2/sms/send';

      console.log(`[Arkesel V2 Request] URL: ${primaryUrl}`);
      const response = await axios.post(primaryUrl, {
        sender: config.senderId || 'OTESS',
        recipients: [formattedPhone],
        message: message
      }, {
        headers: {
          'api-key': config.apiKey.trim(),
          'Content-Type': 'application/json'
        },
        timeout: 12000
      });

      console.log(`[Arkesel V2 Success Response]:`, response.data);
      return { success: true, data: response.data };
    } catch (v2Err) {
      console.warn(`[Arkesel V2 Attempt Failed]: ${v2Err.message}. Trying Arkesel V1 Gateway...`);

      // 2. Fallback to Arkesel V1 API endpoint (sms.arkesel.com/sms/api)
      try {
        const v1Url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${encodeURIComponent(config.apiKey.trim())}&to=${encodeURIComponent(formattedPhone)}&from=${encodeURIComponent(config.senderId || 'OTESS')}&sms=${encodeURIComponent(message)}`;
        
        const responseV1 = await axios.get(v1Url, { timeout: 12000 });
        console.log(`[Arkesel V1 Success Response]:`, responseV1.data);
        return { success: true, data: responseV1.data };
      } catch (v1Err) {
        const errorMsg = v1Err.code === 'ENOTFOUND'
          ? 'DNS lookup failed for sms.arkesel.com. Please check your internet connection or DNS settings.'
          : (v1Err.response?.data?.message || v2Err.response?.data?.message || v1Err.message || 'Arkesel SMS Gateway Error');

        console.error(`[Arkesel All Attempts Failed]: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    }
  }

  // Fallback for mNotify / Custom HTTP
  try {
    let response;
    if (provider === 'mnotify') {
      const mnotifyUrl = config.apiUrl || 'https://api.mnotify.com/api/sms/quick';
      response = await axios.post(`${mnotifyUrl}?key=${config.apiKey}`, {
        recipient: [formattedPhone],
        sender: config.senderId || 'OTESS',
        message: message,
        is_schedule: false
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      });
    } else {
      response = await axios.post(config.apiUrl, {
        apiKey: config.apiKey,
        sender: config.senderId,
        to: formattedPhone,
        message: message
      }, { timeout: 12000 });
    }

    return { success: true, data: response.data };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'SMS Gateway Error';
    return { success: false, error: errorMsg };
  }
};

const SMS_MESSAGES = {
  SUBMISSION: "Hello, your verification request has been received successfully. We will alert you once the number has been verified. Thank you.",
  APPROVAL: "Hello, your requested number has been successfully verified. You can now proceed with your order. Thank you.",
  REJECTION: "Hello, your verification request was not approved at this time. Please contact support for more information."
};

const sendSubmissionSMS = async (agentNumber) => sendSMS(agentNumber, SMS_MESSAGES.SUBMISSION);
const sendApprovalSMS = async (agentNumber) => sendSMS(agentNumber, SMS_MESSAGES.APPROVAL);
const sendRejectionSMS = async (agentNumber) => sendSMS(agentNumber, SMS_MESSAGES.REJECTION);

module.exports = {
  sendSMS,
  sendSubmissionSMS,
  sendApprovalSMS,
  sendRejectionSMS,
  getSMSConfig,
  SMS_MESSAGES
};
