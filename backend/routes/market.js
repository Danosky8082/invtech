const express = require('express');
const axios = require('axios');
const { convertCurrency } = require('@sharmag44/currency-converter');
const router = express.Router();
const { getStockPrice } = require('../services/dataService');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const Parser = require('rss-parser');
const parser = new Parser();

// ==================== HELPER: MOCK NEWS ARRAY (FALLBACK) ====================
function getMockNewsArray(country) {
  const mockMap = {
    us: [
      { title: 'US markets rally on tech earnings', description: 'Tech stocks lead gains.', url: 'https://www.bloomberg.com/news/articles/2025-01-15/us-markets-rally', imageUrl: 'https://placehold.co/300x200?text=US+News' },
      { title: 'Fed signals rate cuts', description: 'Investors optimistic.', url: 'https://www.reuters.com/markets/us/fed-signals-rate-cuts-2025-01-15/', imageUrl: 'https://placehold.co/300x200?text=US+News' },
      { title: 'Inflation data cools', description: 'Consumer prices rise less than expected.', url: 'https://www.cnbc.com/2025/01/15/inflation-cools.html', imageUrl: 'https://placehold.co/300x200?text=US+News' }
    ],
    ng: [
      { title: 'NGX closes higher as banking stocks rally', description: 'Nigerian bourse sees gains.', url: 'https://punchng.com/ngx-closes-higher/', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' },
      { title: 'CBN holds interest rate', description: 'Policy supports economy.', url: 'https://guardian.ng/cbn-holds-rate/', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' },
      { title: 'Oil prices boost Naira', description: 'Crude exports increase.', url: 'https://businessday.ng/oil-prices-boost-naira/', imageUrl: 'https://placehold.co/300x200?text=Nigeria+News' }
    ],
    gb: [
      { title: 'FTSE 100 hits record high', description: 'Mining and oil stocks surge.', url: 'https://www.bbc.com/news/business/ftse-record', imageUrl: 'https://placehold.co/300x200?text=UK+News' },
      { title: 'Bank of England holds rates', description: 'Pound strengthens.', url: 'https://www.reuters.com/markets/uk/bank-of-england-holds-rates-2025-01-15/', imageUrl: 'https://placehold.co/300x200?text=UK+News' }
    ],
    ca: [
      { title: 'TSX rallies on energy stocks', description: 'Oil prices drive gains.', url: 'https://www.theglobeandmail.com/business/tsx-rallies', imageUrl: 'https://placehold.co/300x200?text=Canada+News' },
      { title: 'Bank of Canada holds key rate', description: 'Inflation moderates.', url: 'https://financialpost.com/boc-holds-rate', imageUrl: 'https://placehold.co/300x200?text=Canada+News' }
    ],
    au: [
      { title: 'ASX hits new peak', description: 'Mining giants lead.', url: 'https://www.afr.com/markets/asx-peak', imageUrl: 'https://placehold.co/300x200?text=Australia+News' },
      { title: 'RBA leaves cash rate unchanged', description: 'Aussie dollar firm.', url: 'https://www.abc.net.au/news/rba-rates', imageUrl: 'https://placehold.co/300x200?text=Australia+News' }
    ],
    in: [
      { title: 'Sensex rallies on IT stocks', description: 'Tech earnings boost.', url: 'https://economictimes.indiatimes.com/sensex-rallies', imageUrl: 'https://placehold.co/300x200?text=India+News' },
      { title: 'RBI keeps repo rate steady', description: 'Inflation under control.', url: 'https://www.business-standard.com/rbi-repo-rate', imageUrl: 'https://placehold.co/300x200?text=India+News' }
    ],
    cn: [
      { title: 'Shanghai Composite rises on tech rally', description: 'Chinese tech stocks lead.', url: 'https://www.scmp.com/business/shanghai-composite', imageUrl: 'https://placehold.co/300x200?text=China+News' },
      { title: 'PBOC holds interest rates steady', description: 'Central bank cites stable inflation.', url: 'https://www.caixinglobal.com/pboc-rates', imageUrl: 'https://placehold.co/300x200?text=China+News' }
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

// ==================== NEWS (RSS FEEDS) ====================
router.get('/news', async (req, res) => {
  const { country = 'us' } = req.query;

  // Map country to relevant RSS feeds
  const feedMap = {
    us: [
      'https://feeds.bloomberg.com/markets/news.rss',
      'https://finance.yahoo.com/news/rssindex'
    ],
    ng: [
      'https://punchng.com/feed/',
      'https://guardian.ng/business/feed/',
      'https://businessday.ng/feed/'
    ],
    gb: [
      'http://feeds.bbci.co.uk/news/business/rss.xml',
      'https://www.gov.uk/government/feed'
    ],
    ca: [
      'https://www.theglobeandmail.com/business/?service=rss',
      'https://financialpost.com/feed'
    ],
    au: [
      'https://www.afr.com/feed',
      'https://www.abc.net.au/news/business/feed.xml'
    ],
    in: [
      'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
      'https://www.business-standard.com/rss/business_stories_top_news.rss'
    ]
  };

  const feeds = feedMap[country] || feedMap.us;

  try {
    const allArticles = [];
    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        feed.items.forEach(item => {
          let imageUrl = null;
          if (item.enclosure?.url) imageUrl = item.enclosure.url;
          else if (item['media:content']?.$?.url) imageUrl = item['media:content'].$.url;
          else if (item['media:thumbnail']?.$?.url) imageUrl = item['media:thumbnail'].$.url;
          else if (item['content:encoded']) {
            const imgMatch = item['content:encoded'].match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) imageUrl = imgMatch[1];
          }
          if (!imageUrl) imageUrl = 'https://placehold.co/300x200?text=News';
          allArticles.push({
            title: item.title || 'Business News',
            description: item.contentSnippet || item.summary || 'Read more...',
            url: item.link || '#',
            imageUrl: imageUrl,
            publishDate: item.pubDate || new Date().toISOString(),
          });
        });
      } catch (feedErr) {
        console.error(`Failed to parse feed ${feedUrl}:`, feedErr.message);
      }
    }

    if (allArticles.length === 0) {
      return res.json(getMockNewsArray(country));
    }

    allArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    const latestArticles = allArticles.slice(0, 15);
    res.json(latestArticles);
  } catch (err) {
    console.error('RSS News error:', err.message);
    res.json(getMockNewsArray(country));
  }
});

// ==================== TREASURY YIELDS ====================
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

// ==================== STOCK QUOTE ====================
router.get('/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol format' });
  }
  try {
    const price = await getStockPrice(symbol);
    res.json({
      symbol,
      price,
      change: 0,
      changePercent: 0,
      volume: 0,
      note: price === 100.00 ? 'estimated (data unavailable)' : '',
    });
  } catch (err) {
    console.error('Stock fetch error:', err.message);
    res.json({ symbol, price: 100.00, change: 0, changePercent: 0, note: 'estimated' });
  }
});

module.exports = router;