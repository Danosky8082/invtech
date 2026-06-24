const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

let yahooFinance;
try {
  yahooFinance = require('yahoo-finance2');
} catch (e) {
  yahooFinance = null;
}

const MOCK_ASSETS = [
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp', type: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA Corp', type: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock' },
  { ticker: 'NFLX', name: 'Netflix', type: 'stock' },
  { ticker: 'ADBE', name: 'Adobe Inc', type: 'stock' },
  { ticker: 'CRM', name: 'Salesforce', type: 'stock' },
  { ticker: 'NKE', name: 'Nike', type: 'stock' },
  { ticker: 'SHOP', name: 'Shopify', type: 'stock' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' },
  { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
];

router.get('/', auth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({ select: { id: true, name: true, ticker: true, type: true, expectedReturn: true, riskLevel: true } });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) return res.json([]);

  const mergeWithDB = async (results) => {
    if (!results || results.length === 0) return [];
    const tickers = results.map(a => a.ticker);
    const dbAssets = await prisma.asset.findMany({ where: { ticker: { in: tickers } }, select: { id: true, ticker: true, name: true, type: true, expectedReturn: true, riskLevel: true } });
    const dbMap = Object.fromEntries(dbAssets.map((a) => [a.ticker, a]));
    return results.map((a) => {
      const db = dbMap[a.ticker];
      if (db) return { ...a, id: db.id, name: db.name, type: db.type, expectedReturn: db.expectedReturn, riskLevel: db.riskLevel, inDatabase: true };
      return { ...a, id: null, expectedReturn: 0.10, riskLevel: 'medium', inDatabase: false };
    });
  };

  // Try Yahoo first
  let yahooResults = null;
  if (yahooFinance && typeof yahooFinance.search === 'function') {
    try {
      const searchResults = await yahooFinance.search(query);
      const quotes = searchResults.quotes || [];
      const filtered = quotes.filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND');
      if (filtered.length > 0) {
        const mapped = filtered.slice(0, 10).map(q => ({ ticker: q.symbol, name: q.longName || q.shortName || q.symbol, type: (q.quoteType || 'stock').toLowerCase() }));
        yahooResults = await mergeWithDB(mapped);
      }
    } catch (err) { console.error('Yahoo search error:', err.message); }
  }

  if (yahooResults && yahooResults.length > 0) return res.json(yahooResults);

  // Fallback to mock
  const lowerQuery = query.toLowerCase();
  const filteredMock = MOCK_ASSETS.filter(a => a.ticker.toLowerCase().includes(lowerQuery) || a.name.toLowerCase().includes(lowerQuery));
  const mockResults = await mergeWithDB(filteredMock);
  res.json(mockResults);
});

module.exports = router;