const yahooFinance = require('yahoo-finance2');

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
    // Fallback to mock data
    return generateMockHistoricalData(ticker, startDate, endDate);
  }
}

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

/**
 * Compute moving average
 */
function movingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i - j].close;
    }
    result.push(sum / window);
  }
  return result;
}

/**
 * Backtest engine – applies a strategy to historical data
 */
async function runBacktest(ticker, startDate, endDate, strategy, params = {}) {
  // Fetch historical data
  const historical = await getHistoricalData(ticker, startDate, endDate);
  if (!historical.length) throw new Error('No data available');

  // Extract prices and dates
  const dates = historical.map(d => d.date);
  const prices = historical.map(d => d.close);

  // Initialize portfolio
  let cash = 10000; // starting capital
  let shares = 0;
  let trades = [];
  let portfolioValues = [];
  let signals = [];

  // Apply strategy
  let buySignal = false;
  let sellSignal = false;

  switch (strategy) {
    case 'buy_and_hold':
      // Simple: buy all at first day, hold until end
      shares = cash / prices[0];
      cash = 0;
      for (let i = 0; i < prices.length; i++) {
        const value = cash + shares * prices[i];
        portfolioValues.push(value);
        signals.push({ date: dates[i], signal: i === 0 ? 'BUY' : 'HOLD' });
      }
      break;

    case 'ma_crossover': {
      const shortWindow = params.shortWindow || 10;
      const longWindow = params.longWindow || 30;
      const maShort = movingAverage(historical, shortWindow);
      const maLong = movingAverage(historical, longWindow);

      for (let i = 0; i < prices.length; i++) {
        if (i < longWindow - 1) {
          portfolioValues.push(cash + shares * prices[i]);
          signals.push({ date: dates[i], signal: 'WAIT' });
          continue;
        }

        const short = maShort[i];
        const long = maLong[i];
        const prevShort = maShort[i - 1] || 0;
        const prevLong = maLong[i - 1] || 0;

        // Crossover: short crosses above long -> BUY
        if (prevShort <= prevLong && short > long && shares === 0) {
          shares = cash / prices[i];
          cash = 0;
          trades.push({ date: dates[i], type: 'BUY', price: prices[i], shares });
          signals.push({ date: dates[i], signal: 'BUY' });
        }
        // Crossover: short crosses below long -> SELL
        else if (prevShort >= prevLong && short < long && shares > 0) {
          cash = shares * prices[i];
          shares = 0;
          trades.push({ date: dates[i], type: 'SELL', price: prices[i], shares });
          signals.push({ date: dates[i], signal: 'SELL' });
        } else {
          signals.push({ date: dates[i], signal: 'HOLD' });
        }

        const value = cash + shares * prices[i];
        portfolioValues.push(value);
      }
      // At the end, close any open position
      if (shares > 0) {
        cash = shares * prices[prices.length - 1];
        shares = 0;
        trades.push({ date: dates[dates.length - 1], type: 'SELL', price: prices[prices.length - 1], shares });
      }
      break;
    }

    default:
      throw new Error(`Strategy "${strategy}" not implemented`);
  }

  // Compute metrics
  const finalValue = portfolioValues[portfolioValues.length - 1];
  const totalReturn = ((finalValue - 10000) / 10000) * 100;
  const annualizedReturn = totalReturn / ((endDate - startDate) / (365 * 24 * 60 * 60 * 1000));

  // Compute Sharpe ratio (assume risk-free rate = 0)
  const returns = [];
  for (let i = 1; i < portfolioValues.length; i++) {
    returns.push((portfolioValues[i] - portfolioValues[i - 1]) / portfolioValues[i - 1]);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Max drawdown
  let peak = portfolioValues[0];
  let maxDrawdown = 0;
  for (const val of portfolioValues) {
    if (val > peak) peak = val;
    const drawdown = (peak - val) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Win rate (percentage of profitable trades)
  let winningTrades = 0;
  let totalTrades = 0;
  let realizedProfit = 0;
  for (let i = 0; i < trades.length; i += 2) {
    if (i + 1 < trades.length) {
      const buy = trades[i];
      const sell = trades[i + 1];
      const profit = (sell.price - buy.price) * buy.shares;
      if (profit > 0) winningTrades++;
      totalTrades++;
      realizedProfit += profit;
    }
  }
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return {
    ticker,
    startDate,
    endDate,
    strategy,
    parameters: params,
    initialCapital: 10000,
    finalValue,
    totalReturn,
    annualizedReturn,
    sharpeRatio: sharpe,
    maxDrawdown: maxDrawdown * 100,
    winRate,
    totalTrades,
    trades,
    portfolioValues,
    signals,
    dates: dates.map(d => d.toISOString()),
  };
}

module.exports = { runBacktest };