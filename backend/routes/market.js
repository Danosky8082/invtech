const express = require('express');
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const Parser = require('rss-parser');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();
const parser = new Parser();

// ==================== EXCHANGE RATES (Frankfurter – reliable) ====================
router.get('/exchange-rate', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,JPY,CNY,NGN',
      { timeout: 10000 }  // 10 seconds timeout
    );
    if (response.data && response.data.rates) {
      return res.json({ base: 'USD', rates: response.data.rates, timestamp: response.data.date });
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.error('Exchange rate error:', err.message);
    // Reliable fallback rates (approximate but realistic)
    res.json({
      base: 'USD',
      rates: { EUR: 0.92, GBP: 0.79, CAD: 1.37, JPY: 147.5, CNY: 7.25, NGN: 1520 },
      note: 'Fallback rates (API timeout)'
    });
  }
});

// ==================== COUNTRY DETECTION (ipapi.co – free, no key) ====================
router.get('/detect-country', async (req, res) => {
  try {
    const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
    const code = response.data.country_code?.toLowerCase();
    const supported = ['us', 'ng', 'gb', 'ca', 'au', 'in', 'cn'];
    if (code && supported.includes(code)) return res.json({ country: code });
    res.json({ country: 'us' });
  } catch (err) {
    console.error('Country detection error:', err.message);
    res.json({ country: 'us' });
  }
});

// ==================== MOCK NEWS (fallback if GNews fails) ====================
const mockNewsByCountry = {
  us: [{ title: 'US markets rally', description: 'Tech leads', url: '#', imageUrl: 'https://placehold.co/300x200?text=US' }],
  ng: [{ title: 'NGX closes higher', description: 'Banking stocks', url: '#', imageUrl: 'https://placehold.co/300x200?text=NG' }],
  gb: [{ title: 'FTSE 100 hits record', description: 'Mining surges', url: '#', imageUrl: 'https://placehold.co/300x200?text=UK' }],
  ca: [{ title: 'TSX rallies', description: 'Energy leads', url: '#', imageUrl: 'https://placehold.co/300x200?text=CA' }],
  au: [{ title: 'ASX hits peak', description: 'Iron ore', url: '#', imageUrl: 'https://placehold.co/300x200?text=AU' }],
  in: [{ title: 'Sensex rallies', description: 'IT stocks', url: '#', imageUrl: 'https://placehold.co/300x200?text=IN' }],
  cn: [{ title: 'Shanghai Composite rises', description: 'Tech rally', url: '#', imageUrl: 'https://placehold.co/300x200?text=CN' }]
};

// ==================== REAL NEWS (GNews API) ====================
router.get('/news', async (req, res) => {
  const { country = 'us' } = req.query;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  // Mock data (always an array)
  const getMockData = (countryCode) => {
    const mock = {
      us: [{ title: 'US markets rally', description: 'Tech leads', url: '#', imageUrl: 'https://placehold.co/300x200?text=US' }],
      ng: [{ title: 'NGX closes higher', description: 'Banking stocks', url: '#', imageUrl: 'https://placehold.co/300x200?text=NG' }],
      gb: [{ title: 'FTSE 100 hits record', description: 'Mining surges', url: '#', imageUrl: 'https://placehold.co/300x200?text=UK' }],
      ca: [{ title: 'TSX rallies', description: 'Energy leads', url: '#', imageUrl: 'https://placehold.co/300x200?text=CA' }],
      au: [{ title: 'ASX hits peak', description: 'Iron ore', url: '#', imageUrl: 'https://placehold.co/300x200?text=AU' }],
      in: [{ title: 'Sensex rallies', description: 'IT stocks', url: '#', imageUrl: 'https://placehold.co/300x200?text=IN' }],
      cn: [{ title: 'Shanghai Composite rises', description: 'Tech rally', url: '#', imageUrl: 'https://placehold.co/300x200?text=CN' }]
    };
    return mock[countryCode] || mock.us;
  };

  // If no API key, return mock array immediately
  if (!GNEWS_API_KEY) {
    console.log('GNews API key missing – returning mock news');
    return res.json(getMockData(country));
  }

  try {
    const apiUrl = `https://gnews.io/api/v4/top-headlines?country=${country}&category=business&apikey=${GNEWS_API_KEY}`;
    const response = await axios.get(apiUrl, { timeout: 8000 });
    const articles = response.data.articles;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      throw new Error('No articles array');
    }
    const formatted = articles.slice(0, 15).map(a => ({
      title: a.title || 'Business News',
      description: a.description || 'Read more...',
      url: a.url || '#',
      imageUrl: a.image || 'https://placehold.co/300x200?text=News',
      publishDate: a.publishedAt || new Date().toISOString()
    }));
    return res.json(formatted);
  } catch (err) {
    console.error('GNews error:', err.message);
    // Return mock array on error
    return res.json(getMockData(country));
  }
});

// ==================== REAL STOCK QUOTE (Yahoo Finance – reliable) ====================
router.get('/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol format' });
  }
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote.regularMarketPrice) throw new Error('No price');
    res.json({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0
    });
  } catch (err) {
    console.error(`Yahoo Finance error for ${symbol}:`, err.message);
    // Fallback to estimated price (prevents frontend errors)
    res.json({ symbol, price: 100.00, change: 0, changePercent: 0, note: 'estimated' });
  }
});

// ==================== TREASURY YIELDS (US Treasury API) ====================
router.get('/treasury-yields', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/avg_interest_rates',
      { timeout: 5000 }
    );
    const tenYear = response.data.data.find(r => r.term === '10-year');
    res.json({ tenYearYield: tenYear ? parseFloat(tenYear.avg_interest_rate_amt) : 4.2 });
  } catch (err) {
    console.error('Treasury API error:', err.message);
    res.json({ tenYearYield: 4.2, note: 'Fallback' });
  }
});

module.exports = router;