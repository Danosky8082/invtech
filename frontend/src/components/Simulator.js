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
      // If the asset has an id (from DB), send it; otherwise send the ticker
      assetId: asset.id || undefined,
      ticker: asset.ticker, // always send ticker
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
            <p>Current market price: {result.amountSymbol}{result.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} {result.amountCurrency}</p>
          )}
          <p>Invested: {result.amountSymbol}{result.amountInvested.toLocaleString()} {result.amountCurrency}</p>
          <p>Expected profit: {result.amountSymbol}{result.expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Total return: {result.amountSymbol}{result.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

          {result.projections && result.projections.length > 0 && (
            <div className="projections-section">
              <h4>📈 Simulated growth over time (compound annually)</h4>
              <div className="projection-grid">
                {result.projections.map(p => (
                  <div key={p.years} className="projection-card">
                    <div className="projection-years">{p.years} year{p.years !== 1 ? 's' : ''}</div>
                    <div className="projection-value">{result.amountSymbol}{p.futureValue.toFixed(2)}</div>
                    <div className={`projection-profit ${p.profit >= 0 ? 'positive' : 'negative'}`}>
                      {p.profit >= 0 ? '+' : ''}{result.amountSymbol}{p.profit.toFixed(2)} ({p.percentageReturn}%)
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