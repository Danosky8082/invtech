import React, { useState, useEffect, useCallback } from 'react';
import { getStockPrice } from '../api';

const StockTicker = ({ symbols = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'NVDA', 'META', 'NFLX'] }) => {
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    const updates = {};
    for (const symbol of symbols) {
      try {
        const res = await getStockPrice(symbol);
        updates[symbol] = {
          price: res.data.price ?? 0,
          change: res.data.change ?? 0,
          changePercent: res.data.changePercent ?? 0,
        };
      } catch (err) {
        updates[symbol] = { price: 0, change: 0, changePercent: 0 };
      }
    }
    setStocks(updates);
    setLoading(false);
  }, [symbols]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  if (loading) return <div className="stock-ticker-container"><div className="loading-ticker">Loading prices...</div></div>;

  return (
    <div className="stock-ticker-container">
      <div className="stock-ticker">
        {symbols.map((symbol) => {
          const stock = stocks[symbol] || { price: 0, change: 0, changePercent: 0 };
          const isPositive = stock.change >= 0;
          return (
            <div key={symbol} className="ticker-item">
              <span className="ticker-symbol">{symbol}</span>
              <span className="ticker-price">${stock.price.toFixed(2)}</span>
              <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockTicker;