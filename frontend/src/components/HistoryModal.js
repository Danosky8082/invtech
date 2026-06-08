import React from 'react';

const HistoryModal = ({ simulation, onClose }) => {
  if (!simulation) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>📊 Simulation Details</h2>
        <div className="modal-details">
          <p><strong>Asset:</strong> {simulation.asset.name} ({simulation.asset.type})</p>
          <p><strong>Amount invested:</strong> ${simulation.amountInvested.toFixed(2)}</p>
          <p><strong>Expected profit:</strong> ${simulation.expectedProfit.toFixed(2)}</p>
          <p><strong>Total return:</strong> ${(simulation.amountInvested + simulation.expectedProfit).toFixed(2)}</p>
          <p><strong>Simulated on:</strong> {new Date(simulation.simulatedAt).toLocaleString()}</p>
        </div>
        <div className="modal-advice">
          <strong>💡 Advice:</strong> 
          {simulation.asset.riskLevel === 'high' && ' High‑risk assets can bring high returns but also large losses. Only invest what you can afford to lose.'}
          {simulation.asset.riskLevel === 'medium' && ' Balanced risk – suitable for moderate growth with controlled volatility.'}
          {simulation.asset.riskLevel === 'low' && ' Low risk – capital preservation, ideal for short‑term goals.'}
        </div>
        <button className="modal-simulate-again" onClick={() => {
          // Optionally pre‑fill the simulator (we can pass back to parent)
          onClose();
        }}>
          Simulate again
        </button>
      </div>
    </div>
  );
};

export default HistoryModal;