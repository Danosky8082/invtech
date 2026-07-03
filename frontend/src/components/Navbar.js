import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = sessionStorage.getItem('token');
  const user = token ? JSON.parse(sessionStorage.getItem('user') || '{}') : null;

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">🏦 InvTech</Link>
        </div>
        <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span className="hamburger-icon">{menuOpen ? '✕' : '☰'}</span>
        </button>
        <div className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          {/* Always visible links */}
          <Link to="/faq" className="nav-link" onClick={() => setMenuOpen(false)}>FAQ</Link>
          <Link to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</Link>

          {!token ? (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          ) : (
            <>
              <span className="nav-user">👋 {user?.username || 'Investor'}</span>
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/predictive" className="nav-link" onClick={() => setMenuOpen(false)}>📊 Insights</Link>
              <Link to="/portfolio" className="nav-link" onClick={() => setMenuOpen(false)}>📂 Portfolio</Link>
              <Link to="/watchlist" className="nav-link" onClick={() => setMenuOpen(false)}>⭐ Watchlist</Link>
              {/* ✅ NEW Settings link */}
              <Link to="/settings" className="nav-link" onClick={() => setMenuOpen(false)}>⚙️ Settings</Link>
              <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;