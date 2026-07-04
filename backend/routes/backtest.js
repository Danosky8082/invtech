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
    // Check if asset exists in DB
    let asset = await prisma.asset.findUnique({ where: { ticker } });
    let assetId = asset?.id || null;

    // Run the backtest
    const results = await runBacktest(ticker, new Date(startDate), new Date(endDate), strategy, params);

    // ✅ Use scalar fields directly
    const backtestData = {
      userId: req.user.id,
      ticker: ticker,
      strategy: strategy,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      results: results,
      assetId: assetId, // null if asset not in DB
    };

    const backtest = await prisma.backtest.create({ data: backtestData });

    res.json({ ...results, backtestId: backtest.id });
  } catch (err) {
    console.error('Backtest error:', err.message);
    res.status(500).json({ error: 'Failed to run backtest: ' + err.message });
  }
});

// GET /api/backtest/history
router.get('/history', auth, async (req, res) => {
  try {
    const backtests = await prisma.backtest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(backtests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch backtest history' });
  }
});

// GET /api/backtest/:id
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const backtest = await prisma.backtest.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });
    if (!backtest) return res.status(404).json({ error: 'Backtest not found' });
    res.json(backtest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch backtest' });
  }
});

module.exports = router;