import React, { useEffect, useState } from 'react';
import { getAssets, getForecast, getSentiment, getRiskProfile, searchAssets } from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Predictive = () => {
  const [assets, setAssets] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [forecast, setForecast] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [riskProfile, setRiskProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const assetsRes = await getAssets();
        setAssets(assetsRes.data);
        if (assetsRes.data.length > 0) {
          const firstTicker = assetsRes.data[0].ticker || 'AAPL';
          setSelectedTicker(firstTicker);
          setSearchQuery(firstTicker);
          await fetchAllData(firstTicker);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchAllData = async (ticker) => {
    try {
      const [forecastRes, sentimentRes, riskRes] = await Promise.all([
        getForecast(ticker),
        getSentiment('us'),
        getRiskProfile(),
      ]);
      console.log('[Forecast] Received:', forecastRes.data);
      setForecast(forecastRes.data);
      setSentiment(sentimentRes.data);
      setRiskProfile(riskRes.data);
    } catch (err) {
      console.error('Error fetching predictive data:', err);
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchAssets(query);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  };

  const handleSelect = (ticker) => {
    setSelectedTicker(ticker);
    setSearchQuery(ticker);
    setSearchResults([]);
    fetchAllData(ticker);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  if (loading) return <div className="container">Loading predictive insights...</div>;

  // Build chart data only if forecast exists and has historical prices
  const hasHistoricalData = forecast?.historical?.prices && forecast.historical.prices.length > 0;
  const hasForecastData = forecast?.forecast?.prices && forecast.forecast.prices.length > 0;

  const chartLabels = [
    ...(forecast?.historical?.dates?.slice(-10)?.map(d => d.slice(5)) || []),
    ...(forecast?.forecast?.dates?.map(d => d.slice(5)) || [])
  ];

  const chartDatasets = [
    {
      label: 'Historical Price',
      data: [
        ...(forecast?.historical?.prices?.slice(-10) || []),
        ...(forecast?.forecast?.prices?.map(() => null) || [])
      ],
      borderColor: '#1e3c72',
      tension: 0.3,
    },
    {
      label: 'Forecast',
      data: [
        ...(forecast?.historical?.prices?.slice(-10)?.map(() => null) || []),
        ...(forecast?.forecast?.prices || [])
      ],
      borderColor: '#2e7d32',
      borderDash: [5, 5],
      tension: 0.3,
    },
    {
      label: 'Confidence Band',
      data: [
        ...(forecast?.historical?.prices?.slice(-10)?.map(() => null) || []),
        ...(forecast?.forecast?.upper || [])
      ],
      borderColor: 'rgba(46, 125, 50, 0.2)',
      backgroundColor: 'rgba(46, 125, 50, 0.05)',
      fill: false,
      borderDash: [2, 2],
      tension: 0.3,
    }
  ];

  const combinedChartData = {
    labels: chartLabels,
    datasets: chartDatasets,
  };

  return (
    <div className="predictive-container">
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <h1>📊 Market Intelligence</h1>
      <p>Real-time predictive insights, sentiment analysis, and personalized risk profiles.</p>

      <div className="asset-search">
        <input
          type="text"
          placeholder="Search for an asset (e.g., AAPL)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="asset-search-input"
        />
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((asset) => (
              <li key={asset.ticker} onClick={() => handleSelect(asset.ticker)}>
                <strong>{asset.ticker}</strong> – {asset.name} ({asset.type})
                {asset.inDatabase && ' ⭐'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="predictive-tabs">
        <button className={activeTab === 'forecast' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('forecast')}>
          📈 Forecast
        </button>
        <button className={activeTab === 'sentiment' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('sentiment')}>
          📰 Sentiment
        </button>
        <button className={activeTab === 'risk' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('risk')}>
          🛡️ Risk Profile
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'forecast' && forecast && (
          <div className="forecast-section">
            <div className="forecast-summary">
              <div className="summary-card">
                <h4>Current Price</h4>
                <p className="price">${forecast.currentPrice?.toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h4>Trend</h4>
                <p className={forecast.trend >= 0 ? 'positive' : 'negative'}>
                  {forecast.trend?.toFixed(2)}%
                </p>
              </div>
              <div className="summary-card">
                <h4>Volatility</h4>
                <p>{forecast.volatility?.toFixed(2)}%</p>
              </div>
              <div className="summary-card">
                <h4>Signal</h4>
                <p className={`signal-${forecast.recommendation?.signal?.toLowerCase()}`}>
                  {forecast.recommendation?.signal}
                </p>
              </div>
            </div>

            <div className="chart-container" style={{ minHeight: '300px', position: 'relative' }}>
              <h3>Price Forecast (30 Days)</h3>
              {hasHistoricalData && hasForecastData ? (
                <Line
                  data={combinedChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y?.toFixed(2) || 'N/A'}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p>No forecast data available for this asset.</p>
              )}
              {forecast.note && <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.85rem' }}>{forecast.note}</p>}
            </div>

            <div className="forecast-insights">
              <h4>💡 Key Insights</h4>
              <ul>
                <li><strong>Confidence:</strong> {forecast.recommendation?.confidence || 'N/A'}</li>
                <li><strong>30-Day Projection:</strong> ${forecast.forecast?.prices?.[forecast.forecast.prices.length - 1]?.toFixed(2) || 'N/A'}</li>
                <li><strong>Volatility Level:</strong> {forecast.volatility > 0.03 ? 'High' : forecast.volatility > 0.02 ? 'Medium' : 'Low'}</li>
                {forecast.metrics && (
                  <>
                    <li><strong>Annualized Return:</strong> {forecast.metrics.annualizedReturn}%</li>
                    <li><strong>Sharpe Ratio:</strong> {forecast.metrics.sharpeRatio}</li>
                    <li><strong>Max Drawdown:</strong> {forecast.metrics.maxDrawdown}%</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && sentiment && (
          // ... keep existing sentiment code (same as before)
          <div>Sentiment tab</div>
        )}

        {activeTab === 'risk' && riskProfile && (
          // ... keep existing risk profile code (same as before)
          <div>Risk tab</div>
        )}
      </div>
    </div>
  );
};

export default Predictive;