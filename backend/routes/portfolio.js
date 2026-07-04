const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
const { getStockPrice } = require('../services/dataService');

// GET /portfolio – aggregated holdings with real-time values
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
        totalRealizedProfit: 0,
        holdings: [],
      });
    }

    // Aggregate by asset
    const holdingsMap = {};
    let totalInvested = 0;
    let totalExpectedProfit = 0;
    let totalRealizedProfit = 0;

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
          totalShares: 0,
          priceAtSimulation: sim.priceAtSimulation || null,
        };
      }
      holdingsMap[assetId].totalInvested += sim.amountInvested;
      holdingsMap[assetId].totalExpectedProfit += sim.expectedProfit;
      if (sim.priceAtSimulation && sim.priceAtSimulation > 0) {
        holdingsMap[assetId].totalShares += sim.amountInvested / sim.priceAtSimulation;
      }
      totalInvested += sim.amountInvested;
      totalExpectedProfit += sim.expectedProfit;
    });

    // Build holdings array and fetch live prices
    const holdings = [];
    for (const assetId in holdingsMap) {
      const h = holdingsMap[assetId];
      let currentPrice = null;
      let currentValue = null;
      let unrealizedProfit = null;
      let unrealizedProfitPercent = null;

      // ✅ Use centralised price fetcher (handles premium and fallback)
      if (h.ticker && h.ticker !== 'N/A') {
        currentPrice = await getStockPrice(h.ticker);
      }

      // If we have shares and a current price, compute real-time value
      if (currentPrice && h.totalShares > 0) {
        currentValue = h.totalShares * currentPrice;
        unrealizedProfit = currentValue - h.totalInvested;
        unrealizedProfitPercent = (unrealizedProfit / h.totalInvested) * 100;
      } else {
        // If no current price or no shares, fallback to expected profit
        currentValue = h.totalInvested + h.totalExpectedProfit;
        unrealizedProfit = h.totalExpectedProfit;
        unrealizedProfitPercent = (h.totalExpectedProfit / h.totalInvested) * 100;
      }

      holdings.push({
        assetId: h.assetId,
        name: h.name,
        ticker: h.ticker,
        type: h.type,
        totalInvested: h.totalInvested,
        totalExpectedProfit: h.totalExpectedProfit,
        totalShares: h.totalShares,
        currentPrice: currentPrice,
        currentValue: currentValue,
        unrealizedProfit: unrealizedProfit,
        unrealizedProfitPercent: unrealizedProfitPercent,
        allocationPercent: totalInvested > 0 ? (h.totalInvested / totalInvested) * 100 : 0,
      });

      totalRealizedProfit += h.totalExpectedProfit;
    }

    // Sort by totalInvested descending
    holdings.sort((a, b) => b.totalInvested - a.totalInvested);

    // Compute overall totals
    const totalCurrentValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalUnrealizedProfit = totalCurrentValue - totalInvested;
    const totalUnrealizedProfitPercent = totalInvested > 0 ? (totalUnrealizedProfit / totalInvested) * 100 : 0;

    res.json({
      totalInvested,
      totalExpectedProfit,
      totalValue: totalCurrentValue,
      totalUnrealizedProfit,
      totalUnrealizedProfitPercent,
      holdings,
    });
  } catch (err) {
    console.error('Portfolio error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

module.exports = router;