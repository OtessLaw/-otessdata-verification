const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const VerifiedNumber = require('../models/VerifiedNumber');
const PendingNumber = require('../models/PendingNumber');
const UploadBatch = require('../models/UploadBatch');
const ActivityLog = require('../models/ActivityLog');
const { normalizePhoneNumber } = require('../utils/normalize');

// Helper to format date string to YYYYMMDD
const getYYYYMMDD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

// @desc    Get dashboard statistics & charts data
// @route   GET /api/admin/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const verifiedCount = await VerifiedNumber.countDocuments({ status: 'verified' });
    const pendingCount = await PendingNumber.countDocuments({ status: 'pending' });
    const rejectedCount = await PendingNumber.countDocuments({ status: 'rejected' });
    const totalBatches = await UploadBatch.countDocuments();
    
    // Today's uploads (verified numbers added today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayUploads = await VerifiedNumber.countDocuments({
      uploadDate: { $gte: startOfToday }
    });

    // Recent Upload Batches
    const recentBatches = await UploadBatch.find().sort({ date: -1 }).limit(5);

    // 7-day Upload Trend Charts data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const endD = new Date(d);
      endD.setHours(23, 59, 59, 999);

      const count = await VerifiedNumber.countDocuments({
        uploadDate: { $gte: d, $lte: endD }
      });

      const pendingDay = await PendingNumber.countDocuments({
        submittedDate: { $gte: d, $lte: endD }
      });

      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        verified: count,
        pending: pendingDay
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        verifiedCount,
        pendingCount,
        rejectedCount,
        totalBatches,
        todayUploads
      },
      recentBatches,
      chartData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get paginated & searchable verified numbers
// @route   GET /api/admin/verified
// @access  Private
const getVerifiedNumbers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const batchId = req.query.batchId || '';

    const query = { status: 'verified' };

    if (search) {
      query.phoneNumber = { $regex: search, $options: 'i' };
    }
    if (batchId) {
      query.batchId = batchId;
    }

    const skip = (page - 1) * limit;

    const total = await VerifiedNumber.countDocuments(query);
    const numbers = await VerifiedNumber.find(query)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: numbers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get verified numbers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Manually verify a single number
