import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StockTicker = ({ symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL'] }) => {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices = {};
      for (const sym of symbols) {
        try {
          const res = await axios.get(`http://localhost:5000/api/market/stock/${sym}`);
          newPrices[sym] = res.data.price;
        } catch (err) {
          newPrices[sym] = 'N/A';
        }
      }
      setPrices(newPrices);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [symbols]);

  return (
    <div className="stock-ticker">
      {symbols.map(sym => (
        <div key={sym} className="ticker-item">
          <span className="ticker-symbol">{sym}</span>
          <span className="ticker-price">${prices[sym] || '...'}</span>
        </div>
      ))}
    </div>
  );
};

export default StockTicker;