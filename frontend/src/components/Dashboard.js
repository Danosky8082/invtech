import React, { useEffect, useState } from 'react';
import Simulator from './Simulator';
import MarqueeExchange from './MarqueeExchange';
import HistoryModal from './HistoryModal';
import { getAssets, getHistory, getExchangeRate, api } from '../api';
import AssetSelector from './AssetSelector';
import AsyncAssetSelector from './AsyncAssetSelector';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  

  // Helper: fetch with timeout (5 seconds)
  const fetchWithTimeout = (promise, timeoutMs = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  };

  useEffect(() => {
    // 1️⃣ Try to get user from sessionStorage first
    let storedUser = sessionStorage.getItem('user');
    console.log('[Dashboard] sessionStorage user:', storedUser);
    
    // 2️⃣ If not found, try localStorage (for backward compatibility)
    if (!storedUser) {
      storedUser = localStorage.getItem('user');
      console.log('[Dashboard] localStorage user:', storedUser);
      // If found in localStorage, copy to sessionStorage for consistency
      if (storedUser) {
        sessionStorage.setItem('user', storedUser);
        const token = localStorage.getItem('token');
        if (token) sessionStorage.setItem('token', token);
      }
    }
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[Dashboard] Parsed user object:', parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    } else {
      console.warn('No user found in storage');
    }

    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          fetchWithTimeout(getAssets()),
          fetchWithTimeout(getHistory()),
          fetchWithTimeout(getExchangeRate()),
        ]);

        const [assetsResult, historyResult, ratesResult] = results;

        if (assetsResult.status === 'fulfilled' && Array.isArray(assetsResult.value.data)) {
  setAssets(assetsResult.value.data);
} else {
  setAssets([]);
}

if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
  setHistory(historyResult.value.data);
} else {
  setHistory([]);
}

        if (ratesResult.status === 'fulfilled' && ratesResult.value.data?.rates) {
          setExchangeRates(ratesResult.value.data.rates);
        } else {
          console.error('Exchange rates API failed, using defaults');
          setExchangeRates({ USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.37, JPY: 147.5, CNY: 7.25, NGN: 1520 });
        }

        if (historyResult.status === 'fulfilled' && assetsResult.status === 'fulfilled') {
          generateRecommendations(historyResult.value.data, assetsResult.value.data);
        } else if (assetsResult.status === 'fulfilled') {
          const lowRisk = assetsResult.value.data.filter(a => a.riskLevel === 'low').slice(0, 3);
          setRecommendations(lowRisk.length ? lowRisk : assetsResult.value.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Unexpected error loading dashboard:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generateRecommendations = (userHistory, allAssets) => {
    if (!userHistory.length) {
      setRecommendations(allAssets.filter(a => a.riskLevel === 'low').slice(0, 3));
      return;
    }
    const riskCount = { low: 0, medium: 0, high: 0 };
    userHistory.forEach(sim => {
      if (sim.asset && sim.asset.riskLevel) riskCount[sim.asset.riskLevel]++;
    });
    const mostFrequentRisk = Object.keys(riskCount).reduce((a, b) =>
      riskCount[a] > riskCount[b] ? a : b
    );
    const usedIds = new Set(userHistory.map(sim => sim.assetId));
    const suggestions = allAssets
      .filter(a => a.riskLevel === mostFrequentRisk && !usedIds.has(a.id))
      .slice(0, 3);
    setRecommendations(suggestions.length ? suggestions : allAssets.slice(0, 3));
  };

  const convertAmount = (usdAmount) => {
    if (displayCurrency === 'USD' || !exchangeRates[displayCurrency]) return usdAmount;
    return usdAmount * exchangeRates[displayCurrency];
  };

  const deleteSimulation = async (id) => {
    try {
      await api.delete(`/simulation/history/${id}`);
      setHistory(history.filter(sim => sim.id !== id));
    } catch (err) {
      console.error(err);
      alert('Could not delete simulation');
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear(); // also clear localStorage for safety
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading your portfolio...</div>
      </div>
    );
  }

  if (error && assets.length === 0 && history.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const symbols = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'C$', JPY: '¥', CNY: '¥' };
  const symbol = symbols[displayCurrency] || '$';

  // Determine display name
  const displayName = user?.username || 'Investor';
  console.log('[Dashboard] Display name:', displayName, 'User object:', user);

  return (
    <div>
      <MarqueeExchange />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>
              Welcome back, <span className="username">{displayName}</span> 👋
            </h1>
            <p className="subtitle">Simulate investments & make smarter decisions</p>
          </div>
          <div className="header-controls">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="currency-display-select"
            >
              <option value="USD">USD ($)</option>
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="CAD">Canadian Dollar (C$)</option>
              <option value="JPY">Japanese Yen (¥)</option>
              <option value="CNY">Chinese Yuan (¥)</option>
            </select>
            
              <button onClick={handleLogout} className="logout-btn">Logout</button>
           
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="recommendations-card">
            <h3>📌 Recommended for you</h3>
            <div className="recommendations-list">
              {recommendations.map(asset => (
                <div key={asset.id} className="rec-item">
                  <span className="rec-name">{asset.name}</span>
                  <span className="rec-risk" data-risk={asset.riskLevel}>{asset.riskLevel}</span>
                  <button onClick={() => setSelectedAsset(asset)}>Simulate</button>
                </div>
              ))}
            </div>
          </div>
        )}

       <div className="dashboard-grid">
  <div className="simulator-card">
    <h2>📈 Try an investment</h2>
    <AsyncAssetSelector
      onSelect={setSelectedAsset}
      value={selectedAsset}
      placeholder="Search for an asset to simulate..."
    />
    {selectedAsset && <Simulator asset={selectedAsset} />}
  </div>

          <div className="history-card">
            <h2>📜 Your past simulations</h2>
            {history.length === 0 ? (
              <p className="empty-history">No simulations yet. Try one on the left!</p>
            ) : (
              <ul className="history-list">
                {history.map(sim => (
                  <li
                    key={sim.id}
                    className="clickable-history"
                    onClick={() => setSelectedSimulation(sim)}
                  >
                    <div className="history-info">
                      <span className="history-asset">{sim.asset.name}</span>
                      <span className="history-amount">
                        {symbol}{convertAmount(sim.amountInvested).toFixed(2)} {displayCurrency}
                      </span>
                      <span className="history-profit">
                        +{symbol}{convertAmount(sim.expectedProfit).toFixed(2)} {displayCurrency}
                      </span>
                    </div>
                    <button
                      className="delete-history-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSimulation(sim.id);
                      }}
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {selectedSimulation && (
        <HistoryModal simulation={selectedSimulation} onClose={() => setSelectedSimulation(null)} />
      )}
    </div>
  );
};

export default Dashboard;