// @route   POST /api/admin/verified
// @access  Private
const manuallyAddVerifiedNumber = async (req, res) => {
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
    const existingVerified = await VerifiedNumber.findOne({ phoneNumber: normalized });
    if (existingVerified) {
      return res.status(400).json({ success: false, message: 'Number is already verified' });
    }

    // Add to verified
    const verified = await VerifiedNumber.create({
      phoneNumber: normalized,
      batchId: null,
      uploadedBy: req.admin.email,
      status: 'verified'
    });

    // Check if there was a pending request, and update it to approved
    const pending = await PendingNumber.findOne({ phoneNumber: normalized, status: 'pending' });
    if (pending) {
      pending.status = 'approved';
      await pending.save();
    }

    // Log action
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Manual Add',
      description: `Manually added verified number: ${normalized}`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Number ${normalized} verified successfully.`,
      data: verified
    });
  } catch (error) {
    console.error('Manual add error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a verified number (Remove verification status)
// @route   DELETE /api/admin/verified/:id
// @access  Private
const deleteVerifiedNumber = async (req, res) => {
  try {
    const verifiedNum = await VerifiedNumber.findById(req.params.id);

    if (!verifiedNum) {
      return res.status(404).json({ success: false, message: 'Verified number not found' });
    }

    // Remove verification record
    await VerifiedNumber.deleteOne({ _id: verifiedNum._id });

    // Also look up if there was a pending submission record. We can delete it or mark it rejected.
    // Let's delete it or update status so the user can resubmit. We'll update it to rejected.
    const pending = await PendingNumber.findOne({ phoneNumber: verifiedNum.phoneNumber, status: 'approved' });
    if (pending) {
      pending.status = 'rejected';
      await pending.save();
    }

    // Log action
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Delete Verified',
      description: `Removed verified status for: ${verifiedNum.phoneNumber}`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, message: 'Verified number removed successfully' });
  } catch (error) {
    console.error('Delete verified error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending number submission queue
// @route   GET /api/admin/pending
// @access  Private
const getPendingNumbers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'pending'; // pending, rejected, approved

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      // search by phone number or submission ID
      query.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { submissionId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const total = await PendingNumber.countDocuments(query);
    const numbers = await PendingNumber.find(query)
      .sort({ submittedDate: 1 }) // First in first out for queue
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: numbers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending numbers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve pending verification request
// @route   PUT /api/admin/pending/:id/approve
// @access  Private
const approvePendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (pending.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Submission already approved' });
    }

    // 1. Mark as approved
    pending.status = 'approved';
    await pending.save();

    // 2. Add to verified database
    // Ignore error if it already exists in verified (just in case)
    const existing = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });
    if (!existing) {
      await VerifiedNumber.create({
        phoneNumber: pending.phoneNumber,
        batchId: 'MANUAL-APPROVAL',
        uploadedBy: req.admin.email,
        status: 'verified'
      });
    }

    // Log action
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Approve Pending',
      description: `Approved pending number: ${pending.phoneNumber} (${pending.submissionId})`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, message: 'Submission approved successfully' });
  } catch (error) {
    console.error('Approve pending error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject pending verification request
// @route   PUT /api/admin/pending/:id/reject
// @access  Private
const rejectPendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    pending.status = 'rejected';
    await pending.save();

    // Log action
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Reject Pending',
      description: `Rejected pending number: ${pending.phoneNumber} (${pending.submissionId})`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, message: 'Submission rejected successfully' });
  } catch (error) {
    console.error('Reject pending error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete pending verification request from database
// @route   DELETE /api/admin/pending/:id
// @access  Private
const deletePendingNumber = async (req, res) => {
  try {
    const pending = await PendingNumber.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    await PendingNumber.deleteOne({ _id: pending._id });

    // Log action
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Delete Pending',
      description: `Deleted submission record: ${pending.phoneNumber} (${pending.submissionId})`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({ success: true, message: 'Submission record deleted successfully' });
  } catch (error) {
    console.error('Delete pending error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk Approve pending verification requests
// @route   POST /api/admin/pending/bulk-approve
// @access  Private
const bulkApprovePending = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of pending IDs is required' });
    }

    let approvedCount = 0;
    const verifiedToInsert = [];

    for (const id of ids) {
      const pending = await PendingNumber.findById(id);
      if (pending && pending.status === 'pending') {
        pending.status = 'approved';
        await pending.save();
        
        const existing = await VerifiedNumber.findOne({ phoneNumber: pending.phoneNumber });
        if (!existing) {
          verifiedToInsert.push({
            phoneNumber: pending.phoneNumber,
            batchId: 'MANUAL-BULK-APPROVAL',
            uploadedBy: req.admin.email,
            status: 'verified'
          });
        }
        approvedCount++;
      }
    }

    if (verifiedToInsert.length > 0) {
      await VerifiedNumber.insertMany(verifiedToInsert, { ordered: false }).catch(() => {});
    }

    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Bulk Approve',
      description: `Bulk approved ${approvedCount} pending submissions`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({
      success: true,
      message: `Successfully approved ${approvedCount} numbers.`
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk Reject pending verification requests
// @route   POST /api/admin/pending/bulk-reject
// @access  Private
const bulkRejectPending = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of pending IDs is required' });
    }

    const result = await PendingNumber.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { $set: { status: 'rejected' } }
    );

    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Bulk Reject',
      description: `Bulk rejected ${result.modifiedCount} pending submissions`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({
      success: true,
      message: `Successfully rejected ${result.modifiedCount} numbers.`
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Process file upload containing phone numbers (Bulk upload)
// @route   POST /api/admin/upload
// @access  Private
const bulkUploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let phoneNumbersRaw = [];

    // Parse file based on extension
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // Flatten all cell values
      for (const row of data) {
        for (const cell of row) {
          if (cell) {
            phoneNumbersRaw.push(String(cell));
          }
        }
      }
    } else if (fileExt === '.csv' || fileExt === '.txt') {
      // Quick synchronous reading for file limits (typically small files in workspaces)
      const fileData = fs.readFileSync(filePath, 'utf-8');
      // split by newlines, carriage returns, or commas
      phoneNumbersRaw = fileData
        .split(/[\r\n,]+/)
        .map(n => n.trim())
        .filter(Boolean);
    } else {
      fs.unlinkSync(filePath); // delete temp file
      return res.status(400).json({ success: false, message: 'Invalid file format. Only CSV, Excel, or TXT allowed.' });
    }

    // Clean up file
    fs.unlinkSync(filePath);

    if (phoneNumbersRaw.length === 0) {
      return res.status(400).json({ success: false, message: 'No phone numbers found in file' });
    }

    // Process & validate numbers
    const totalCount = phoneNumbersRaw.length;
    let addedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    let pendingUpdatedCount = 0;

    const validatedNumbers = [];
    const seenInFile = new Set();

    // Generate Batch ID
    const todayStr = getYYYYMMDD(new Date());
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const countToday = await UploadBatch.countDocuments({
      date: { $gte: startOfToday }
    }) + 1;
    const batchId = `BATCH-${todayStr}-${String(countToday).padStart(3, '0')}`;

    for (const rawNum of phoneNumbersRaw) {
      const { isValid, normalized } = normalizePhoneNumber(rawNum);

      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check if it is a duplicate in the upload file itself
      if (seenInFile.has(normalized)) {
        duplicateCount++;
        continue;
      }
      seenInFile.add(normalized);

      // Check if verified already in database
      const existingVerified = await VerifiedNumber.findOne({ phoneNumber: normalized });
      if (existingVerified) {
        duplicateCount++;
        continue;
      }

      // Check if exists in Pending collection
      const existingPending = await PendingNumber.findOne({ phoneNumber: normalized, status: 'pending' });
      if (existingPending) {
        existingPending.status = 'approved';
        await existingPending.save();
        pendingUpdatedCount++;
      }

      validatedNumbers.push({
        phoneNumber: normalized,
        batchId,
        uploadedBy: req.admin.email,
        uploadDate: new Date(),
        verifiedDate: new Date()
      });
      addedCount++;
    }

    // Write batch details
    if (validatedNumbers.length > 0) {
      await VerifiedNumber.insertMany(validatedNumbers, { ordered: false });
    }

    const batch = await UploadBatch.create({
      batchId,
      filename: req.file.originalname,
      uploadedBy: req.admin.email,
      total: totalCount,
      added: addedCount,
      duplicates: duplicateCount,
      invalid: invalidCount,
      status: 'active'
    });

    // Log Activity
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Batch Upload',
      description: `Uploaded file ${req.file.originalname} (Batch ${batchId}) - Added: ${addedCount}, Duplicates: ${duplicateCount}, Invalid: ${invalidCount}`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({
      success: true,
      message: 'Batch uploaded successfully',
      summary: {
        batchId,
        filename: req.file.originalname,
        total: totalCount,
        added: addedCount,
        duplicates: duplicateCount,
        invalid: invalidCount,
        pendingUpdated: pendingUpdatedCount
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'Server error processing file' });
  }
};

// @desc    Rollback upload batch (Removes all numbers uploaded in that batch)
// @route   POST /api/admin/batches/:batchId/rollback
// @access  Private
const rollbackBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await UploadBatch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Upload batch not found' });
    }

    if (batch.status === 'rolled_back') {
      return res.status(400).json({ success: false, message: 'This batch has already been rolled back' });
    }

    // Find verified numbers from this batch
    const numbersInBatch = await VerifiedNumber.find({ batchId });
    const phoneNumbers = numbersInBatch.map(n => n.phoneNumber);

    // 1. Delete all verified numbers matching batchId
    const deleteResult = await VerifiedNumber.deleteMany({ batchId });

    // 2. Revert pending submissions that were approved by this batch upload
    if (phoneNumbers.length > 0) {
      await PendingNumber.updateMany(
        { phoneNumber: { $in: phoneNumbers }, status: 'approved' },
        { $set: { status: 'pending' } }
      );
    }

    // 3. Mark batch as rolled_back
    batch.status = 'rolled_back';
    await batch.save();

    // Log activity
    await ActivityLog.create({
      admin: req.admin.email,
      action: 'Rollback Batch',
      description: `Rolled back upload batch: ${batchId} (Removed ${deleteResult.deletedCount} numbers)`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(200).json({
      success: true,
      message: `Batch ${batchId} rolled back successfully. Removed ${deleteResult.deletedCount} verified numbers.`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Rollback batch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get upload batch history
// @route   GET /api/admin/batches
// @access  Private
const getUploadBatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await UploadBatch.countDocuments();
    const batches = await UploadBatch.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: batches,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get upload batches error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/logs
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .sort({ time: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
  deletePendingNumber,
  bulkApprovePending,
  bulkRejectPending,
  bulkUploadFile,
  rollbackBatch,
  getUploadBatches,
  getActivityLogs
};
