const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Try to load yahoo-finance2 with fallback
let yahooFinance;
try {
  yahooFinance = require('yahoo-finance2');
} catch (e) {
  console.warn('Yahoo Finance module not available, using mock fallback.');
  yahooFinance = null;
}

// ==================== MOCK ASSET LIST (FALLBACK) ====================
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

// GET /assets – list DB assets
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

// GET /assets/search?query=...
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  console.log('[Search] Query:', query);

  if (!query || query.length < 2) {
    console.log('[Search] Query too short');
    return res.json([]);
  }

  // Helper to merge DB data
  const mergeWithDB = async (results) => {
    if (!results || results.length === 0) return [];
    const tickers = results.map(a => a.ticker);
    const dbAssets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { id: true, ticker: true, name: true, type: true, expectedReturn: true, riskLevel: true },
    });
    const dbMap = Object.fromEntries(dbAssets.map((a) => [a.ticker, a]));
    return results.map((a) => {
      const db = dbMap[a.ticker];
      if (db) {
        return {
          ...a,
          id: db.id,
          name: db.name,
          type: db.type,
          expectedReturn: db.expectedReturn,
          riskLevel: db.riskLevel,
          inDatabase: true,
        };
      }
      return {
        ...a,
        id: null,
        expectedReturn: 0.10,
        riskLevel: 'medium',
        inDatabase: false,
      };
    });
  };

  // 1) Try Yahoo Finance
  let yahooResults = null;
  if (yahooFinance && typeof yahooFinance.search === 'function') {
    try {
      const searchResults = await yahooFinance.search(query);
      const quotes = searchResults.quotes || [];
      const filtered = quotes.filter(
        (q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND'
      );
      if (filtered.length > 0) {
        const mapped = filtered.slice(0, 10).map((q) => ({
          ticker: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          type: (q.quoteType || 'stock').toLowerCase(),
          exchange: q.exchange,
          inDatabase: false,
        }));
        yahooResults = await mergeWithDB(mapped);
      }
    } catch (err) {
      console.error('[Search] Yahoo search error:', err.message);
    }
  }

  // If Yahoo returned results, use them
  if (yahooResults && yahooResults.length > 0) {
    console.log('[Search] Returning Yahoo results:', yahooResults.length);
    return res.json(yahooResults);
  }

  // 2) Fallback to mock list
  console.log('[Search] Using mock fallback for:', query);
  const lowerQuery = query.toLowerCase();
  const filteredMock = MOCK_ASSETS.filter(a =>
    a.ticker.toLowerCase().includes(lowerQuery) ||
    a.name.toLowerCase().includes(lowerQuery)
  );
  const mockResults = await mergeWithDB(filteredMock);
  console.log('[Search] Returning mock results:', mockResults.length);
  res.json(mockResults);
});

module.exports = router;