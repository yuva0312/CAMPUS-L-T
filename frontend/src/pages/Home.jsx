import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const [status, setStatus] = useState(null); // 'connected' | 'disconnected' | null

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        if (res.status === 200) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      })
      .catch(() => {
        setStatus('disconnected');
      });
  }, []);

  return (
    <div className="home-hero-container">
      {/* Left Mascot Art Section */}
      <div className="mascot-section">
        <div className="mascot-glow-bg"></div>
        <img 
          src="/mascot.png" 
          alt="Campus Lost & Found Mascot" 
          className="mascot-image" 
        />
      </div>

      {/* Right Hero Content Section */}
      <div className="hero-content">
        <div className="badge-pill">
          <span className="badge-dot"></span>
          AI-Powered Smart Campus Recovery
        </div>

        <h1 className="hero-heading">
          <span className="heading-gradient">Campus Lost & Found</span>
        </h1>

        <p className="hero-description">
          Find what you lost. Return what you found.
        </p>

        {justRegistered && (
          <div className="alert-box alert-success" style={{ margin: '1rem 0 1.5rem 0', maxWidth: '400px' }}>
            <span>✅</span> Registration successful! Please login to continue.
          </div>
        )}

        <div className="hero-btn-group">
          {justRegistered ? (
            <Link to="/login" className="btn-register-glow">
              Login
            </Link>
          ) : (
            <Link to="/register" className="btn-register-glow">
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;




