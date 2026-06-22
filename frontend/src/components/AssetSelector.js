import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getAssets } from '../api';

const AssetSelector = ({ onSelect, value, placeholder = 'Search for an asset...' }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await getAssets();
        const assetOptions = res.data.map(asset => ({
          value: asset.id,
          label: `${asset.name} (${asset.ticker || 'N/A'}) – ${asset.type}`,
          asset: asset,
        }));
        setOptions(assetOptions);
      } catch (err) {
        console.error('Failed to load assets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleChange = (selected) => {
    onSelect(selected ? selected.asset : null);
  };

  const selectedValue = value ? options.find(opt => opt.value === value.id) : null;

  return (
    <Select
      options={options}
      isLoading={loading}
      onChange={handleChange}
      value={selectedValue}
      placeholder={placeholder}
      isClearable
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

export default AssetSelector;