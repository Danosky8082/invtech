const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const simulationRoutes = require('./routes/simulation');

const app = express();

// ✅ Force CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (for testing)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Export for Vercel serverless
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}