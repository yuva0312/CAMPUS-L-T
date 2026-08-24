const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'memoryStoreData.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err.message);
  }
}

const inMemoryLostItems = [];
const inMemoryFoundItems = [];
const inMemoryClaims = [];
const inMemoryNotifications = [];

const loadInMemoryStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed.inMemoryLostItems)) inMemoryLostItems.push(...parsed.inMemoryLostItems);
      if (Array.isArray(parsed.inMemoryFoundItems)) inMemoryFoundItems.push(...parsed.inMemoryFoundItems);
      if (Array.isArray(parsed.inMemoryClaims)) inMemoryClaims.push(...parsed.inMemoryClaims);
      if (Array.isArray(parsed.inMemoryNotifications)) inMemoryNotifications.push(...parsed.inMemoryNotifications);
    }
  } catch (err) {
    console.error('Error loading memory store data file:', err.message);
  }
};

const saveInMemoryStore = () => {
  try {
    const payload = {
      inMemoryLostItems,
      inMemoryFoundItems,
      inMemoryClaims,
      inMemoryNotifications,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving memory store data file:', err.message);
  }
};

// Initial load on server start
loadInMemoryStore();

module.exports = {
  inMemoryLostItems,
  inMemoryFoundItems,
  inMemoryClaims,
  inMemoryNotifications,
  saveInMemoryStore,
};

