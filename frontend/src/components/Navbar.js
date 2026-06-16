import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const user = token ? JSON.parse(sessionStorage.getItem('user') || '{}') : null;

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/');
    window.location.reload(); // force refresh to update navbar state
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏦 InvTech</Link>
      </div>
      <div className="navbar-links">
        {!token ? (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
          </>
        ) : (
          <>
            <span className="nav-user">👋 {user?.username || 'Investor'}</span>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
             <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
            <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;