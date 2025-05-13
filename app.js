const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load env vars
dotenv.config();

// Import School model
const School = require('./model/school.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Add School API
app.post('/addSchool', async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!name || !address || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const school = new School({ name, address, latitude: lat, longitude: lng });
    const saved = await school.save();

    res.status(201).json({ message: 'School added successfully', schoolId: saved._id });
  } catch (err) {
    console.error('Error adding school:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper: Convert degrees to radians
function toRad(value) {
  return (value * Math.PI) / 180;
}

// List Nearby Schools
app.get('/listSchools', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const schools = await School.find({});

    const R = 6371; // Earth's radius in km

    const sorted = schools.map(school => {
      const dLat = toRad(school.latitude - userLat);
      const dLng = toRad(school.longitude - userLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(userLat)) *
        Math.cos(toRad(school.latitude)) *
        Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      console.log(`${school.name}: ${distance.toFixed(2)} km away`);

      return { ...school._doc, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.json(sorted);
  } catch (err) {
    console.error('Error fetching schools:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get All Schools (raw, unsorted)
app.get('/allSchools', async (req, res) => {
  try {
    const schools = await School.find({});
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
