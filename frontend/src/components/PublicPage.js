import React, { useEffect, useState } from 'react';
import { getNews, detectCountry } from '../api';
import { Link } from 'react-router-dom';
import MarqueeExchange from './MarqueeExchange';

const PublicPage = () => {
  const [news, setNews] = useState([]);
  const [country, setCountry] = useState('us');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isAuthenticated = !!sessionStorage.getItem('token');

  useEffect(() => {
    const detectAndSetCountry = async () => {
      try {
        const res = await detectCountry();
        setCountry(res.data.country);
      } catch (err) {
        setCountry('us');
      }
    };
    detectAndSetCountry();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      if (!country) return;
      setLoading(true);
      setError(false);
      try {
        const newsRes = await getNews(country);
        // ✅ Ensure we always set an array
        if (newsRes && Array.isArray(newsRes.data)) {
          setNews(newsRes.data);
        } else {
          console.warn('News API did not return an array:', newsRes);
          setNews([]);
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [country]);

  const handleCountryChange = (e) => setCountry(e.target.value);
  const getCountryName = (code) => {
    const names = { us: 'USA', ng: 'Nigeria', gb: 'UK', ca: 'Canada', au: 'Australia', in: 'India', cn: 'China' };
    return names[code] || 'USA';
  };

  return (
    <div>
      <MarqueeExchange />
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>InvTech</h1>
            <p className="tagline">Simulate before you invest – make smarter decisions</p>
            <div className="hero-buttons">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="btn-primary">Login</Link>
                  <Link to="/signup" className="btn-secondary">Sign Up</Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="public-container">
        <div className="country-selector-wrapper">
          <label>🌍 Business news from:</label>
          <select value={country} onChange={handleCountryChange} className="country-select">
            <option value="us">🇺🇸 United States</option>
            <option value="ng">🇳🇬 Nigeria</option>
            <option value="gb">🇬🇧 United Kingdom</option>
            <option value="ca">🇨🇦 Canada</option>
            <option value="au">🇦🇺 Australia</option>
            <option value="in">🇮🇳 India</option>
            <option value="cn">🇨🇳 China</option>
          </select>
        </div>
        <div className="news-section">
          <h2>📰 Latest Business News – {getCountryName(country)}</h2>
          {loading && <div className="loading-spinner">Loading fresh news...</div>}
          {error && <div className="error-message-public">Failed to load news. Please try again.</div>}
          <div className="news-grid">
            {!loading && !error && news.map((article, idx) => (
              <div key={idx} className="news-card">
                <div className="news-image-wrapper">
                  <img 
                    src={article.imageUrl || 'https://placehold.co/300x200?text=News'} 
                    alt={article.title} 
                    className="news-image"
                    onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=News'; }}
                  />
                </div>
                <div className="news-content">
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">
                    Read full story →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!isAuthenticated && (
          <div className="cta-banner">
            <p>Ready to test your investment strategy?</p>
            <Link to="/signup" className="cta-button">Get Started – It's Free</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPage;