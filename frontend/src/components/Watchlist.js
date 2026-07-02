import React, { useEffect, useState } from 'react';
import { getWatchlist, removeFromWatchlist } from '../api';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await getWatchlist();
        setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  const handleRemove = async (id) => {
    try {
      await removeFromWatchlist(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      alert('Failed to remove');
    }
  };

  if (loading) return <div className="container">Loading watchlist...</div>;

  return (
    <div className="watchlist-container">
      <h1>⭐ Your Watchlist</h1>
      {items.length === 0 ? (
        <p>No assets in your watchlist. Go to <Link to="/dashboard">Dashboard</Link> to add some.</p>
      ) : (
        <div className="watchlist-grid">
          {items.map((item) => (
            <div key={item.id} className="watchlist-item">
              <div>
                <strong>{item.asset.name}</strong> ({item.asset.ticker})
                <span className={`risk-${item.asset.riskLevel}`}>{item.asset.riskLevel}</span>
              </div>
              <button onClick={() => handleRemove(item.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;