import React, { useState, useEffect } from 'react';
import { getStockPrice } from '../api';

const StockTicker = ({ symbols }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    const updates = {};
    for (const symbol of symbols) {
      try {
        const res = await getStockPrice(symbol);
        // ✅ The response has a `price` field (number)
        updates[symbol] = res.data.price ?? '—';
      } catch (err) {
        console.error('Error fetching price for', symbol, err);
        updates[symbol] = '—';
      }
    }
    setPrices(updates);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [symbols]);

  if (loading) return <div className="price-ticker">Loading prices...</div>;

  return (
    <div className="price-ticker">
      {symbols.map((symbol) => (
        <div key={symbol} className="ticker-item">
          <span className="ticker-symbol">{symbol}</span>
          <span className="ticker-price">${prices[symbol] !== '—' ? prices[symbol].toFixed(2) : 'N/A'}</span>
        </div>
      ))}
    </div>
  );
};

export default StockTicker;