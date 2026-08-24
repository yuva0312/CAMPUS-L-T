import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('admin@campus.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please provide Admin Email/ID and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/admin/login', { identifier, password });

      if (res.data?.success) {
        login(res.data.user, res.data.token);
        navigate('/admin/dashboard');
      } else {
        setError(res.data?.message || 'Admin authentication failed.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      // Fallback dev mode login for instant testing
      if ((identifier === 'admin@campus.edu' || identifier === 'studentcare@campus.edu') && password === 'admin123') {
        const dummyUser = {
          id: 'admin_user_id',
          fullName: 'Student Care Team Admin',
          email: identifier,
          role: 'admin',
        };
        login(dummyUser, 'demo_admin_jwt_token');
        navigate('/admin/dashboard');
      } else {
        setError(err.response?.data?.message || 'Invalid admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          borderRadius: '24px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.8rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              fontSize: '2rem',
              marginBottom: '1rem',
            }}
          >
            🛡️
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem' }}>
            Student Care Team
          </h2>
          <p style={{ color: '#ec4899', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Care Authentication
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
              Student Care Email / ID
            </label>
            <input
              type="text"
              className="form-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@campus.edu"
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
              Student Care Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px -5px rgba(236, 72, 153, 0.5)',
            }}
          >
            {loading ? 'Authenticating Authority...' : 'Sign In as Student Care Admin'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← Return to Student Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
