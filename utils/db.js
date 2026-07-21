const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Default structure
const defaultData = {
  verified: [],
  pending: [],
  batches: [],
  logs: [],
  admins: [
    {
      _id: 'admin_1',
      name: 'System Administrator',
      email: 'admin@otess.com',
      password: 'admin123',
      role: 'super_admin'
    }
  ]
};

// Load data from file (or create with defaults)
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return JSON.parse(JSON.stringify(defaultData));
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading data.json:', e.message);
    return JSON.parse(JSON.stringify(defaultData));
  }
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving data.json:', e.message);
  }
}

// Log an activity
function logActivity(action, details = {}, adminName = 'System') {
  const db = loadData();
  db.logs.unshift({
    id: `LOG-${Date.now()}`,
    action,
    details,
    adminName,
    createdAt: new Date().toISOString()
  });
  // Keep only the last 500 logs
  if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
  saveData(db);
}

module.exports = { loadData, saveData, logActivity };
