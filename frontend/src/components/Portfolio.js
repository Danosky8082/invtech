import React, { useEffect, useState } from 'react';
import { getPortfolio } from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1e3c72', '#2a5298', '#f6d365', '#fda085', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await getPortfolio();
        setPortfolio(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (loading) return <div className="container">Loading portfolio...</div>;
  if (error) return <div className="container error-message">{error}</div>;

 const { totalInvested, totalValue, holdings } = portfolio || {};

  // Prepare pie chart data – only assets with invested > 0
  const pieData = holdings
    ?.filter(h => h.totalInvested > 0)
    .map(h => ({
      name: h.name,
      value: h.totalInvested,
      ticker: h.ticker,
    })) || [];

  // Helper to format currency
  const formatCurrency = (value) => `$${value?.toFixed(2) || '0.00'}`;

  return (
    <div className="portfolio-container">
      <h1>📊 Portfolio Overview</h1>
      <p>Your virtual investments based on simulation history with real‑time market valuation.</p>

      {/* Summary cards */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <h4>Total Invested</h4>
          <p className="price">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="summary-card">
          <h4>Current Value</h4>
          <p className="price">{formatCurrency(totalValue)}</p>
        </div>
        <div className="summary-card">
          <h4>Unrealised P&L</h4>
          <p className={`price ${totalUnrealizedProfit >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalUnrealizedProfit)}
          </p>
        </div>
        <div className="summary-card">
          <h4>P&L %</h4>
          <p className={`price ${totalUnrealizedProfitPercent >= 0 ? 'positive' : 'negative'}`}>
            {totalUnrealizedProfitPercent?.toFixed(2) || '0.00'}%
          </p>
        </div>
        <div className="summary-card">
          <h4>Holdings</h4>
          <p className="price">{holdings?.length || 0}</p>
        </div>
      </div>

      {/* Pie chart & Holdings table */}
      <div className="portfolio-grid">
        <div className="chart-card">
          <h3>Asset Allocation</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No investments yet. Start simulating to build your portfolio!</p>
          )}
        </div>

        <div className="holdings-card">
          <h3>Holdings Breakdown</h3>
          {holdings?.length > 0 ? (
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>Unrealised P&L</th>
                  <th>P&L %</th>
                  <th>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.assetId}>
                    <td>
                      <strong>{h.name}</strong>
                      <br />
                      <span className="ticker">{h.ticker}</span>
                    </td>
                    <td>{formatCurrency(h.totalInvested)}</td>
                    <td>{formatCurrency(h.currentValue)}</td>
                    <td className={h.unrealizedProfit >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(h.unrealizedProfit)}
                    </td>
                    <td className={h.unrealizedProfitPercent >= 0 ? 'positive' : 'negative'}>
                      {h.unrealizedProfitPercent?.toFixed(2) || '0.00'}%
                    </td>
                    <td>{h.allocationPercent?.toFixed(1) || '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No holdings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;