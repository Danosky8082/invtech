import React from 'react';
import AsyncSelect from 'react-select/async';
import { searchAssets } from '../api';

const AsyncAssetSelector = ({ onSelect, value, placeholder = 'Search for any asset...' }) => {
  // Load options from backend search endpoint
  const loadOptions = async (inputValue) => {
    if (inputValue.length < 2) return [];
    try {
      const res = await searchAssets(inputValue);
      return res.data.map((asset) => ({
        value: asset.ticker,
        label: `${asset.name} (${asset.ticker}) – ${asset.type}${asset.inDatabase ? ' ⭐' : ''}`,
        asset: asset,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Handle selection
  const handleChange = (selected) => {
    onSelect(selected ? selected.asset : null);
  };

  // Determine selected value
  const selectedValue = value
    ? {
        value: value.ticker,
        label: `${value.name} (${value.ticker}) – ${value.type}${value.inDatabase ? ' ⭐' : ''}`,
        asset: value,
      }
    : null;

  return (
    <AsyncSelect
      loadOptions={loadOptions}
      onChange={handleChange}
      value={selectedValue}
      placeholder={placeholder}
      isClearable
      defaultOptions={false}
      cacheOptions
      className="asset-selector-react"
      classNamePrefix="asset-select"
      styles={{
        control: (provided) => ({
          ...provided,
          borderRadius: '40px',
          padding: '4px 8px',
          borderColor: '#e2e8f0',
          boxShadow: 'none',
          '&:hover': { borderColor: '#b0c4de' },
        }),
        option: (provided) => ({
          ...provided,
          padding: '10px 16px',
        }),
      }}
    />
  );
};

export default AsyncAssetSelector;