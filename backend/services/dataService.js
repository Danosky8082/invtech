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