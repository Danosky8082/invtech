import React from 'react';

const AssetSuggestions = ({ assets, onSelect }) => {
  // Show first 8 assets
  const displayAssets = assets.slice(0, 8);

  if (!displayAssets.length) return null;

  return (
    <div className="asset-suggestions">
      <h4>💡 Try investing in:</h4>
      <div className="suggestion-chips">
        {displayAssets.map((asset) => (
          <div
            key={asset.id}
            className="suggestion-chip"
            onClick={() => onSelect(asset)}
          >
            <span className="chip-name">{asset.name}</span>
            <span className="chip-ticker">{asset.ticker}</span>
            <span className={`chip-risk ${asset.riskLevel}`}>{asset.riskLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetSuggestions;