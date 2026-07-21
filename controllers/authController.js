const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfornvs12345!';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

// @desc    Admin Login
// @route   POST /api/auth/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password.' });

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Update lastLogin
    admin.lastLogin = new Date();
    await admin.save();

    await ActivityLog.create({ admin: admin.name, action: 'ADMIN_LOGIN', description: `Admin ${admin.email} logged in` });

    res.status(200).json({
      success: true,
      token: generateToken(admin._id),
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, lastLogin: admin.lastLogin }
    });
  } catch (err) {
    console.error('loginAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    res.status(200).json({ success: true, admin: req.admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Please provide current and new password.' });

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    admin.password = newPassword;
    await admin.save(); // pre-save hook will hash it

    await ActivityLog.create({ admin: admin.name, action: 'PASSWORD_CHANGE', description: `Admin ${admin.email} changed password` });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { loginAdmin, getProfile, changePassword };
