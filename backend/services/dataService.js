const yahooFinance = require('yahoo-finance2');

// Try to load Alpha Vantage if key is available
let alphaVantage = null;
try {
  if (process.env.ALPHAVANTAGE_KEY) {
    alphaVantage = require('alphavantage')({ key: process.env.ALPHAVANTAGE_KEY });
  }
} catch (e) {
  console.warn('Alpha Vantage not available');
}

/**
 * Fetch current stock price for a symbol
 * @param {string} symbol - Stock ticker
 * @returns {Promise<number|null>} - Current price or null if unavailable
 */
async function getStockPrice(symbol) {
  // Try Alpha Vantage first if available
  if (alphaVantage) {
    try {
      const avData = await alphaVantage.quote(symbol);
      const price = avData['Global Quote']['05. price'];
      if (price) return parseFloat(price);
    } catch (e) {
      console.log('Alpha Vantage failed, falling back to Yahoo for', symbol);
    }
  }
  // Fallback to Yahoo
  async function getStockPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote.regularMarketPrice || null;
  } catch {
    return null;
  }
}
}

/**
 * Fetch historical data for a ticker within a date range
 */
async function getHistoricalData(ticker, startDate, endDate) {
  try {
    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });
    return result;
  } catch (err) {
    console.error('Yahoo Finance error:', err.message);
    return generateMockHistoricalData(ticker, startDate, endDate);
  }
}

/**
 * Generate mock historical data (fallback)
 */
function generateMockHistoricalData(ticker, startDate, endDate) {
  const data = [];
  const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  let price = 100;
  for (let i = days; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.5) * 4;
    price = price * (1 + change / 100);
    if (price < 1) price = 1;
    data.push({
      date: date,
      close: price,
      open: price * (1 + (Math.random() - 0.5) * 0.02),
      high: price * (1 + Math.random() * 0.03),
      low: price * (1 - Math.random() * 0.03),
      volume: Math.floor(Math.random() * 1000000),
    });
  }
  return data;
}

module.exports = { getHistoricalData, getStockPrice };