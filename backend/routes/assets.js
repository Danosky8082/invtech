const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Static list of popular assets (fallback)
const POPULAR_ASSETS = [
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp', type: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { ticker: 'NFLX', name: 'Netflix', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA Corp', type: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock' },
  { ticker: 'JPM', name: 'JPMorgan Chase', type: 'stock' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf' },
  { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
];

// GET /assets – list all DB assets
router.get('/', auth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      select: { id: true, name: true, ticker: true, type: true, expectedReturn: true, riskLevel: true },
    });
    res.json(assets);
  } catch (err) {
    console.error('Error fetching assets:', err.message);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /assets/search?query=... – always returns something
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json([]);
  }

  // Filter the static list based on the query
  const filtered = POPULAR_ASSETS.filter(a =>
    a.ticker.toLowerCase().includes(query.toLowerCase()) ||
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  // Format response (same as before)
  const result = filtered.map(a => ({
    ...a,
    inDatabase: false,
    expectedReturn: 0.10,
    riskLevel: 'medium',
    id: null,
  }));

  console.log(`[Search] Returning ${result.length} results for "${query}"`);
  res.json(result);
});

module.exports = router;