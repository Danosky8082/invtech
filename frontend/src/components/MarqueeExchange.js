import React, { useEffect, useState } from 'react';
import { getExchangeRate } from '../api';

const MarqueeExchange = () => {
  const [rates, setRates] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await getExchangeRate();
        setRates(res.data);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="exchange-marquee">💰 Exchange rates temporarily unavailable – using cached data</div>;
  if (!rates || !rates.rates) return <div className="exchange-marquee">Loading exchange rates...</div>;

  // Build the scrolling text from real rates
  const { rates: realRates } = rates;
  const scrollParts = [`💵 1 USD =`];
  const order = ['EUR', 'GBP', 'CAD', 'JPY', 'CNY', 'NGN'];
  for (const curr of order) {
    if (realRates[curr]) {
      const formatted = curr === 'JPY' ? realRates[curr].toFixed(2) : realRates[curr].toFixed(4);
      scrollParts.push(`${curr} ${formatted}  |`);
    }
  }
  scrollParts.push('Real‑time market data – invest wisely!');
  const scrollContent = scrollParts.join('   ');

  return (
    <div className="exchange-marquee">
      <div className="marquee-wrapper">
        <div className="marquee-content">
          {scrollContent}
          <span className="marquee-duplicate">{scrollContent}</span>
        </div>
      </div>
    </div>
  );
};

export default MarqueeExchange;