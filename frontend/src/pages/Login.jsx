import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.identifier.trim() || !formData.password) {
      setError('Please enter both Email/Student ID and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      if (response.data && response.data.success) {
        setSuccess(response.data.message || 'Login successful!');
        
        // Update global auth state & localStorage
        login(response.data.user, response.data.token);
        
        setLoading(false);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setError(response.data?.message || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Network error or server unreachable. Please verify server status.');
      }
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '480px' }}>
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Student Login</h2>
          <p className="auth-subtitle">Log in to report items and manage your claims</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="alert-box alert-success">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Identifier */}
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">
                Email Address or Student ID
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                className="form-input"
                placeholder="e.g. student@college.edu or STU202688"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
