require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
  // Seed initial Admin if database is empty
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('No administrators found in database. Seeding initial admin...');
      
      const seedAdmin = await Admin.create({
        name: 'System Administrator',
        email: 'admin@nvs.com',
        password: 'admin123', // Hashed by the model pre-save hook
        role: 'super_admin'
      });

      console.log('--------------------------------------------------');
      console.log('Default Admin Account Created:');
      console.log(`Email:    ${seedAdmin.email}`);
      console.log('Password: admin123');
      console.log('Please log in and update your password immediately.');
      console.log('--------------------------------------------------');
    }
  } catch (seedErr) {
    console.error('Failed to seed default admin:', seedErr);
  }

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database before starting server:', err);
});
