import React, { useState } from 'react';
import { simulateInvestment } from '../api';

const Simulator = ({ asset }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    setLoading(true);
    try {
      const res = await simulateInvestment({
        assetId: asset.id,
        amountInvested: parseFloat(amount),
        currency: currency
      });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.msg || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get currency symbol (used in the JSX)
  const getCurrencySymbol = (curr) => {
    const symbols = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'C$', JPY: '¥', CNY: '¥' };
    return symbols[curr] || curr;
  };

  return (
    <div>
      <div className="simulator-inputs">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select">
          <option value="USD">USD ($)</option>
          <option value="NGN">Nigerian Naira (₦)</option>
          <option value="EUR">Euro (€)</option>
          <option value="GBP">British Pound (£)</option>
          <option value="CAD">Canadian Dollar (C$)</option>
          <option value="JPY">Japanese Yen (¥)</option>
          <option value="CNY">Chinese Yuan (¥)</option>
        </select>
        <input
          type="number"
          placeholder={`Amount (${currency})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="amount-input"
        />
        <button onClick={handleSimulate} disabled={loading}>
          {loading ? 'Simulating...' : 'Simulate'}
        </button>
      </div>

      {result && (
        <div className="result-card">
          <p><strong>{result.assetName}</strong> – Risk: <span className={`risk-${result.riskLevel}`}>{result.riskLevel}</span></p>
          {result.livePrice && (
            <p>Current market price: {getCurrencySymbol(result.amountCurrency)}{result.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} {result.amountCurrency}</p>
          )}
          <p>Invested: {getCurrencySymbol(result.amountCurrency)}{result.amountInvested.toLocaleString()} {result.amountCurrency}</p>
          <p>Expected profit: {getCurrencySymbol(result.amountCurrency)}{result.expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {result.amountCurrency}</p>
          <p>Total return: {getCurrencySymbol(result.amountCurrency)}{result.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })} {result.amountCurrency}</p>

          {result.projections && result.projections.length > 0 && (
            <div className="projections-section">
              <h4>📈 Simulated growth over time (compound annually)</h4>
              <div className="projection-grid">
                {result.projections.map(p => (
                  <div key={p.years} className="projection-card">
                    <div className="projection-years">{p.years} year{p.years !== 1 ? 's' : ''}</div>
                    <div className="projection-value">{getCurrencySymbol(result.amountCurrency)}{p.futureValue.toFixed(2)}</div>
                    <div className={`projection-profit ${p.profit >= 0 ? 'positive' : 'negative'}`}>
                      {p.profit >= 0 ? '+' : ''}{getCurrencySymbol(result.amountCurrency)}{p.profit.toFixed(2)} ({p.percentageReturn}%)
                    </div>
                  </div>
                ))}
              </div>
              <div className="disclaimer">⚠️ This is a simulation based on historical expected returns. Actual results will vary.</div>
            </div>
          )}

          <div className="advice" dangerouslySetInnerHTML={{ __html: result.advice.replace(/\n/g, '<br/>') }} />
        </div>
      )}
    </div>
  );
};

export default Simulator;