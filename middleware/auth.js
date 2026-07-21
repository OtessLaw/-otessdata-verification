const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfornvs12345!';

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) return res.status(401).json({ success: false, message: 'Not authorized. Admin not found.' });
    req.admin = { id: admin._id, name: admin.name, email: admin.email, role: admin.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

module.exports = { protect };
