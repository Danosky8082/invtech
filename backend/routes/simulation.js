const express = require('express');
const axios = require('axios');
const { convertCurrency } = require('@sharmag44/currency-converter');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// ==================== FALLBACK EXCHANGE RATES ====================
const FALLBACK_RATES = {
  USD: 1,
  NGN: 1520,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  JPY: 147.5,
  CNY: 7.25
};

// ==================== HELPER: CONVERT WITH FALLBACK ====================
async function convertWithFallback(fromCurrency, toCurrency, amount) {
  if (fromCurrency === toCurrency) return amount;
  try {
    const result = await convertCurrency(fromCurrency, toCurrency, amount);
    return result.amount;
  } catch (err) {
    console.log(`Currency conversion fallback: ${fromCurrency} -> ${toCurrency}`);
    const fromRate = FALLBACK_RATES[fromCurrency] || 1;
    const toRate = FALLBACK_RATES[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  }
}

// ==================== HELPER: FORMAT CURRENCY ====================
function formatCurrency(value, decimals = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

// ==================== HELPER: GENERATE ADVICE ====================
function generateAdvice(asset, amountInUserCurrency, userCurrency, userSymbol, expectedReturnPercent, livePriceInUserCurrency) {
  const { name, type, riskLevel, expectedReturn, ticker } = asset;
  const percentageReturn = (expectedReturn * 100).toFixed(1);
  
  let advice = '';

  // Risk explanation
  if (riskLevel === 'high') {
    advice = `⚠️ <strong>High risk</strong> – This asset can go up or down quickly. You could lose a large portion of your investment. ` +
             `Only invest money you can afford to lose. Historically, high-risk assets like ${name} have higher potential returns (around ${percentageReturn}% expected), but they also experience sharp drops. ` +
             `Consider allocating only a small part (5-10%) of your portfolio to high-risk investments.`;
  } else if (riskLevel === 'medium') {
    advice = `📊 <strong>Medium risk</strong> – ${name} offers a balance between growth and safety. Expected return ~${percentageReturn}%. ` +
             `Medium-risk assets are suitable for goals 3-7 years away. They can still lose value in bad markets, but usually less than high-risk stocks. ` +
             `For a novice, consider putting 30-50% of your investment money into medium-risk assets like diversified ETFs.`;
  } else {
    advice = `✅ <strong>Low risk</strong> – ${name} is designed to preserve your capital. Expected return ~${percentageReturn}%. ` +
             `These are ideal for emergency funds or short-term goals (<3 years). You won't get rich fast, but you also won't lose sleep. ` +
             `They protect against inflation but may not beat it by much.`;
  }

  // Asset‑type specific advice
  if (type === 'stock') {
    advice += ` 📈 <strong>About stocks</strong>: Individual stocks like ${name} can be volatile. Even great companies can fall 30-50% during recessions. ` +
              `Novices often benefit from <strong>index funds</strong> (e.g., SPY, VTI) that spread risk across hundreds of companies. ` +
              `<a href="https://www.investopedia.com/terms/i/indexfund.asp" target="_blank">Index funds explained</a>.`;
  } else if (type === 'bond') {
    advice += ` 🏦 <strong>About bonds</strong>: Bonds are loans to governments or corporations. They pay interest and return your principal at maturity. ` +
              `They are safer than stocks but offer lower returns. Rising interest rates can cause bond prices to fall temporarily. ` +
              `A mix of bonds and stocks (e.g., 60% stocks / 40% bonds) is a classic beginner portfolio. ` +
              `<a href="https://www.bogleheads.org/wiki/Bogleheads%C2%AE_investment_philosophy" target="_blank">Learn about asset allocation</a>.`;
  } else if (type === 'etf') {
    advice += ` 📊 <strong>About ETFs</strong>: Exchange-Traded Funds are baskets of stocks or bonds. They give you instant diversification in one trade. ` +
              `For most beginners, a low-cost S&P 500 ETF (like VOO) is a great starting point. They are less risky than individual stocks. ` +
              `<a href="https://www.nerdwallet.com/article/investing/what-is-an-etf" target="_blank">ETF basics</a>.`;
  } else if (type === 'crypto') {
    advice += ` ₿ <strong>About crypto</strong>: Cryptocurrencies are extremely volatile and speculative. They are not backed by any government or company. ` +
              `Only invest what you would take to a casino. Most financial advisors recommend less than 5% of your portfolio in crypto. ` +
              `<a href="https://www.investopedia.com/terms/c/cryptocurrency.asp" target="_blank">What is cryptocurrency?</a>.`;
  }

  // Amount‑specific advice (now in user's currency)
  const formattedAmount = formatCurrency(amountInUserCurrency);
  if (amountInUserCurrency > 10000) {
    advice += ` 💰 <strong>Large investment</strong>: ${userSymbol}${formattedAmount} ${userCurrency} is a significant sum. Never put all your eggs in one basket. ` +
              `Consider splitting this amount across 3-5 different assets or sectors. ` +
              `<a href="https://www.investopedia.com/terms/d/diversification.asp" target="_blank">Diversification explained</a>.`;
  } else if (amountInUserCurrency < 500) {
    advice += ` 💵 <strong>Small investment</strong>: Even small amounts grow with time and compounding. The habit of investing regularly is more important than the amount. ` +
              `Look into "dollar cost averaging" – investing a fixed amount every month. ` +
              `<a href="https://www.investopedia.com/terms/d/dollarcostaveraging.asp" target="_blank">Learn DCA</a>.`;
  }

  // Diversification tip
  advice += ` 🌍 <strong>Diversification tip</strong>: Don't put all your money into one asset. A simple starter portfolio could be:<br/>
             &nbsp;&nbsp;- 60% in a broad stock ETF (e.g., VTI or SPY)<br/>
             &nbsp;&nbsp;- 30% in bonds (e.g., BND)<br/>
             &nbsp;&nbsp;- 10% in cash or high‑interest savings.<br/>
             <a href="https://www.bogleheads.org/wiki/Three-fund_portfolio" target="_blank">Read more about the three-fund portfolio</a>.`;

  // Live price (if available) in user's currency
  if (livePriceInUserCurrency) {
    advice += `<br/>📊 <strong>Current market price</strong>: ${userSymbol}${formatCurrency(livePriceInUserCurrency)} ${userCurrency} (real‑time). This helps you decide if the asset is overvalued or undervalued.`;
  }

  // External learning resources
  advice += `<br/><br/>📚 <strong>Continue learning</strong>: 
             <a href="https://www.investopedia.com/terms/r/risktolerance.asp" target="_blank">Risk Tolerance</a> | 
             <a href="https://www.bogleheads.org/wiki/Getting_started" target="_blank">Bogleheads Getting Started</a> | 
             <a href="https://finance.yahoo.com/quote/${ticker || 'SPY'}" target="_blank">Yahoo Finance – ${ticker || name}</a>`;

  return advice;
}

// ==================== HELPER: COMPUTE PROJECTIONS ====================
function computeProjections(usdAmount, expectedReturn, yearsArray, toCurrency, exchangeRateFromUSD) {
  const projections = [];
  for (const years of yearsArray) {
    const futureValueUSD = usdAmount * Math.pow(1 + expectedReturn, years);
    const profitUSD = futureValueUSD - usdAmount;
    let futureValue = futureValueUSD;
    let profit = profitUSD;
    if (toCurrency !== 'USD' && exchangeRateFromUSD) {
      futureValue = futureValueUSD * exchangeRateFromUSD;
      profit = profitUSD * exchangeRateFromUSD;
    }
    projections.push({
      years,
      futureValue,
      profit,
      percentageReturn: ((futureValueUSD / usdAmount - 1) * 100).toFixed(1)
    });
  }
  return projections;
}

// ==================== GET ASSETS ====================
router.get('/assets', auth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      select: { id: true, name: true, type: true, ticker: true, expectedReturn: true, riskLevel: true }
    });
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== POST SIMULATE ====================
router.post('/simulate', auth, async (req, res) => {
  const { assetId, amountInvested, currency = 'USD' } = req.body;
  const userId = req.user.id;

  if (!assetId || !amountInvested || amountInvested <= 0) {
    return res.status(400).json({ msg: 'Invalid asset or amount' });
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });

    // Step 1: Convert amount to USD (internal) using fallback
    let usdAmount = amountInvested;
    if (currency !== 'USD') {
      usdAmount = await convertWithFallback(currency, 'USD', amountInvested);
    }

    // Step 2: Calculate profit in USD
    const profitUSD = usdAmount * asset.expectedReturn;
    const totalReturnUSD = usdAmount + profitUSD;

    // Step 3: Fetch live price (if available) before storing
    let livePrice = null;
    let livePriceInUserCurrency = null;
    if (asset.ticker) {
      try {
        const stockRes = await axios.get(`http://localhost:${process.env.PORT || 5000}/api/market/stock/${asset.ticker}`);
        livePrice = stockRes.data.price;
        if (currency !== 'USD' && livePrice) {
          livePriceInUserCurrency = await convertWithFallback('USD', currency, livePrice);
        } else {
          livePriceInUserCurrency = livePrice;
        }
      } catch (err) { /* silent */ }
    }

    // Step 4: Convert results back to user's currency using fallback
    let profitDisplay = profitUSD;
    let totalDisplay = totalReturnUSD;
    if (currency !== 'USD') {
      profitDisplay = await convertWithFallback('USD', currency, profitUSD);
      totalDisplay = await convertWithFallback('USD', currency, totalReturnUSD);
    }

    // Step 5: Store simulation in database (always in USD)
    await prisma.userSimulation.create({
  data: {
    userId,
    assetId,
    amountInvested: usdAmount,
    expectedProfit: profitUSD,
    originalAmount: amountInvested,
    originalCurrency: currency,
  },
});

    // Step 6: Compute projections
    let exchangeRateFromUSD = 1;
    if (currency !== 'USD') {
      try {
        const backResult = await convertCurrency('USD', currency, 1);
        exchangeRateFromUSD = backResult.amount;
      } catch (err) {
        exchangeRateFromUSD = FALLBACK_RATES[currency] || 1;
      }
    }
    const projections = computeProjections(
      usdAmount,
      asset.expectedReturn,
      [1, 3, 5, 10],
      currency,
      exchangeRateFromUSD
    );

    // Step 7: Currency symbol for display
    const currencySymbols = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'C$', JPY: '¥', CNY: '¥' };
    const symbol = currencySymbols[currency] || '$';

    // Step 8: Generate advice
    const advice = generateAdvice(
      asset,
      amountInvested,
      currency,
      symbol,
      asset.expectedReturn,
      livePriceInUserCurrency
    );

    res.json({
      assetName: asset.name,
      amountInvested: amountInvested,
      amountCurrency: currency,
      amountSymbol: symbol,
      expectedProfit: profitDisplay,
      totalReturn: totalDisplay,
      riskLevel: asset.riskLevel,
      advice,
      livePrice: livePriceInUserCurrency,
      projections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== GET HISTORY ====================
router.get('/history', auth, async (req, res) => {
  try {
    const history = await prisma.userSimulation.findMany({
      where: { userId: req.user.id },
      include: { asset: { select: { name: true, type: true, riskLevel: true } } },
      orderBy: { simulatedAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== DELETE HISTORY ====================
router.delete('/history/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const simulation = await prisma.userSimulation.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });
    if (!simulation) return res.status(404).json({ msg: 'Not found' });
    await prisma.userSimulation.delete({ where: { id: parseInt(id) } });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;