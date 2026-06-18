import React from 'react';

const HistoryModal = ({ simulation, onClose }) => {
  if (!simulation) return null;

  // Determine currency and amount
  const currency = simulation.originalCurrency || 'USD';
  const amount = simulation.originalAmount || simulation.amountInvested;

  // Calculate profit and total in the original currency using the asset's expected return
  const expectedReturn = simulation.asset?.expectedReturn || 0;
  const profit = amount * expectedReturn;
  const total = amount + profit;

  // Currency symbol mapping
  const currencySymbols = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'C$', JPY: '¥', CNY: '¥' };
  const symbol = currencySymbols[currency] || currency;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>📊 Simulation Details</h2>
        <div className="modal-details">
          <p><strong>Asset:</strong> {simulation.asset.name} ({simulation.asset.type})</p>
          <p><strong>Amount invested:</strong> {symbol}{amount.toFixed(2)} {currency}</p>
          <p><strong>Expected profit:</strong> {symbol}{profit.toFixed(2)} {currency}</p>
          <p><strong>Total return:</strong> {symbol}{total.toFixed(2)} {currency}</p>
          <p><strong>Simulated on:</strong> {new Date(simulation.simulatedAt).toLocaleString()}</p>
        </div>
        <div className="modal-advice">
          <strong>💡 Advice:</strong> 
          {simulation.asset.riskLevel === 'high' && ' High‑risk assets can bring high returns but also large losses. Only invest what you can afford to lose.'}
          {simulation.asset.riskLevel === 'medium' && ' Balanced risk – suitable for moderate growth with controlled volatility.'}
          {simulation.asset.riskLevel === 'low' && ' Low risk – capital preservation, ideal for short‑term goals.'}
        </div>
        <button className="modal-simulate-again" onClick={onClose}>
          Simulate again
        </button>
      </div>
    </div>
  );
};

export default HistoryModal;