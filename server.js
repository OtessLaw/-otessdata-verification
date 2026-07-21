require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
  // Ensure default Admin exists with updated password
  try {
    const adminEmail = 'admin@nvs.com';
    const newPassword = 'otessadmin123';
    let admin = await Admin.findOne({ email: adminEmail });

    if (!admin) {
      console.log('No administrators found in database. Seeding initial admin...');
      admin = await Admin.create({
        name: 'System Administrator',
        email: adminEmail,
        password: newPassword, // Hashed by the model pre-save hook
        role: 'super_admin'
      });
      console.log('--------------------------------------------------');
      console.log('Default Admin Account Created:');
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${newPassword}`);
      console.log('--------------------------------------------------');
    } else {
      // Update existing admin password to otessadmin123
      admin.password = newPassword;
      await admin.save();
      console.log('--------------------------------------------------');
      console.log('Admin Password Updated:');
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${newPassword}`);
      console.log('--------------------------------------------------');
    }
  } catch (seedErr) {
    console.error('Failed to seed/update default admin:', seedErr);
  }

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database before starting server:', err);
});
