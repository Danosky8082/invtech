const express = require('express');
const { runBacktest } = require('../services/backtestService');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/backtest
router.post('/', auth, async (req, res) => {
  console.log('[Backtest] prisma.backtest exists?', !!prisma.backtest);
  const { ticker, strategy, startDate, endDate, params = {} } = req.body;

  if (!ticker || !strategy || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find or create asset
    let asset = await prisma.asset.findUnique({ where: { ticker } });
    if (!asset) {
      // Create asset with default values
      asset = await prisma.asset.create({
        data: {
          name: ticker,
          ticker: ticker,
          type: 'stock',
          expectedReturn: 0.10,
          riskLevel: 'medium',
        },
      });
      console.log(`Created new asset for backtest: ${ticker}`);
    }

    // Run the backtest
    const results = await runBacktest(ticker, new Date(startDate), new Date(endDate), strategy, params);

    // Now we always have an assetId, so we can use both relations
    const backtestData = {
      user: { connect: { id: req.user.id } },
      asset: { connect: { id: asset.id } },
      ticker: ticker,
      strategy: strategy,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      results: results,
    };

    const backtest = await prisma.backtest.create({ data: backtestData });

    res.json({ ...results, backtestId: backtest.id });
  } catch (err) {
    console.error('Backtest error:', err.message);
    res.status(500).json({ error: 'Failed to run backtest: ' + err.message });
  }
});

module.exports = router;