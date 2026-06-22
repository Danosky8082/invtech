const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /portfolio – aggregated holdings from user simulations
router.get('/', auth, async (req, res) => {
  try {
    // Fetch all simulations for the user, including asset details
    const simulations = await prisma.userSimulation.findMany({
      where: { userId: req.user.id },
      include: {
        asset: { select: { id: true, name: true, ticker: true, type: true } },
      },
    });

    if (!simulations || simulations.length === 0) {
      return res.json({
        totalInvested: 0,
        totalExpectedProfit: 0,
        totalValue: 0,
        holdings: [],
      });
    }

    // Aggregate by asset
    const holdingsMap = {};
    let totalInvested = 0;
    let totalExpectedProfit = 0;

    simulations.forEach((sim) => {
      const assetId = sim.assetId;
      if (!holdingsMap[assetId]) {
        holdingsMap[assetId] = {
          assetId,
          name: sim.asset.name,
          ticker: sim.asset.ticker || 'N/A',
          type: sim.asset.type,
          totalInvested: 0,
          totalExpectedProfit: 0,
        };
      }
      holdingsMap[assetId].totalInvested += sim.amountInvested;
      holdingsMap[assetId].totalExpectedProfit += sim.expectedProfit;
      totalInvested += sim.amountInvested;
      totalExpectedProfit += sim.expectedProfit;
    });

    const holdings = Object.values(holdingsMap).map((h) => ({
      ...h,
      totalValue: h.totalInvested + h.totalExpectedProfit,
      allocationPercent: totalInvested > 0 ? (h.totalInvested / totalInvested) * 100 : 0,
    }));

    // Sort by totalInvested descending
    holdings.sort((a, b) => b.totalInvested - a.totalInvested);

    res.json({
      totalInvested,
      totalExpectedProfit,
      totalValue: totalInvested + totalExpectedProfit,
      holdings,
    });
  } catch (err) {
    console.error('Portfolio error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

module.exports = router;