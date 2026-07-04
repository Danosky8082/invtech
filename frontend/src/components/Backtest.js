import React, { useState } from 'react';
import { runBacktest } from '../api';
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

const Backtest = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [strategy, setStrategy] = useState('buy_and_hold');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleRunBacktest = async () => {
    if (!selectedAsset) {
      setError('Please select an asset');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await runBacktest({
        ticker: selectedAsset.ticker,
        strategy: strategy,
        startDate: startDate,
        endDate: endDate,
        params: strategy === 'ma_crossover' ? { shortWindow: 10, longWindow: 30 } : {},
      });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const chartData = results ? {
    labels: results.dates.map(d => d.slice(5)), // show month/day
    datasets: [
      {
        label: 'Portfolio Value',
        data: results.portfolioValues,
        borderColor: '#1e3c72',
        backgroundColor: 'rgba(30, 60, 114, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  } : null;

  return (
    <div className="backtest-container">
      <h1>📈 Backtesting Engine</h1>
      <p>Test your investment strategies on historical data.</p>

      <div className="backtest-controls">
        <div className="control-group">
          <label>Asset</label>
          <AsyncAssetSelector
            onSelect={setSelectedAsset}
            value={selectedAsset}
            placeholder="Search for an asset..."
          />
        </div>

        <div className="control-group">
          <label>Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="buy_and_hold">Buy & Hold</option>
            <option value="ma_crossover">Moving Average Crossover (10/30)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="control-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button className="run-btn" onClick={handleRunBacktest} disabled={loading}>
          {loading ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="backtest-results">
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Total Return</h4>
              <p className={results.totalReturn >= 0 ? 'positive' : 'negative'}>
                {results.totalReturn.toFixed(2)}%
              </p>
            </div>
            <div className="metric-card">
              <h4>Annualized Return</h4>
              <p className={results.annualizedReturn >= 0 ? 'positive' : 'negative'}>
                {results.annualizedReturn.toFixed(2)}%
              </p>
            </div>
            <div className="metric-card">
              <h4>Sharpe Ratio</h4>
              <p>{results.sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="metric-card">
              <h4>Max Drawdown</h4>
              <p className="negative">{results.maxDrawdown.toFixed(2)}%</p>
            </div>
            <div className="metric-card">
              <h4>Win Rate</h4>
              <p>{results.winRate.toFixed(2)}%</p>
            </div>
            <div className="metric-card">
              <h4>Total Trades</h4>
              <p>{results.totalTrades}</p>
            </div>
          </div>

          <div className="chart-container">
            <h3>Equity Curve</h3>
            {chartData && (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `$${context.parsed.y?.toFixed(2)}`;
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

          {results.trades && results.trades.length > 0 && (
            <div className="trades-log">
              <h3>Trade Log</h3>
              <table className="trades-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.map((trade, idx) => (
                    <tr key={idx}>
                      <td>{new Date(trade.date).toLocaleDateString()}</td>
                      <td className={trade.type === 'BUY' ? 'buy' : 'sell'}>{trade.type}</td>
                      <td>${trade.price.toFixed(2)}</td>
                      <td>{trade.shares.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Backtest;