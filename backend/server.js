const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import your route handlers
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const simulationRoutes = require('./routes/simulation');

const app = express();

// --- CORS Configuration ---
// Allow requests from your Vercel frontend URL
// Replace with your actual frontend URL
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://invtech-frontend-893rccg25-daniels-projects-d4f22975.vercel.app']
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check (already there)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Full backend is running' });
});

// The rest of your server code...
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));