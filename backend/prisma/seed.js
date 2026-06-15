const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding assets...');

  const assets = [
    // US Large Cap Stocks (High/Medium risk)
    { name: 'Apple Inc.', type: 'stock', ticker: 'AAPL', expectedReturn: 0.12, riskLevel: 'medium' },
    { name: 'Microsoft Corp', type: 'stock', ticker: 'MSFT', expectedReturn: 0.11, riskLevel: 'medium' },
    { name: 'Amazon.com Inc', type: 'stock', ticker: 'AMZN', expectedReturn: 0.14, riskLevel: 'high' },
    { name: 'NVIDIA Corp', type: 'stock', ticker: 'NVDA', expectedReturn: 0.18, riskLevel: 'high' },
    { name: 'Tesla Inc', type: 'stock', ticker: 'TSLA', expectedReturn: 0.20, riskLevel: 'high' },
    { name: 'Meta Platforms', type: 'stock', ticker: 'META', expectedReturn: 0.13, riskLevel: 'medium' },
    { name: 'Alphabet Inc', type: 'stock', ticker: 'GOOGL', expectedReturn: 0.11, riskLevel: 'medium' },
    { name: 'JPMorgan Chase', type: 'stock', ticker: 'JPM', expectedReturn: 0.08, riskLevel: 'medium' },
    { name: 'Johnson & Johnson', type: 'stock', ticker: 'JNJ', expectedReturn: 0.06, riskLevel: 'low' },
    { name: 'Procter & Gamble', type: 'stock', ticker: 'PG', expectedReturn: 0.07, riskLevel: 'low' },

    // International Stocks (Medium/High)
    { name: 'Alibaba Group', type: 'stock', ticker: 'BABA', expectedReturn: 0.15, riskLevel: 'high' },
    { name: 'Tencent Holdings', type: 'stock', ticker: 'TCEHY', expectedReturn: 0.14, riskLevel: 'high' },
    { name: 'Samsung Electronics', type: 'stock', ticker: 'SSNLF', expectedReturn: 0.10, riskLevel: 'medium' },
    { name: 'Nestlé SA', type: 'stock', ticker: 'NSRGF', expectedReturn: 0.06, riskLevel: 'low' },
    { name: 'Toyota Motor Corp', type: 'stock', ticker: 'TM', expectedReturn: 0.08, riskLevel: 'medium' },

    // Nigerian Stocks (Add real tickers if available)
    { name: 'Dangote Cement', type: 'stock', ticker: 'DANGCEM', expectedReturn: 0.15, riskLevel: 'medium' },
    { name: 'MTN Nigeria', type: 'stock', ticker: 'MTNN', expectedReturn: 0.12, riskLevel: 'medium' },
    { name: 'Nestlé Nigeria', type: 'stock', ticker: 'NESTLE', expectedReturn: 0.09, riskLevel: 'low' },
    { name: 'Guaranty Trust Bank', type: 'stock', ticker: 'GTCO', expectedReturn: 0.13, riskLevel: 'medium' },

    // Bonds (Low risk)
    { name: 'US Treasury 10Y', type: 'bond', ticker: 'UST10Y', expectedReturn: 0.045, riskLevel: 'low' },
    { name: 'US Treasury 30Y', type: 'bond', ticker: 'UST30Y', expectedReturn: 0.048, riskLevel: 'low' },
    { name: 'German Bund 10Y', type: 'bond', ticker: 'BUND10Y', expectedReturn: 0.025, riskLevel: 'low' },
    { name: 'UK Gilt 10Y', type: 'bond', ticker: 'UKG10Y', expectedReturn: 0.038, riskLevel: 'low' },
    { name: 'Japanese Gov Bond 10Y', type: 'bond', ticker: 'JGB10Y', expectedReturn: 0.005, riskLevel: 'low' },
    { name: 'Nigeria Gov Bond 10Y', type: 'bond', ticker: 'NGB10Y', expectedReturn: 0.12, riskLevel: 'medium' },

    // ETFs (Medium risk)
    { name: 'SPDR S&P 500 ETF', type: 'etf', ticker: 'SPY', expectedReturn: 0.10, riskLevel: 'medium' },
    { name: 'Invesco QQQ Trust', type: 'etf', ticker: 'QQQ', expectedReturn: 0.13, riskLevel: 'high' },
    { name: 'Vanguard Total Bond', type: 'etf', ticker: 'BND', expectedReturn: 0.04, riskLevel: 'low' },
    { name: 'ARK Innovation ETF', type: 'etf', ticker: 'ARKK', expectedReturn: 0.20, riskLevel: 'high' },
    { name: 'Global X US Infrastructure', type: 'etf', ticker: 'PAVE', expectedReturn: 0.09, riskLevel: 'medium' },

    // Crypto (High risk)
    { name: 'Bitcoin', type: 'crypto', ticker: 'BTC', expectedReturn: 0.40, riskLevel: 'high' },
    { name: 'Ethereum', type: 'crypto', ticker: 'ETH', expectedReturn: 0.35, riskLevel: 'high' },
    { name: 'Binance Coin', type: 'crypto', ticker: 'BNB', expectedReturn: 0.30, riskLevel: 'high' },
    { name: 'Solana', type: 'crypto', ticker: 'SOL', expectedReturn: 0.50, riskLevel: 'high' }
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { ticker: asset.ticker },
      update: asset,
      create: asset
    });
  }

  console.log(`✅ Seeded ${assets.length} assets`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });