const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../routes/auth');
const marketRoutes = require('../routes/market');
const simulationRoutes = require('../routes/simulation');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add this to handle the root path for the first deployment
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

module.exports = app;