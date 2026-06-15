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
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// This is the most important line — exports the app for Vercel
module.exports = app;