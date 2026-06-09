const express = require('express');
const axios = require('axios');
const { convertCurrency } = require('@sharmag44/currency-converter');
const yahooFinance = require('yahoo-finance2').default;
const router = express.Router();

// ==================== HELPER: MOCK NEWS ARRAY (FALLBACK) ====================
function getMockNewsArray(country) {
  const mockMap = {
    us: [
      { title: 'US markets rally on tech earnings', description: 'Tech stocks lead gains.', url: '#', imageUrl: 'https://placehold.co/300x200?text=US+News' },
      { title: 'Fed signals rate cuts', description: 'Investors optimistic.', url: '#', imageUrl: 'https://placehold.co/300x200?text=US+News' },
      { title: 'Inflation data cools', description: 'Consumer prices rise less than expected.', url: '#', imageUrl: 'https://placehold.co/300x200?text=US+News' }
    ],
    ng: [
      { title: 'NGX closes higher as banking stocks rally', description: 'Nigerian bourse sees gains.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' },
      { title: 'CBN holds interest rate', description: 'Policy supports economy.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' },
      { title: 'Oil prices boost Naira', description: 'Crude exports increase.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' }
    ],
    gb: [
      { title: 'FTSE 100 hits record high', description: 'Mining and oil stocks surge.', url: '#', imageUrl: 'https://placehold.co/300x200?text=UK+News' },
      { title: 'Bank of England holds rates', description: 'Pound strengthens.', url: '#', imageUrl: 'https://placehold.co/300x200?text=UK+News' }
    ],
    ca: [
      { title: 'TSX rallies on energy stocks', description: 'Oil prices drive gains.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Canada+News' },
      { title: 'Bank of Canada holds key rate', description: 'Inflation moderates.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Canada+News' }
    ],
    au: [
      { title: 'ASX hits new peak', description: 'Mining giants lead.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Australia+News' },
      { title: 'RBA leaves cash rate unchanged', description: 'Aussie dollar firm.', url: '#', imageUrl: 'https://placehold.co/300x200?text=Australia+News' }
    ],
    in: [
      { title: 'Sensex rallies on IT stocks', description: 'Tech earnings boost.', url: '#', imageUrl: 'https://placehold.co/300x200?text=India+News' },
      { title: 'RBI keeps repo rate steady', description: 'Inflation under control.', url: '#', imageUrl: 'https://placehold.co/300x200?text=India+News' }
    ],
    cn: [
      { title: 'Shanghai Composite rises on tech rally', description: 'Chinese tech stocks lead.', url: '#', imageUrl: 'https://placehold.co/300x200?text=China+News' },
      { title: 'PBOC holds interest rates steady', description: 'Central bank cites stable inflation.', url: '#', imageUrl: 'https://placehold.co/300x200?text=China+News' }
    ]
  };
  return mockMap[country] || mockMap.us;
}

// ==================== EXCHANGE RATE ====================
router.get('/exchange-rate', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,JPY,CNY,NGN',
      { timeout: 8000 }
    );
    if (response.data && response.data.rates) {
      return res.json({ base: 'USD', rates: response.data.rates, timestamp: response.data.date });
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.error('Exchange rate error:', err.message);
    // Fallback rates (approximate)
    res.json({
      base: 'USD',
      rates: { EUR: 0.92, GBP: 0.79, CAD: 1.37, JPY: 147.5, CNY: 7.25, NGN: 1520 },
      note: 'Fallback rates'
    });
  }
});

// ==================== COUNTRY DETECTION ====================
router.get('/detect-country', async (req, res) => {
  try {
    const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
    const code = response.data.country_code?.toLowerCase();
    const supported = ['us', 'ng', 'gb', 'ca', 'au', 'in', 'cn'];
    if (code && supported.includes(code)) {
      return res.json({ country: code });
    }
    res.json({ country: 'us' });
  } catch (err) {
    console.error('Country detection error:', err.message);
    res.json({ country: 'us' });
  }
});

// ==================== NEWS (ALWAYS RETURNS ARRAY) ====================
router.get('/news', async (req, res) => {
  const { country = 'us' } = req.query;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  // If no API key, immediately return mock array
  if (!GNEWS_API_KEY) {
    console.log('No GNews API key – using mock news array');
    return res.json(getMockNewsArray(country));
  }

  try {
    const apiUrl = `https://gnews.io/api/v4/top-headlines?country=${country}&category=business&apikey=${GNEWS_API_KEY}`;
    const response = await axios.get(apiUrl, { timeout: 8000 });
    const articles = response.data.articles;

    // Validate that we have an array
    if (!articles || !Array.isArray(articles)) {
      throw new Error('GNews did not return an array');
    }

    if (articles.length === 0) {
      // No articles – return mock
      return res.json(getMockNewsArray(country));
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
    // Always return an array on error
    return res.json(getMockNewsArray(country));
  }
});

// ==================== TREASURY YIELDS (BONDS) ====================
router.get('/treasury-yields', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/avg_interest_rates',
      { timeout: 8000 }
    );
    const data = response.data.data;
    const tenYear = data.find(record => record.term === '10-year');
    res.json({ tenYearYield: tenYear ? parseFloat(tenYear.avg_interest_rate_amt) : 4.2 });
  } catch (err) {
    console.error('Treasury API error:', err.message);
    res.json({ tenYearYield: 4.2, note: 'Fallback' });
  }
});

// ==================== STOCK QUOTE (Yahoo Finance) ====================
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
    // Fallback to estimated price – prevents frontend errors
    res.json({ symbol, price: 100.00, change: 0, changePercent: 0, note: 'estimated' });
  }
});

module.exports = router;