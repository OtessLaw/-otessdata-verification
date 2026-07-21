const VerifiedNumber = require('../models/VerifiedNumber');
const PendingNumber = require('../models/PendingNumber');
const ActivityLog = require('../models/ActivityLog');
const { normalizePhoneNumber } = require('../utils/normalize');
const { sendSubmissionSMS } = require('../utils/sms');

// @desc    Verify a single phone number (Public)
// @route   POST /api/verify/single
const verifySingleNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });

    const { isValid, normalized } = normalizePhoneNumber(phoneNumber);
    if (!isValid) return res.status(400).json({ success: false, status: 'invalid', message: 'Invalid format. Use a valid Ghana number (e.g., 0241234567).' });

    const verified = await VerifiedNumber.findOne({ phoneNumber: normalized });
    if (verified) {
      return res.status(200).json({
        success: true, status: 'verified',
        data: { phoneNumber: verified.phoneNumber, verifiedDate: verified.verifiedDate, batchId: verified.batchId || 'MANUAL-ENTRY' }
      });
    }

    const pending = await PendingNumber.findOne({ phoneNumber: normalized }).sort({ submittedDate: -1 });
    if (pending) {
      if (pending.status === 'pending') {
        const position = await PendingNumber.countDocuments({ status: 'pending', submittedDate: { $lt: pending.submittedDate } }) + 1;
        return res.status(200).json({
          success: true, status: 'pending',
          data: { phoneNumber: pending.phoneNumber, submissionId: pending.submissionId, submittedDate: pending.submittedDate, position, estimatedDate: pending.estimatedDate, agentNumber: pending.agentNumber }
        });
      } else if (pending.status === 'rejected') {
        return res.status(200).json({ success: true, status: 'not_found', message: 'Submission was rejected.', data: { phoneNumber: pending.phoneNumber, status: 'rejected', submissionId: pending.submissionId } });
      }
    }

    return res.status(200).json({ success: true, status: 'not_found', message: 'This number has not been submitted or verified.' });
  } catch (err) {
    console.error('verifySingleNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify multiple phone numbers (Public)
// @route   POST /api/verify/bulk
const verifyBulkNumbers = async (req, res) => {
  try {
    const { phoneNumbers } = req.body;
    let numberList = Array.isArray(phoneNumbers)
      ? phoneNumbers
      : (typeof phoneNumbers === 'string' ? phoneNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean) : []);

    if (!numberList.length) return res.status(400).json({ success: false, message: 'Please provide a list of phone numbers.' });

    const allVerified = await VerifiedNumber.find({});
    const allPending = await PendingNumber.find({});
    const verifiedSet = new Set(allVerified.map(v => v.phoneNumber));
    const pendingMap = {};
    allPending.forEach(p => { if (!pendingMap[p.phoneNumber] || new Date(p.submittedDate) > new Date(pendingMap[p.phoneNumber].submittedDate)) pendingMap[p.phoneNumber] = p; });

    let verifiedCount = 0, pendingCount = 0, notFoundCount = 0, invalidCount = 0;
    const results = [];

    for (const num of numberList) {
      const { isValid, normalized } = normalizePhoneNumber(num);
      if (!isValid) { results.push({ number: num, status: 'invalid', message: 'Invalid format' }); invalidCount++; continue; }
      if (verifiedSet.has(normalized)) { const v = allVerified.find(x => x.phoneNumber === normalized); results.push({ number: normalized, status: 'verified', date: v.verifiedDate, batchId: v.batchId || 'MANUAL' }); verifiedCount++; continue; }
      if (pendingMap[normalized]) {
        const p = pendingMap[normalized];
        if (p.status === 'pending') { results.push({ number: normalized, status: 'pending', submissionId: p.submissionId, date: p.submittedDate }); pendingCount++; }
        else { results.push({ number: normalized, status: 'not_found', message: `Submission ${p.submissionId} was rejected` }); notFoundCount++; }
        continue;
      }
      results.push({ number: normalized, status: 'not_found' }); notFoundCount++;
    }

    res.status(200).json({ success: true, summary: { total: numberList.length, verified: verifiedCount, pending: pendingCount, notFound: notFoundCount, invalid: invalidCount }, results });
  } catch (err) {
    console.error('verifyBulkNumbers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit a single number for verification (Public / Agent)
// @route   POST /api/submit/single
const submitSingleNumber = async (req, res) => {
  try {
    const { phoneNumber, customerNumber, agentNumber } = req.body;
    const targetCustomerPhone = customerNumber || phoneNumber;

    if (!targetCustomerPhone) return res.status(400).json({ success: false, message: 'Customer phone number is required.' });
    if (!agentNumber) return res.status(400).json({ success: false, message: 'Agent phone number is required.' });

    const normCustomer = normalizePhoneNumber(targetCustomerPhone);
    if (!normCustomer.isValid) return res.status(400).json({ success: false, message: 'Invalid customer phone number format.' });

    const normAgent = normalizePhoneNumber(agentNumber);
    if (!normAgent.isValid) return res.status(400).json({ success: false, message: 'Invalid agent phone number format.' });

    const alreadyVerified = await VerifiedNumber.findOne({ phoneNumber: normCustomer.normalized });
    if (alreadyVerified) {
      return res.status(400).json({ success: false, message: 'This number is already verified.', status: 'verified' });
    }

    const existingPending = await PendingNumber.findOne({ phoneNumber: normCustomer.normalized, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ success: false, message: 'Already submitted and pending verification.', status: 'pending', submissionId: existingPending.submissionId });
    }

    const submissionId = `SUB-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const estimatedDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const newSub = await PendingNumber.create({
      phoneNumber: normCustomer.normalized,
      customerNumber: normCustomer.normalized,
      agentNumber: normAgent.normalized,
      submissionId,
      status: 'pending',
      submittedDate: now,
      submittedAt: now,
      estimatedDate
    });

    // Automatically send Submission SMS to Agent
    const smsRes = await sendSubmissionSMS(normAgent.normalized);
    if (smsRes.success) {
      newSub.smsSent = true;
      newSub.smsLogs.push({ type: 'SUBMISSION', message: 'Submission SMS sent to agent', sentAt: new Date(), status: 'SUCCESS' });
      await newSub.save();
    } else {
      newSub.smsLogs.push({ type: 'SUBMISSION', message: 'Failed to send submission SMS', sentAt: new Date(), status: 'FAILED', error: smsRes.error });
      await newSub.save();
    }

    await ActivityLog.create({
      admin: 'AGENT',
      action: 'SUBMIT_SINGLE',
      description: `Customer: ${normCustomer.normalized} | Agent: ${normAgent.normalized} (${submissionId})`
    });

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully. SMS alert sent to agent.',
      data: newSub
    });
  } catch (err) {
    console.error('submitSingleNumber error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit multiple numbers (Public / Agent)
// @route   POST /api/submit/bulk
const submitBulkNumbers = async (req, res) => {
  try {
    const { phoneNumbers, agentNumber } = req.body;
    if (!agentNumber) return res.status(400).json({ success: false, message: 'Agent phone number is required.' });

    const normAgent = normalizePhoneNumber(agentNumber);
    if (!normAgent.isValid) return res.status(400).json({ success: false, message: 'Invalid agent phone number format.' });

    let numberList = Array.isArray(phoneNumbers)
      ? phoneNumbers
      : (typeof phoneNumbers === 'string' ? phoneNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean) : []);

    if (!numberList.length) return res.status(400).json({ success: false, message: 'Phone numbers list is required.' });

    const allVerified = await VerifiedNumber.find({});
    const allPending = await PendingNumber.find({ status: 'pending' });
    const verifiedSet = new Set(allVerified.map(v => v.phoneNumber));
    const pendingSet = new Set(allPending.map(p => p.phoneNumber));
    const uniqueInputs = [...new Set(numberList)];
    const results = [];
    const toCreate = [];
    const now = new Date();

    for (const num of uniqueInputs) {
      const { isValid, normalized } = normalizePhoneNumber(num);
      if (!isValid) { results.push({ number: num, status: 'invalid', message: 'Invalid format' }); continue; }
      if (verifiedSet.has(normalized)) { results.push({ number: normalized, status: 'already_verified', message: 'Already verified' }); continue; }
      if (pendingSet.has(normalized)) { const p = allPending.find(x => x.phoneNumber === normalized); results.push({ number: normalized, status: 'already_pending', submissionId: p.submissionId }); continue; }
      
      const submissionId = `SUB-${Math.floor(10000 + Math.random() * 90000)}`;
      const estimatedDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      toCreate.push({
        phoneNumber: normalized,
        customerNumber: normalized,
        agentNumber: normAgent.normalized,
        submissionId,
        status: 'pending',
        submittedDate: now,
        submittedAt: now,
        estimatedDate
      });
      results.push({ number: normalized, status: 'submitted', submissionId });
    }

    if (toCreate.length) {
      await PendingNumber.insertMany(toCreate);
      // Send bulk alert SMS to agent
      await sendSubmissionSMS(normAgent.normalized);
      await ActivityLog.create({ admin: 'AGENT', action: 'SUBMIT_BULK', description: `Bulk submission: ${toCreate.length} numbers by agent ${normAgent.normalized}` });
    }

    res.status(200).json({
      success: true,
      summary: { total: numberList.length, processed: uniqueInputs.length, submitted: toCreate.length, alreadyVerified: results.filter(r => r.status === 'already_verified').length, alreadyPending: results.filter(r => r.status === 'already_pending').length, invalid: results.filter(r => r.status === 'invalid').length },
      results
    });
  } catch (err) {
    console.error('submitBulkNumbers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Track submission
// @route   GET /api/track/:query
const trackSubmission = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) return res.status(400).json({ success: false, message: 'Tracking query is required' });

    const upperQuery = query.toUpperCase().trim();

    let pending = await PendingNumber.findOne({ submissionId: upperQuery });
    if (!pending) {
      const { isValid, normalized } = normalizePhoneNumber(query);
      if (isValid) {
        pending = await PendingNumber.findOne({
          $or: [{ phoneNumber: normalized }, { customerNumber: normalized }, { agentNumber: normalized }]
        }).sort({ submittedDate: -1 });
      }
    }

    if (!pending) {
      const { isValid, normalized } = normalizePhoneNumber(query);
      if (isValid) {
        const v = await VerifiedNumber.findOne({ phoneNumber: normalized });
        if (v) {
          return res.status(200).json({
            success: true, found: true, status: 'verified',
            timeline: [
              { label: 'Submitted', status: 'completed', date: v.uploadDate },
              { label: 'Processing', status: 'completed', date: v.uploadDate },
              { label: 'Verified', status: 'completed', date: v.verifiedDate }
            ],
            data: { phoneNumber: v.phoneNumber, customerNumber: v.phoneNumber, submissionId: 'DIRECT-UPLOAD', submittedDate: v.uploadDate, estimatedDate: v.verifiedDate }
          });
        }
      }
      return res.status(404).json({ success: false, found: false, message: 'No submission or verified record found.' });
    }

    const existsInVerified = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });
    const isApproved = pending.status === 'approved';
    const isRejected = pending.status === 'rejected';

    const timeline = [
      { label: 'Submitted', status: 'completed', date: pending.submittedDate, description: 'Submission received by the system.' },
      { label: 'Processing', status: (isApproved || isRejected || existsInVerified) ? 'completed' : 'active', date: pending.updatedAt || null, description: pending.status === 'pending' ? 'Awaiting admin validation.' : 'Processing complete.' }
    ];

    if (isRejected) {
      timeline.push({ label: 'Rejected', status: 'failed', date: pending.updatedAt, description: 'Verification rejected. Contact support.' });
    } else {
      timeline.push({ label: 'Verified', status: (isApproved || existsInVerified) ? 'completed' : 'pending', date: existsInVerified ? existsInVerified.verifiedDate : (isApproved ? pending.updatedAt : null), description: (isApproved || existsInVerified) ? 'Number successfully verified.' : 'Estimated within 72 hours.' });
    }

    res.status(200).json({
      success: true,
      found: true,
      status: existsInVerified ? 'verified' : pending.status,
      timeline,
      data: {
        phoneNumber: pending.phoneNumber,
        customerNumber: pending.customerNumber || pending.phoneNumber,
        agentNumber: pending.agentNumber,
        submissionId: pending.submissionId,
        submittedDate: pending.submittedDate,
        submittedAt: pending.submittedAt,
        verifiedAt: pending.verifiedAt,
        smsSent: pending.smsSent,
        estimatedDate: pending.estimatedDate
      }
    });
  } catch (err) {
    console.error('trackSubmission error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { verifySingleNumber, verifyBulkNumbers, submitSingleNumber, submitBulkNumbers, trackSubmission };
