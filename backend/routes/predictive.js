const express = require('express');
const axios = require('axios');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// ==================== MOCK DATA GENERATOR ====================
function generateMockData(ticker) {
  const basePrice = 100 + (Math.random() * 50);
  const prices = [];
  const dates = [];
  const endDate = new Date();
  let price = basePrice;
  for (let i = 90; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
    // Random walk with drift
    const drift = (Math.random() - 0.5) * 0.02;
    const noise = (Math.random() - 0.5) * 0.05;
    price = price * (1 + drift + noise);
    if (price < 0.01) price = 0.01;
    prices.push(price);
  }
  return { prices, dates };
}

// ==================== HELPERS ====================
function calculateMovingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = 0; j < window; j++) sum += data[i - j];
    result.push(sum / window);
  }
  return result;
}

function calculateVolatility(prices) {
  if (prices.length === 0) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  return Math.sqrt(variance);
}

// ==================== FORECAST ====================
router.get('/forecast/:ticker', auth, async (req, res) => {
  const { ticker } = req.params;
  const { days = 30, scenario = 'neutral' } = req.query;

  try {
    // Generate mock data (realistic simulation)
    const { prices, dates } = generateMockData(ticker);
    const ma7 = calculateMovingAverage(prices, 7);
    const ma30 = calculateMovingAverage(prices, 30);
    const volatility = calculateVolatility(prices.slice(-30));
    const currentPrice = prices[prices.length - 1];
    
    const last10Prices = prices.slice(-10);
    const avgPrice = last10Prices.reduce((a, b) => a + b, 0) / last10Prices.length;
    const trend = (currentPrice - avgPrice) / avgPrice;

    // ----- Adjust forecast based on scenario -----
    // volatilityMultiplier: wider bands for pessimistic, narrower for optimistic
    let volatilityMultiplier = 1;
    if (scenario === 'optimistic') volatilityMultiplier = 0.5;
    else if (scenario === 'pessimistic') volatilityMultiplier = 1.5;

    // ----- Compute forecast for the requested `days` horizon -----
    const forecastDates = [];
    const forecastPrices = [];
    const forecastUpper = [];
    const forecastLower = [];

    // Convert days to integer
    const forecastDays = parseInt(days, 10) || 30;

    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      forecastDates.push(futureDate.toISOString().split('T')[0]);

      const projectedPrice = currentPrice * (1 + (trend * (i / forecastDays)));
      forecastPrices.push(projectedPrice);
      forecastUpper.push(projectedPrice * (1 + volatility * volatilityMultiplier * 0.5));
      forecastLower.push(projectedPrice * (1 - volatility * volatilityMultiplier * 0.5));
    }

    // ----- Compute additional metrics (annualized return, Sharpe ratio, max drawdown) -----
    const returns = prices.map((p, i) => (i > 0) ? (p - prices[i-1]) / prices[i-1] : 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 252; // 252 trading days in a year
    const sharpeRatio = annualizedReturn / (volatility * Math.sqrt(252));
    
    // Max drawdown
    let maxDrawdown = 0;
    let peak = prices[0];
    for (const p of prices) {
      if (p > peak) peak = p;
      const drawdown = (peak - p) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // ----- Build response -----
    res.json({
      ticker,
      currentPrice,
      volatility: volatility * 100,
      trend: trend * 100,
      isReal: false,
      note: 'Simulated data (real data unavailable)',
      historical: {
        dates: dates.slice(-30),
        prices: prices.slice(-30),
        ma7: ma7.slice(-30),
        ma30: ma30.slice(-30),
      },
      forecast: {
        dates: forecastDates,
        prices: forecastPrices,
        upper: forecastUpper,
        lower: forecastLower,
      },
      recommendation: {
        signal: trend > 0.02 ? 'BUY' : trend < -0.02 ? 'SELL' : 'HOLD',
        confidence: (1 - volatility) > 0.5 ? 'High' : 'Medium',
      },
      // 👇 NEW: metrics
      metrics: {
        annualizedReturn: (annualizedReturn * 100).toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2),
        maxDrawdown: (maxDrawdown * 100).toFixed(2),
      },
    });
  } catch (err) {
    console.error('Forecast error:', err.message);
    // Fallback response
    res.json({
      ticker,
      currentPrice: 100.00,
      volatility: 2.0,
      trend: 0,
      isReal: false,
      historical: { dates: [], prices: [], ma7: [], ma30: [] },
      forecast: { dates: [], prices: [], upper: [], lower: [] },
      recommendation: { signal: 'HOLD', confidence: 'Low' },
      note: 'Data temporarily unavailable',
      metrics: {
        annualizedReturn: '0.00',
        sharpeRatio: '0.00',
        maxDrawdown: '0.00',
      },
    });
  }
});

