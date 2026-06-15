const express = require('express');
const router = express.Router();

router.get('/exchange-rate', (req, res) => {
  res.json({ rates: { EUR: 0.92, GBP: 0.79, CAD: 1.37, JPY: 147.5, CNY: 7.25, NGN: 1520 } });
});

router.get('/news', (req, res) => {
  res.json([{ title: 'Test news', description: 'News endpoint works', url: '#', imageUrl: '' }]);
});

router.get('/detect-country', (req, res) => {
  res.json({ country: 'us' });
});

module.exports = router;