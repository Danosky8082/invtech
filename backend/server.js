const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const simulationRoutes = require('./routes/simulation');

const app = express();

// ✅ Allow all origins (for debugging; tighten later)
app.use(cors());

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}