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

// GET /assets/search – search Yahoo Finance + merge with DB (SAFE)
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    let searchResults;
    // ✅ Safe check: only call if yahooFinance.search exists
    if (typeof yahooFinance !== 'undefined' && yahooFinance && typeof yahooFinance.search === 'function') {
      searchResults = await yahooFinance.search(query);
    } else {
      // Fallback: return empty array
      return res.json([]);
    }

    const quotes = searchResults.quotes || [];

    // Filter: only equities, ETFs, and mutual funds
    const filtered = quotes.filter(
      (q) =>
        q.quoteType === 'EQUITY' ||
        q.quoteType === 'ETF' ||
        q.quoteType === 'MUTUALFUND'
    );

    // Map to our asset format
    const mapped = filtered.map((q) => ({
      ticker: q.symbol,
      name: q.longName || q.shortName || q.symbol,
      type: (q.quoteType || 'stock').toLowerCase(),
      exchange: q.exchange,
      inDatabase: false,
    }));

    // Fetch matching DB assets
    const tickers = mapped.map((a) => a.ticker);
    const dbAssets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { id: true, ticker: true, name: true, type: true, expectedReturn: true, riskLevel: true },
    });
    const dbMap = Object.fromEntries(dbAssets.map((a) => [a.ticker, a]));

    // Merge: add DB fields and flag
    const merged = mapped.map((a) => {
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
      // Default values for external assets
      return {
        ...a,
        id: null,
        expectedReturn: 0.10,
        riskLevel: 'medium',
        inDatabase: false,
      };
    });

    res.json(merged);
  } catch (err) {
    console.error('Search error:', err.message);
    res.json([]);
  }
});

module.exports = router;