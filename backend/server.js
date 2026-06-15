const { execSync } = require('child_process');
const fs = require('fs');

// Check if Prisma Client is generated; if not, generate it
const prismaClientPath = './node_modules/.prisma/client';
if (!fs.existsSync(prismaClientPath)) {
  console.log('⚠️ Prisma Client not found. Generating...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client generated.');
  } catch (err) {
    console.error('❌ Failed to generate Prisma Client:', err.message);
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const simulationRoutes = require('./routes/simulation');

const app = express();
app.use(cors()); // allow all (or restrict to your frontend URL)
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));