import React, { useEffect, useState } from 'react';
import './Predictive.css';
import { getAssets, getForecast, getSentiment, getRiskProfile } from '../api';
import AsyncAssetSelector from './AsyncAssetSelector';
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
import { Line } from 'react-chartjs-2';

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

  // Load DB assets (for star indicator) and initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const assetsRes = await getAssets();
        setAssets(assetsRes.data);
        // If there are assets in DB, use the first one as default
        if (assetsRes.data.length > 0) {
          const defaultTicker = assetsRes.data[0].ticker || 'AAPL';
          setSelectedTicker(defaultTicker);
          await fetchAllData(defaultTicker);
        } else {
          // Fallback to AAPL if no DB assets
          setSelectedTicker('AAPL');
          await fetchAllData('AAPL');
        }
      } catch (err) {
        console.error('Error loading DB assets:', err);
        // Fallback
        setSelectedTicker('AAPL');
        await fetchAllData('AAPL');
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
      setForecast(forecastRes.data);
      setSentiment(sentimentRes.data);
      setRiskProfile(riskRes.data);
    } catch (err) {
      console.error('Error fetching predictive data:', err);
    }
  };

  if (loading) return <div className="container">Loading predictive insights...</div>;

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  // Combined chart data (historical + forecast)
  const combinedChartData = {
    labels: [
      ...(forecast?.historical?.dates?.slice(-10)?.map(d => d.slice(5)) || []),
      ...(forecast?.forecast?.dates?.map(d => d.slice(5)) || [])
    ],
    datasets: [
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
    ],
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment === 'positive') return '🟢';
    if (sentiment === 'negative') return '🔴';
    return '🟡';
  };

  return (
    <div className="predictive-container">
      {/* Dark Mode Toggle Button */}
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <h1>📊 Market Intelligence</h1>
      <p>Real-time predictive insights, sentiment analysis, and personalized risk profiles.</p>

      {/* Dynamic Asset Selector */}
      <AsyncAssetSelector
        onSelect={(asset) => {
          if (asset && asset.ticker) {
            setSelectedTicker(asset.ticker);
            fetchAllData(asset.ticker);
          }
        }}
        value={assets.find(a => a.ticker === selectedTicker)}
        placeholder="Search for any asset..."
      />

      {/* Tabs */}
      <div className="predictive-tabs">
        <button 
          className={activeTab === 'forecast' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('forecast')}
        >
          📈 Forecast
        </button>
        <button 
          className={activeTab === 'sentiment' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('sentiment')}
        >
          📰 Sentiment
        </button>
        <button 
          className={activeTab === 'risk' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('risk')}
        >
          🛡️ Risk Profile
        </button>
      </div>

      {/* Tab Content */}
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

            <div className="chart-container">
              <h3>Price Forecast (30 Days)</h3>
              {combinedChartData && (
                <Line 
                  data={combinedChartData}
                  options={{
                    responsive: true,
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
              )}
            </div>

            <div className="forecast-insights">
              <h4>💡 Key Insights</h4>
              <ul>
                <li><strong>Confidence:</strong> {forecast.recommendation?.confidence || 'N/A'}</li>
                <li><strong>30-Day Projection:</strong> ${forecast.forecast?.prices?.[forecast.forecast.prices.length - 1]?.toFixed(2) || 'N/A'}</li>
                <li><strong>Volatility Level:</strong> {forecast.volatility > 0.03 ? 'High' : forecast.volatility > 0.02 ? 'Medium' : 'Low'}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && sentiment && (
          <div className="sentiment-section">
            <div className="sentiment-summary">
              <div className="sentiment-score">
                <span className="sentiment-emoji">{getSentimentEmoji(sentiment.sentiment)}</span>
                <span className="sentiment-label">{sentiment.sentiment?.toUpperCase()}</span>
                <span className="sentiment-value">Score: {sentiment.score}</span>
              </div>
              <p className="sentiment-summary-text">{sentiment.summary}</p>
            </div>

            <div className="sentiment-articles">
              <h4>📰 Top News Headlines</h4>
              {sentiment.articles?.length > 0 ? (
                sentiment.articles.map((article, idx) => (
                  <div key={idx} className="sentiment-article">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <span className="article-bullet">▸</span> {article.title}
                    </a>
                    <span className="article-source">{article.source}</span>
                  </div>
                ))
              ) : (
                <p>No news articles available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'risk' && riskProfile && (
          <div className="risk-section">
            <div className="risk-profile-card">
              <h3>🛡️ Your Risk Profile</h3>
              <div className="risk-tolerance">
                <span className="risk-label">Risk Tolerance:</span>
                <span className={`risk-value ${riskProfile.riskTolerance}`}>
                  {riskProfile.riskTolerance?.toUpperCase()}
                </span>
              </div>
              <p className="risk-message">{riskProfile.message}</p>
            </div>

            <div className="allocation-card">
              <h4>📊 Recommended Allocation</h4>
              <div className="allocation-bars">
                <div className="allocation-item">
                  <span>Stocks</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill stocks" style={{ width: `${riskProfile.recommendedAllocation?.stocks || 60}%` }}>
                      {riskProfile.recommendedAllocation?.stocks || 60}%
                    </div>
                  </div>
                </div>
                <div className="allocation-item">
                  <span>Bonds</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill bonds" style={{ width: `${riskProfile.recommendedAllocation?.bonds || 30}%` }}>
                      {riskProfile.recommendedAllocation?.bonds || 30}%
                    </div>
                  </div>
                </div>
                <div className="allocation-item">
                  <span>Crypto</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill crypto" style={{ width: `${riskProfile.recommendedAllocation?.crypto || 5}%` }}>
                      {riskProfile.recommendedAllocation?.crypto || 5}%
                    </div>
                  </div>
                </div>
                <div className="allocation-item">
                  <span>Cash</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill cash" style={{ width: `${riskProfile.recommendedAllocation?.cash || 5}%` }}>
                      {riskProfile.recommendedAllocation?.cash || 5}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="risk-advice">
              <h4>💡 Investment Advice</h4>
              {riskProfile.riskTolerance === 'aggressive' && (
                <p>You have an aggressive risk profile. Consider growth stocks, tech sectors, and emerging markets. Be prepared for higher volatility.</p>
              )}
              {riskProfile.riskTolerance === 'conservative' && (
                <p>You have a conservative risk profile. Focus on bonds, dividend stocks, and stable blue-chip companies. Capital preservation is key.</p>
              )}
              {riskProfile.riskTolerance === 'medium' && (
                <p>You have a balanced risk profile. A mix of growth stocks, bonds, and some alternative assets is recommended. Diversify across sectors.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictive;