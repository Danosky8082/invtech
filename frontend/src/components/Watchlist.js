import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ✅ LocalStorage helpers (same as in Dashboard)
const getLocalWatchlist = () => {
  const stored = localStorage.getItem('watchlist');
  return stored ? JSON.parse(stored) : [];
};

const saveLocalWatchlist = (watchlist) => {
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
};

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load watchlist from localStorage
    const watchlist = getLocalWatchlist();
    setItems(watchlist);
    setLoading(false);
  }, []);

  const handleRemove = (assetId) => {
    const newItems = items.filter((item) => item.assetId !== assetId);
    setItems(newItems);
    saveLocalWatchlist(newItems);
  };

  if (loading) return <div className="container">Loading watchlist...</div>;

  return (
    <div className="watchlist-container">
      <h1>⭐ Your Watchlist</h1>
      {items.length === 0 ? (
        <p>
          No assets in your watchlist. Go to <Link to="/dashboard">Dashboard</Link> to add some.
        </p>
      ) : (
        <div className="watchlist-grid">
          {items.map((item) => (
            <div key={item.assetId} className="watchlist-item">
              <div>
                <strong>{item.asset.name}</strong> ({item.asset.ticker})
                <span className={`risk-${item.asset.riskLevel}`}>
                  {item.asset.riskLevel}
                </span>
              </div>
              <button onClick={() => handleRemove(item.assetId)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;