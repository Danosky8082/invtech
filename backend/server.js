const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Enable CORS for all origins (temporary, works for any frontend)
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== MARKET ROUTES (mock data) ====================
app.get('/api/market/exchange-rate', (req, res) => {
  res.json({
    base: 'USD',
    rates: { EUR: 0.92, GBP: 0.79, CAD: 1.37, JPY: 147.5, CNY: 7.25, NGN: 1520 }
  });
});

app.get('/api/market/news', (req, res) => {
  const country = req.query.country || 'us';
  res.json([
    { title: `${country.toUpperCase()} markets rally`, description: 'Stocks lead gains.', url: '#', imageUrl: 'https://placehold.co/300x200' },
    { title: `Central bank holds rates in ${country.toUpperCase()}`, description: 'Policy supports economy.', url: '#', imageUrl: 'https://placehold.co/300x200' }
  ]);
});

app.get('/api/market/detect-country', (req, res) => {
  res.json({ country: 'us' });
});

app.get('/api/market/treasury-yields', (req, res) => {
  res.json({ tenYearYield: 4.2 });
});

app.get('/api/market/stock/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({ symbol, price: 100.00, change: 0 });
});

// ==================== AUTH ROUTES (mock) ====================
app.post('/api/auth/signup', (req, res) => {
  const { username, email } = req.body;
  res.json({ token: 'fake-jwt-token', user: { id: 1, username, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  res.json({ token: 'fake-jwt-token', user: { id: 1, username: 'test', email } });
});

// ==================== SIMULATION ROUTES ====================
app.get('/api/simulation/assets', (req, res) => {
  res.json([
    { id: 1, name: 'Apple Inc.', type: 'stock', ticker: 'AAPL', expectedReturn: 0.12, riskLevel: 'medium' },
    { id: 2, name: 'Tesla Inc.', type: 'stock', ticker: 'TSLA', expectedReturn: 0.20, riskLevel: 'high' }
  ]);
});

app.post('/api/simulation/simulate', (req, res) => {
  const { assetId, amountInvested, currency = 'USD' } = req.body;
  res.json({
    assetName: 'Sample Asset',
    amountInvested,
    amountCurrency: currency,
    expectedProfit: amountInvested * 0.1,
    totalReturn: amountInvested * 1.1,
    riskLevel: 'medium',
    advice: 'This is a mock simulation. Real backend coming soon.',
    livePrice: 100
  });
});

app.get('/api/simulation/history', (req, res) => {
  res.json([]);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));