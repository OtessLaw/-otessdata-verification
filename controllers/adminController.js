const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const VerifiedNumber = require('../models/VerifiedNumber');
const PendingNumber = require('../models/PendingNumber');
const UploadBatch = require('../models/UploadBatch');
const ActivityLog = require('../models/ActivityLog');
const { normalizePhoneNumber } = require('../utils/normalize');
const { sendApprovalSMS, sendRejectionSMS, sendSubmissionSMS } = require('../utils/sms');

const getYYYYMMDD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

// @desc    Get dashboard statistics & chart data
const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    const verifiedCount = await VerifiedNumber.countDocuments();
    const pendingCount = await PendingNumber.countDocuments({ status: 'pending' });
    const rejectedCount = await PendingNumber.countDocuments({ status: 'rejected' });
    const totalBatches = await UploadBatch.countDocuments();
    const todayUploads = await VerifiedNumber.countDocuments({ uploadDate: { $gte: startOfToday } });
    const recentBatches = await UploadBatch.find().sort({ date: -1 }).limit(5);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const endD = new Date(d); endD.setHours(23, 59, 59, 999);
      const count = await VerifiedNumber.countDocuments({ uploadDate: { $gte: d, $lte: endD } });
      const pendingDay = await PendingNumber.countDocuments({ submittedDate: { $gte: d, $lte: endD } });
      chartData.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), verified: count, pending: pendingDay });
    }

    res.status(200).json({ success: true, stats: { verifiedCount, pendingCount, rejectedCount, totalBatches, todayUploads }, recentBatches, chartData });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get verified numbers (paginated + searchable)
