import React, { useState, useEffect, useCallback } from 'react';
import { getStockPrice } from '../api';

const StockTicker = ({ symbols }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Wrap fetchPrices in useCallback so it can be a dependency
  const fetchPrices = useCallback(async () => {
    const updates = {};
    for (const symbol of symbols) {
      try {
        const res = await getStockPrice(symbol);
        updates[symbol] = res.data.price ?? '—';
      } catch (err) {
        console.error('Error fetching price for', symbol, err);
        updates[symbol] = '—';
      }
    }
    setPrices(updates);
    setLoading(false);
  }, [symbols]); // ✅ depends on symbols

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]); // ✅ now fetchPrices is stable

  if (loading) return <div className="price-ticker">Loading prices...</div>;

  return (
    <div className="price-ticker">
      {symbols.map((symbol) => (
        <div key={symbol} className="ticker-item">
          <span className="ticker-symbol">{symbol}</span>
          <span className="ticker-price">
            ${prices[symbol] !== '—' && typeof prices[symbol] === 'number' 
              ? prices[symbol].toFixed(2) 
              : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StockTicker;