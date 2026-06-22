const express = require('express');
const yahooFinance = require('yahoo-finance2');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /assets – list all DB assets (for dropdown)
router.get('/', auth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      select: { id: true, name: true, ticker: true, type: true, expectedReturn: true, riskLevel: true },
    });
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /assets/search?query=... – search Yahoo Finance + merge with DB
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    // 1. Search Yahoo Finance
    const searchResults = await yahooFinance.search(query);
    const quotes = searchResults.quotes || [];

    // 2. Filter: only equities, ETFs, and mutual funds
    const filtered = quotes.filter(
      (q) =>
        q.quoteType === 'EQUITY' ||
        q.quoteType === 'ETF' ||
        q.quoteType === 'MUTUALFUND'
    );

    // 3. Map to our asset format
    const mapped = filtered.map((q) => ({
      ticker: q.symbol,
      name: q.longName || q.shortName || q.symbol,
      type: (q.quoteType || 'stock').toLowerCase(),
      exchange: q.exchange,
      inDatabase: false,
    }));

    // 4. Fetch matching DB assets
    const tickers = mapped.map((a) => a.ticker);
    const dbAssets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { id: true, ticker: true, name: true, type: true, expectedReturn: true, riskLevel: true },
    });
    const dbMap = Object.fromEntries(dbAssets.map((a) => [a.ticker, a]));

    // 5. Merge: add DB fields and flag
    const merged = mapped.map((a) => {
      const db = dbMap[a.ticker];
      if (db) {
        return {
          ...a,
          id: db.id,
          name: db.name, // prefer DB name
          type: db.type,
          expectedReturn: db.expectedReturn,
          riskLevel: db.riskLevel,
          inDatabase: true,
        };
      }
      // Default values for external assets
      return {
        ...a,
        id: null,
        expectedReturn: 0.10, // 10% default
        riskLevel: 'medium',
        inDatabase: false,
      };
    });

    res.json(merged);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;