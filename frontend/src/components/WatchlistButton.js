import React, { useState } from 'react';
import { addToWatchlist, removeFromWatchlist } from '../api';

const WatchlistButton = ({ asset, isInWatchlist, onToggle }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(isInWatchlist.id);
      } else {
        await addToWatchlist(asset.id);
      }
      onToggle && onToggle();
    } catch (err) {
      console.error(err);
      alert('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? '…' : isInWatchlist ? '⭐ In Watchlist' : '☆ Add to Watchlist'}
    </button>
  );
};

export default WatchlistButton;