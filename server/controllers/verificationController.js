const VerifiedNumber = require('../models/VerifiedNumber');
const PendingNumber = require('../models/PendingNumber');
const { normalizePhoneNumber } = require('../utils/normalize');

// @desc    Verify a single phone number (Public)
// @route   POST /api/verify/single
// @access  Public
const verifySingleNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const { isValid, normalized, original } = normalizePhoneNumber(phoneNumber);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'Invalid number prefix or length. Use Ghana numbers (e.g., 0241234567, +233241234567)'
      });
    }

    // 1. Check Verified Number Collection
    const verified = await VerifiedNumber.findOne({ phoneNumber: normalized });
    if (verified) {
      return res.status(200).json({
        success: true,
        status: 'verified',
        data: {
          phoneNumber: verified.phoneNumber,
          verifiedDate: verified.verifiedDate,
          batchId: verified.batchId || 'MANUAL-ENTRY',
          uploadedBy: verified.uploadedBy
        }
      });
    }

    // 2. Check Pending Number Collection
    const pending = await PendingNumber.findOne({ phoneNumber: normalized }).sort({ createdAt: -1 });
    if (pending) {
      if (pending.status === 'pending') {
        // Calculate queue position: count pending items submitted before this one
        const position = await PendingNumber.countDocuments({
          status: 'pending',
          submittedDate: { $lt: pending.submittedDate }
        }) + 1;

        return res.status(200).json({
          success: true,
          status: 'pending',
          data: {
            phoneNumber: pending.phoneNumber,
            submissionId: pending.submissionId,
            submittedDate: pending.submittedDate,
            position,
            estimatedDate: pending.estimatedDate
          }
        });
      } else if (pending.status === 'rejected') {
        return res.status(200).json({
          success: true,
          status: 'not_found', // Treat rejected as not verified but keep record of submission
          message: 'This number submission was rejected by administration.',
          data: {
            phoneNumber: pending.phoneNumber,
            status: 'rejected',
            submissionId: pending.submissionId
          }
        });
      }
    }

    // 3. Not Found
    return res.status(200).json({
      success: true,
      status: 'not_found',
      message: 'This number has not been submitted or verified.'
    });
  } catch (error) {
    console.error('Verify single number error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify multiple phone numbers (Public)
// @route   POST /api/verify/bulk
// @access  Public
const verifyBulkNumbers = async (req, res) => {
  try {
    const { phoneNumbers } = req.body; // Array or newline string

    let numberList = [];
    if (Array.isArray(phoneNumbers)) {
      numberList = phoneNumbers;
    } else if (typeof phoneNumbers === 'string') {
      numberList = phoneNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    }

    if (!numberList || numberList.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide list of phone numbers' });
    }

    const results = [];
    let verifiedCount = 0;
    let pendingCount = 0;
    let notFoundCount = 0;
    let invalidCount = 0;

    for (const num of numberList) {
      const { isValid, normalized } = normalizePhoneNumber(num);

      if (!isValid) {
        results.push({ number: num, status: 'invalid', message: 'Invalid format' });
        invalidCount++;
        continue;
      }

      // Check verified
      const verified = await VerifiedNumber.findOne({ phoneNumber: normalized });
      if (verified) {
        results.push({
          number: normalized,
          status: 'verified',
          date: verified.verifiedDate,
          batchId: verified.batchId || 'MANUAL'
        });
        verifiedCount++;
        continue;
      }

      // Check pending
      const pending = await PendingNumber.findOne({ phoneNumber: normalized }).sort({ createdAt: -1 });
      if (pending) {
        if (pending.status === 'pending') {
          results.push({
            number: normalized,
            status: 'pending',
            submissionId: pending.submissionId,
            date: pending.submittedDate
          });
          pendingCount++;
        } else {
          results.push({
            number: normalized,
            status: 'not_found',
            message: `Submission ${pending.submissionId} was rejected`
          });
          notFoundCount++;
        }
        continue;
      }

      // Not found
      results.push({ number: normalized, status: 'not_found' });
      notFoundCount++;
    }

    res.status(200).json({
      success: true,
      summary: {
        total: numberList.length,
        verified: verifiedCount,
        pending: pendingCount,
        notFound: notFoundCount,
        invalid: invalidCount
      },
      results
    });
  } catch (error) {
    console.error('Verify bulk error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit a single number for verification (Public)
// @route   POST /api/submit/single
// @access  Public
const submitSingleNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const { isValid, normalized } = normalizePhoneNumber(phoneNumber);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Check if verified already
    const verified = await VerifiedNumber.findOne({ phoneNumber: normalized });
    if (verified) {
      return res.status(400).json({
        success: false,
        message: 'This number is already verified.',
        status: 'verified'
      });
    }

    // Check if pending already (only 'pending' status blocks resubmission)
    const pending = await PendingNumber.findOne({ phoneNumber: normalized, status: 'pending' });
    if (pending) {
      return res.status(400).json({
        success: false,
        message: 'This number has already been submitted and is pending verification.',
        status: 'pending',
        submissionId: pending.submissionId
      });
    }

    // Generate Submission ID: SUB-######
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const submissionId = `SUB-${randomDigits}`;

    const newSubmission = await PendingNumber.create({
      phoneNumber: normalized,
      submissionId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully submitted phone number for verification.',
      data: newSubmission
    });
  } catch (error) {
    console.error('Submit single error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit multiple numbers for verification (Public)
// @route   POST /api/submit/bulk
// @access  Public
const submitBulkNumbers = async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    let numberList = [];
    if (Array.isArray(phoneNumbers)) {
      numberList = phoneNumbers;
    } else if (typeof phoneNumbers === 'string') {
      numberList = phoneNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    }

    if (!numberList || numberList.length === 0) {
      return res.status(400).json({ success: false, message: 'Phone numbers list is required' });
    }

    const results = [];
    const pendingToCreate = [];

    // Remove duplicates from input list itself
    const uniqueInputs = [...new Set(numberList)];

    for (const num of uniqueInputs) {
      const { isValid, normalized } = normalizePhoneNumber(num);
      
      if (!isValid) {
        results.push({ number: num, status: 'invalid', message: 'Invalid format' });
        continue;
      }

      // Check verified
      const verified = await VerifiedNumber.findOne({ phoneNumber: normalized });
      if (verified) {
        results.push({ number: normalized, status: 'already_verified', message: 'Already verified' });
        continue;
      }

      // Check pending
      const pending = await PendingNumber.findOne({ phoneNumber: normalized, status: 'pending' });
      if (pending) {
        results.push({ number: normalized, status: 'already_pending', message: 'Already pending', submissionId: pending.submissionId });
        continue;
      }

      // Prepare new submission
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const submissionId = `SUB-${randomDigits}`;
      
      pendingToCreate.push({
        phoneNumber: normalized,
        submissionId,
        status: 'pending'
      });

      results.push({ number: normalized, status: 'submitted', submissionId });
    }

    if (pendingToCreate.length > 0) {
      await PendingNumber.insertMany(pendingToCreate);
    }

    const summary = {
      total: numberList.length,
      processed: uniqueInputs.length,
      submitted: pendingToCreate.length,
      alreadyVerified: results.filter(r => r.status === 'already_verified').length,
      alreadyPending: results.filter(r => r.status === 'already_pending').length,
      invalid: results.filter(r => r.status === 'invalid').length
    };

    res.status(200).json({
      success: true,
      summary,
      results
    });
  } catch (error) {
    console.error('Submit bulk error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Track verification request by Phone or Submission ID (Public)
// @route   GET /api/track/:query
// @access  Public
const trackSubmission = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Tracking query is required' });
    }

    // Try finding by submissionId first
    let pending = await PendingNumber.findOne({ submissionId: query.toUpperCase().trim() });
    
    // If not found, try normalizing and searching by phone number
    if (!pending) {
      const { isValid, normalized } = normalizePhoneNumber(query);
      if (isValid) {
        pending = await PendingNumber.findOne({ phoneNumber: normalized }).sort({ createdAt: -1 });
      }
    }

    if (!pending) {
      // Check if it is already verified directly (uploaded by admin, no pending request)
      const { isValid, normalized } = normalizePhoneNumber(query);
      if (isValid) {
        const verifiedDirect = await VerifiedNumber.findOne({ phoneNumber: normalized });
        if (verifiedDirect) {
          return res.status(200).json({
            success: true,
            found: true,
            status: 'verified',
            timeline: [
              { label: 'Submitted', status: 'completed', date: verifiedDirect.uploadDate },
              { label: 'Processing', status: 'completed', date: verifiedDirect.uploadDate },
              { label: 'Verified', status: 'completed', date: verifiedDirect.verifiedDate }
            ],
            data: {
              phoneNumber: verifiedDirect.phoneNumber,
              submissionId: 'DIRECT-UPLOAD',
              submittedDate: verifiedDirect.uploadDate,
              estimatedDate: verifiedDirect.verifiedDate
            }
          });
        }
      }

      return res.status(404).json({
        success: false,
        found: false,
        message: 'No submission request or verified record found for the provided details.'
      });
    }

    // Build timeline details
    const isPending = pending.status === 'pending';
    const isApproved = pending.status === 'approved';
    const isRejected = pending.status === 'rejected';

    // Check if also in verified collection (in case status was approved but we double check)
    const existsInVerified = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });

    const timeline = [
      {
        label: 'Submitted',
        status: 'completed',
        date: pending.submittedDate,
        description: 'Submission received by the system.'
      },
      {
        label: 'Processing',
        status: (isApproved || isRejected || existsInVerified) ? 'completed' : 'active',
        date: (isApproved || isRejected) ? pending.updatedAt : null,
        description: isPending ? 'Number is queued and awaiting admin validation.' : 'Verification processing complete.'
      }
    ];

    if (isRejected) {
      timeline.push({
        label: 'Rejected',
        status: 'failed',
        date: pending.updatedAt,
        description: 'Verification request rejected. Please verify your details or contact support.'
      });
    } else {
      timeline.push({
        label: 'Verified',
        status: (isApproved || existsInVerified) ? 'completed' : 'pending',
        date: existsInVerified ? existsInVerified.verifiedDate : (isApproved ? pending.updatedAt : null),
        description: (isApproved || existsInVerified) ? 'Number successfully verified.' : 'Estimated completion within 48 hours.'
      });
    }

    res.status(200).json({
      success: true,
      found: true,
      status: existsInVerified ? 'verified' : pending.status,
      timeline,
      data: {
        phoneNumber: pending.phoneNumber,
        submissionId: pending.submissionId,
        submittedDate: pending.submittedDate,
        estimatedDate: pending.estimatedDate
      }
    });
  } catch (error) {
    console.error('Track submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  verifySingleNumber,
  verifyBulkNumbers,
  submitSingleNumber,
  submitBulkNumbers,
  trackSubmission
};