// ==================== SENTIMENT ====================
router.get('/sentiment', auth, async (req, res) => {
  const { country = 'us' } = req.query;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  if (!GNEWS_API_KEY) {
    return res.json({
      sentiment: 'neutral',
      score: 0,
      summary: 'No news data available',
      articles: []
    });
  }

  try {
    const apiUrl = `https://gnews.io/api/v4/top-headlines?country=${country}&category=business&apikey=${GNEWS_API_KEY}`;
    const response = await axios.get(apiUrl, { timeout: 8000 });
    const articles = response.data.articles || [];

    const positiveWords = ['surge', 'rally', 'gain', 'record', 'high', 'profit', 'growth', 'bullish', 'soar'];
    const negativeWords = ['fall', 'drop', 'decline', 'low', 'loss', 'bearish', 'crash', 'slump', 'risk'];

    let score = 0;
    articles.slice(0, 10).forEach(article => {
      const text = (article.title + ' ' + article.description || '').toLowerCase();
      positiveWords.forEach(word => { if (text.includes(word)) score += 0.5; });
      negativeWords.forEach(word => { if (text.includes(word)) score -= 0.5; });
    });

    let sentiment = 'neutral';
    if (score > 1) sentiment = 'positive';
    else if (score < -1) sentiment = 'negative';

    const formattedArticles = articles.slice(0, 5).map(a => ({
      title: a.title || 'No title',
      url: a.url || '#',
      imageUrl: a.image || 'https://placehold.co/300x200?text=News',
      source: a.source?.name || 'Unknown',
    }));

    res.json({
      sentiment,
      score: score.toFixed(2),
      summary: sentiment === 'positive' ? 'Market sentiment appears positive' :
               sentiment === 'negative' ? 'Market sentiment appears negative' :
               'Market sentiment is neutral',
      articles: formattedArticles,
    });
  } catch (err) {
    console.error('Sentiment error:', err.message);
    res.json({ sentiment: 'neutral', score: 0, summary: 'Sentiment data unavailable', articles: [] });
  }
});

// ==================== RISK PROFILE ====================
router.get('/risk-profile', auth, async (req, res) => {
  try {
    await prisma.$connect();
    const history = await prisma.userSimulation.findMany({
      where: { userId: req.user.id },
      include: { 
        asset: { select: { name: true, type: true, riskLevel: true } }
      },
    });

    if (!history || history.length === 0) {
      return res.json({
        riskTolerance: 'medium',
        recommendedAllocation: { stocks: 60, bonds: 30, crypto: 5, cash: 5 },
        message: 'Start simulating to get personalized recommendations!'
      });
    }

    const riskLevels = history.map(s => s.asset?.riskLevel || 'medium');
    const riskScore = riskLevels.reduce((acc, level) => {
      if (level === 'high') return acc + 3;
      if (level === 'medium') return acc + 2;
      return acc + 1;
    }, 0);
    const avgRisk = riskScore / riskLevels.length;

    let riskTolerance = 'medium';
    let allocation = { stocks: 60, bonds: 30, crypto: 5, cash: 5 };

    if (avgRisk > 2.3) {
      riskTolerance = 'aggressive';
      allocation = { stocks: 70, bonds: 15, crypto: 10, cash: 5 };
    } else if (avgRisk < 1.7) {
      riskTolerance = 'conservative';
      allocation = { stocks: 40, bonds: 45, crypto: 5, cash: 10 };
    }

    res.json({
      riskTolerance,
      recommendedAllocation: allocation,
      message: `Based on your investment history, you appear to be ${riskTolerance}.`
    });
  } catch (err) {
    console.error('Risk profile error:', err.message);
    res.json({
      riskTolerance: 'medium',
      recommendedAllocation: { stocks: 60, bonds: 30, crypto: 5, cash: 5 },
      message: 'Unable to calculate risk profile. Please try again later.'
    });
  }
});

module.exports = router;