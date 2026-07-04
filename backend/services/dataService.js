// ✅ Correct import for CommonJS
const yahooFinance = require('yahoo-finance2').default;

let alphaVantage = null;
try {
  if (process.env.ALPHAVANTAGE_KEY) {
    alphaVantage = require('alphavantage')({ key: process.env.ALPHAVANTAGE_KEY });
  }
} catch (e) {
  console.warn('Alpha Vantage not available');
}

async function getStockPrice(symbol) {
  console.log(`[getStockPrice] Fetching ${symbol}...`);

  // Try Alpha Vantage first (if key exists)
  if (alphaVantage) {
    try {
      console.log(`[getStockPrice] Trying Alpha Vantage for ${symbol}`);
      const avData = await alphaVantage.quote(symbol);
      const price = parseFloat(avData['Global Quote']['05. price']);
      if (price && price > 0) {
        console.log(`[getStockPrice] Alpha Vantage: ${symbol} -> $${price}`);
        return price;
      }
    } catch (e) {
      console.log(`[getStockPrice] Alpha Vantage failed for ${symbol}:`, e.message);
    }
  }

  // Fallback to Yahoo Finance
  try {
    console.log(`[getStockPrice] Trying Yahoo for ${symbol}`);
    const quote = await yahooFinance.quote(symbol);
    console.log(`[getStockPrice] Yahoo quote:`, quote);
    if (quote && quote.regularMarketPrice) {
      console.log(`[getStockPrice] Yahoo: ${symbol} -> $${quote.regularMarketPrice}`);
      return quote.regularMarketPrice;
    } else {
      console.log(`[getStockPrice] Yahoo returned no price for ${symbol}`);
    }
  } catch (err) {
    console.error(`[getStockPrice] Yahoo Finance error for ${symbol}:`, err.message);
  }

  // Ultimate fallback
  console.warn(`[getStockPrice] No price for ${symbol}, using fallback 100.00`);
  return 100.00;
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
    console.error('Yahoo Finance historical error:', err.message);
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

module.exports = { getStockPrice, getHistoricalData };