const getVerifiedNumbers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').toLowerCase();
    const batchId = req.query.batchId || '';

    let query = {};
    if (search) query.phoneNumber = { $regex: search, $options: 'i' };
    if (batchId) query.batchId = batchId;

    const total = await VerifiedNumber.countDocuments(query);
    const data = await VerifiedNumber.find(query).sort({ uploadDate: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getVerifiedNumbers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Manually add a verified number
const manuallyAddVerifiedNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });

    const { isValid, normalized } = normalizePhoneNumber(phoneNumber);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid phone number format' });

    const exists = await VerifiedNumber.findOne({ phoneNumber: normalized });
    if (exists) return res.status(400).json({ success: false, message: 'Number is already verified' });

    const newVerified = await VerifiedNumber.create({ phoneNumber: normalized, batchId: 'MANUAL-ENTRY', uploadedBy: req.admin.email, status: 'verified', uploadDate: new Date(), verifiedDate: new Date() });

    // Auto-approve any pending submission for this number and trigger SMS if agent is associated
    const pendingList = await PendingNumber.find({ phoneNumber: normalized, status: 'pending' });
    for (const pending of pendingList) {
      pending.status = 'approved';
      pending.verifiedAt = new Date();
      pending.updatedAt = new Date();
      if (pending.agentNumber) {
        const smsRes = await sendApprovalSMS(pending.agentNumber);
        if (smsRes.success) {
          pending.smsSent = true;
          pending.smsLogs.push({ type: 'APPROVAL', message: 'Approval SMS sent to agent', sentAt: new Date(), status: 'SUCCESS' });
        } else {
          pending.smsLogs.push({ type: 'APPROVAL', message: 'Failed to send approval SMS', sentAt: new Date(), status: 'FAILED', error: smsRes.error });
        }
      }
      await pending.save();
    }

    await ActivityLog.create({ admin: req.admin.name, action: 'MANUAL_ADD', description: `Manually added ${normalized}` });

    res.status(201).json({ success: true, message: `${normalized} verified successfully.`, data: newVerified });
  } catch (err) {
    console.error('manuallyAddVerifiedNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a verified number
const deleteVerifiedNumber = async (req, res) => {
  try {
    const verified = await VerifiedNumber.findById(req.params.id);
    if (!verified) return res.status(404).json({ success: false, message: 'Verified number not found' });

    const phone = verified.phoneNumber;
    await VerifiedNumber.findByIdAndDelete(req.params.id);

    // Revert any approved pending back to rejected
    await PendingNumber.updateMany({ phoneNumber: phone, status: 'approved' }, { status: 'rejected', updatedAt: new Date() });

    await ActivityLog.create({ admin: req.admin.name, action: 'DELETE_VERIFIED', description: `Deleted verified number ${phone}` });

    res.status(200).json({ success: true, message: 'Verified number removed successfully.' });
  } catch (err) {
    console.error('deleteVerifiedNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending submissions
const getPendingNumbers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').toLowerCase();
    const status = req.query.status || 'all';

    let query = {};
    if (status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } },
        { agentNumber: { $regex: search, $options: 'i' } },
        { submissionId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await PendingNumber.countDocuments(query);
    const data = await PendingNumber.find(query).sort({ submittedDate: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getPendingNumbers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve a pending submission and notify agent via SMS
// @route   PUT /api/admin/pending/:id/approve
const approvePendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);
    if (!pending) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (pending.status === 'approved') return res.status(400).json({ success: false, message: 'Already approved' });

    const now = new Date();
    pending.status = 'approved';
    pending.verifiedAt = now;
    pending.updatedAt = now;

    // Add to verified collection if not already there
    const exists = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });
    if (!exists) {
      await VerifiedNumber.create({ phoneNumber: pending.phoneNumber, batchId: 'MANUAL-APPROVAL', uploadedBy: req.admin.email, status: 'verified', uploadDate: now, verifiedDate: now });
    }

    // Automatically send Approval SMS to Agent if agentNumber exists
    let smsNotice = 'No agent number provided for SMS.';
    if (pending.agentNumber) {
      const smsRes = await sendApprovalSMS(pending.agentNumber);
      if (smsRes.success) {
        pending.smsSent = true;
        pending.smsLogs.push({ type: 'APPROVAL', message: 'Approval SMS sent to agent', sentAt: now, status: 'SUCCESS' });
        smsNotice = `Approval SMS sent to agent ${pending.agentNumber}.`;
      } else {
        pending.smsLogs.push({ type: 'APPROVAL', message: 'Failed to send approval SMS', sentAt: now, status: 'FAILED', error: smsRes.error });
        smsNotice = `Approved, but SMS delivery failed (${smsRes.error}).`;
      }
    }

    await pending.save();

    await ActivityLog.create({ admin: req.admin.name, action: 'APPROVE_PENDING', description: `Approved ${pending.phoneNumber} (${pending.submissionId}) | ${smsNotice}` });

    res.status(200).json({ success: true, message: `Submission approved successfully. ${smsNotice}`, data: pending });
  } catch (err) {
    console.error('approvePendingNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject a pending submission and notify agent via SMS
// @route   PUT /api/admin/pending/:id/reject
const rejectPendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);
    if (!pending) return res.status(404).json({ success: false, message: 'Submission not found' });

    const now = new Date();
    pending.status = 'rejected';
    pending.updatedAt = now;

    let smsNotice = 'No agent number provided for SMS.';
    if (pending.agentNumber) {
      const smsRes = await sendRejectionSMS(pending.agentNumber);
      if (smsRes.success) {
        pending.smsSent = true;
        pending.smsLogs.push({ type: 'REJECTION', message: 'Rejection SMS sent to agent', sentAt: now, status: 'SUCCESS' });
        smsNotice = `Rejection SMS sent to agent ${pending.agentNumber}.`;
      } else {
        pending.smsLogs.push({ type: 'REJECTION', message: 'Failed to send rejection SMS', sentAt: now, status: 'FAILED', error: smsRes.error });
        smsNotice = `Rejected, but SMS delivery failed (${smsRes.error}).`;
      }
    }

    await pending.save();

    await ActivityLog.create({ admin: req.admin.name, action: 'REJECT_PENDING', description: `Rejected ${pending.phoneNumber} (${pending.submissionId}) | ${smsNotice}` });

    res.status(200).json({ success: true, message: `Submission rejected successfully. ${smsNotice}`, data: pending });
  } catch (err) {
    console.error('rejectPendingNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Resend SMS notification to agent manually
// @route   POST /api/admin/pending/:id/resend-sms
const resendSMSNotification = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);
    if (!pending) return res.status(404).json({ success: false, message: 'Submission not found.' });
    if (!pending.agentNumber) return res.status(400).json({ success: false, message: 'No agent phone number associated with this submission.' });

    let smsRes;
    const now = new Date();

    if (pending.status === 'approved') {
      smsRes = await sendApprovalSMS(pending.agentNumber);
    } else if (pending.status === 'rejected') {
      smsRes = await sendRejectionSMS(pending.agentNumber);
    } else {
      smsRes = await sendSubmissionSMS(pending.agentNumber);
    }

    if (smsRes.success) {
      pending.smsSent = true;
      pending.smsLogs.push({ type: 'RESEND', message: `Resent ${pending.status} SMS to agent`, sentAt: now, status: 'SUCCESS' });
      await pending.save();

      await ActivityLog.create({ admin: req.admin.name, action: 'RESEND_SMS', description: `Resent SMS to ${pending.agentNumber} for ${pending.phoneNumber} (${pending.submissionId})` });

      return res.status(200).json({ success: true, message: `SMS notification resent to ${pending.agentNumber} successfully.` });
    } else {
      pending.smsLogs.push({ type: 'RESEND', message: 'Failed to resend SMS', sentAt: now, status: 'FAILED', error: smsRes.error });
      await pending.save();
      return res.status(500).json({ success: false, message: `Failed to send SMS: ${smsRes.error}` });
    }
  } catch (err) {
    console.error('resendSMSNotification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a pending submission
const deletePendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);
    if (!pending) return res.status(404).json({ success: false, message: 'Submission not found' });

    await PendingNumber.findByIdAndDelete(req.params.id);

    await ActivityLog.create({ admin: req.admin.name, action: 'DELETE_PENDING', description: `Deleted pending ${pending.phoneNumber} (${pending.submissionId})` });

    res.status(200).json({ success: true, message: 'Submission deleted successfully.' });
  } catch (err) {
    console.error('deletePendingNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk approve pending submissions with SMS alerts
const bulkApprovePending = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Array of IDs is required' });

    let approvedCount = 0;
    const now = new Date();

    for (const id of ids) {
      const pending = await PendingNumber.findById(id);
      if (!pending || pending.status !== 'pending') continue;

      pending.status = 'approved';
      pending.verifiedAt = now;
      pending.updatedAt = now;

      const exists = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });
      if (!exists) {
        await VerifiedNumber.create({ phoneNumber: pending.phoneNumber, batchId: 'MANUAL-BULK-APPROVAL', uploadedBy: req.admin.email, status: 'verified', uploadDate: now, verifiedDate: now });
      }

      if (pending.agentNumber) {
        const smsRes = await sendApprovalSMS(pending.agentNumber);
        if (smsRes.success) {
          pending.smsSent = true;
          pending.smsLogs.push({ type: 'APPROVAL', message: 'Bulk approval SMS sent to agent', sentAt: now, status: 'SUCCESS' });
        }
      }

      await pending.save();
      approvedCount++;
    }

    await ActivityLog.create({ admin: req.admin.name, action: 'BULK_APPROVE', description: `Bulk approved ${approvedCount} numbers with SMS alerts` });

    res.status(200).json({ success: true, message: `Successfully approved ${approvedCount} numbers and sent SMS notifications.` });
  } catch (err) {
    console.error('bulkApprovePending error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk reject pending submissions with SMS alerts
const bulkRejectPending = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Array of IDs is required' });

    let rejectedCount = 0;
    const now = new Date();

    for (const id of ids) {
      const pending = await PendingNumber.findById(id);
      if (!pending || pending.status !== 'pending') continue;

      pending.status = 'rejected';
      pending.updatedAt = now;

      if (pending.agentNumber) {
        const smsRes = await sendRejectionSMS(pending.agentNumber);
        if (smsRes.success) {
          pending.smsSent = true;
          pending.smsLogs.push({ type: 'REJECTION', message: 'Bulk rejection SMS sent to agent', sentAt: now, status: 'SUCCESS' });
        }
      }

      await pending.save();
      rejectedCount++;
    }

    await ActivityLog.create({ admin: req.admin.name, action: 'BULK_REJECT', description: `Bulk rejected ${rejectedCount} numbers with SMS alerts` });

    res.status(200).json({ success: true, message: `Successfully rejected ${rejectedCount} numbers and sent SMS notifications.` });
  } catch (err) {
    console.error('bulkRejectPending error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk file upload
const bulkUploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file.' });

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let phoneNumbersRaw = [];

    if (fileExt === '.xlsx' || fileExt === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      for (const row of data) for (const cell of row) if (cell) phoneNumbersRaw.push(String(cell));
    } else if (fileExt === '.csv' || fileExt === '.txt') {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      phoneNumbersRaw = fileData.split(/[\r\n,]+/).map(n => n.trim()).filter(Boolean);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Invalid file format. Only CSV, Excel, or TXT allowed.' });
    }

    fs.unlinkSync(filePath);
    if (!phoneNumbersRaw.length) return res.status(400).json({ success: false, message: 'No phone numbers found in file.' });

    const allVerified = await VerifiedNumber.find({});
    const verifiedSet = new Set(allVerified.map(v => v.phoneNumber));
    const seenInFile = new Set();
    const todayStr = getYYYYMMDD(new Date());
    const batchesCount = await UploadBatch.countDocuments({ date: { $gte: new Date(new Date().toISOString().slice(0, 10)) } });
    const batchId = `BATCH-${todayStr}-${String(batchesCount + 1).padStart(3, '0')}`;

    let addedCount = 0, duplicateCount = 0, invalidCount = 0, pendingUpdatedCount = 0;
    const toInsert = [];

    for (const rawNum of phoneNumbersRaw) {
      const { isValid, normalized } = normalizePhoneNumber(rawNum);
      if (!isValid) { invalidCount++; continue; }
      if (seenInFile.has(normalized)) { duplicateCount++; continue; }
      seenInFile.add(normalized);
      if (verifiedSet.has(normalized)) { duplicateCount++; continue; }

      // Auto-approve pending submissions for this number & notify agent
      const pendingList = await PendingNumber.find({ phoneNumber: normalized, status: 'pending' });
      for (const pending of pendingList) {
        pending.status = 'approved';
        pending.verifiedAt = new Date();
        pending.updatedAt = new Date();
        if (pending.agentNumber) {
          const smsRes = await sendApprovalSMS(pending.agentNumber);
          if (smsRes.success) {
            pending.smsSent = true;
            pending.smsLogs.push({ type: 'APPROVAL', message: 'Batch upload approval SMS sent to agent', sentAt: new Date(), status: 'SUCCESS' });
          }
        }
        await pending.save();
        pendingUpdatedCount++;
      }

      toInsert.push({ phoneNumber: normalized, batchId, uploadedBy: req.admin.email, uploadDate: new Date(), verifiedDate: new Date(), status: 'verified' });
      addedCount++;
    }

    if (toInsert.length) await VerifiedNumber.insertMany(toInsert);

    const batchRecord = await UploadBatch.create({ batchId, filename: req.file.originalname, uploadedBy: req.admin.email, date: new Date(), total: phoneNumbersRaw.length, added: addedCount, duplicates: duplicateCount, invalid: invalidCount, status: 'active' });

    await ActivityLog.create({ admin: req.admin.name, action: 'BATCH_UPLOAD', description: `Uploaded ${req.file.originalname}: ${addedCount} added, ${duplicateCount} duplicates, ${invalidCount} invalid` });

    res.status(200).json({ success: true, message: 'Batch uploaded successfully.', summary: { batchId, filename: req.file.originalname, total: phoneNumbersRaw.length, added: addedCount, duplicates: duplicateCount, invalid: invalidCount, pendingUpdated: pendingUpdatedCount } });
  } catch (err) {
    console.error('bulkUploadFile error:', err);
    res.status(500).json({ success: false, message: 'Server error processing file.' });
  }
};

// @desc    Rollback a batch
const rollbackBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await UploadBatch.findOne({ batchId });
    if (!batch) return res.status(404).json({ success: false, message: 'Upload batch not found.' });
    if (batch.status === 'rolled_back') return res.status(400).json({ success: false, message: 'Batch already rolled back.' });

    const numbersToRemove = await VerifiedNumber.find({ batchId });
    const phoneNumbers = numbersToRemove.map(v => v.phoneNumber);

    await VerifiedNumber.deleteMany({ batchId });

    // Revert approved pending back to pending
    for (const phone of phoneNumbers) {
      await PendingNumber.updateMany({ phoneNumber: phone, status: 'approved' }, { status: 'pending', updatedAt: new Date() });
    }

    batch.status = 'rolled_back';
    await batch.save();

    await ActivityLog.create({ admin: req.admin.name, action: 'ROLLBACK_BATCH', description: `Rolled back batch ${batchId}: removed ${phoneNumbers.length} numbers` });

    res.status(200).json({ success: true, message: `Batch ${batchId} rolled back. Removed ${phoneNumbers.length} verified numbers.`, deletedCount: phoneNumbers.length });
  } catch (err) {
    console.error('rollbackBatch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get upload batches
const getUploadBatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await UploadBatch.countDocuments();
    const data = await UploadBatch.find().sort({ date: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getUploadBatches error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await ActivityLog.countDocuments();
    const data = await ActivityLog.find().sort({ time: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get SMS Gateway settings
const getSMSGatewayConfig = async (req, res) => {
  try {
    const SMSConfig = require('../models/SMSConfig');
    let config = await SMSConfig.findOne();
    if (!config) {
      config = await SMSConfig.create({
        provider: process.env.SMS_PROVIDER || 'arkesel',
        apiKey: process.env.SMS_API_KEY || process.env.ARKESEL_API_KEY || '',
        senderId: process.env.SMS_SENDER_ID || 'OTESS',
        apiUrl: process.env.SMS_API_URL || 'https://api.arkesel.com/v2/sms/send',
        isEnabled: true
      });
    }
    res.status(200).json({ success: true, config });
  } catch (err) {
    console.error('getSMSGatewayConfig error:', err);
    res.status(500).json({ success: false, message: 'Server error loading SMS settings' });
  }
};

// @desc    Save SMS Gateway settings (Arkesel / mNotify / Hubtel)
const saveSMSGatewayConfig = async (req, res) => {
  try {
    const SMSConfig = require('../models/SMSConfig');
    const { provider, apiKey, senderId, apiUrl, isEnabled } = req.body;

    let config = await SMSConfig.findOne();
    if (!config) {
      config = new SMSConfig();
    }

    config.provider = provider || 'arkesel';
    config.apiKey = apiKey !== undefined ? apiKey : config.apiKey;
    config.senderId = senderId || 'OTESS';
    config.apiUrl = apiUrl || (provider === 'arkesel' ? 'https://api.arkesel.com/v2/sms/send' : 'https://api.mnotify.com/api/sms/quick');
    config.isEnabled = isEnabled !== undefined ? isEnabled : true;
    config.updatedBy = req.admin.name || req.admin.email;

    await config.save();
    await ActivityLog.create({ admin: req.admin.name, action: 'SMS_CONFIG_UPDATE', description: `Updated SMS Gateway settings: provider ${config.provider}, sender ${config.senderId}` });

    res.status(200).json({ success: true, message: 'SMS Gateway settings updated successfully.', config });
  } catch (err) {
    console.error('saveSMSGatewayConfig error:', err);
    res.status(500).json({ success: false, message: 'Server error saving SMS settings' });
  }
};

// @desc    Send a Test SMS via Arkesel or configured provider
const testSMSGateway = async (req, res) => {
  try {
    const { testPhone, message } = req.body;
    if (!testPhone) return res.status(400).json({ success: false, message: 'Recipient test phone number is required.' });

    const { sendSMS } = require('../utils/sms');
    const testMsg = message || "OTESS Test SMS: Your Arkesel SMS Gateway connection is working perfectly!";

    const result = await sendSMS(testPhone, testMsg);

    if (result.success) {
      await ActivityLog.create({ admin: req.admin.name, action: 'SMS_TEST_SENT', description: `Test SMS sent to ${testPhone}` });
      return res.status(200).json({ success: true, message: `Test SMS sent to ${testPhone} successfully!`, result });
    } else {
      return res.status(400).json({ success: false, message: `Failed to send Test SMS: ${result.error}`, result });
    }
  } catch (err) {
    console.error('testSMSGateway error:', err);
    res.status(500).json({ success: false, message: 'Server error sending test SMS' });
  }
};

module.exports = {
  getDashboardStats,
  getVerifiedNumbers,
  manuallyAddVerifiedNumber,
  deleteVerifiedNumber,
  getPendingNumbers,
  approvePendingNumber,
  rejectPendingNumber,
  resendSMSNotification,
  deletePendingNumber,
  bulkApprovePending,
  bulkRejectPending,
  bulkUploadFile,
  rollbackBatch,
  getUploadBatches,
  getActivityLogs,
  getSMSGatewayConfig,
  saveSMSGatewayConfig,
  testSMSGateway
};

