const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const response = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,JPY,CNY,NGN');
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
};