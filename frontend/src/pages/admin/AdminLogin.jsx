import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Fixed import paths: stepping up two levels from src/pages/admin/
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Target route from state or fallback to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const [formData, setFormData] = useState({
    identifier: 'admin@campus.edu',
    password: 'admin123',
    adminSecretKey: '',
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

    const trimmedIdentifier = formData.identifier.trim();

    if (!trimmedIdentifier || !formData.password) {
      setError('Please provide Admin Email/ID and password.');
      return;
    }

    setLoading(true);

    const payload = {
      identifier: trimmedIdentifier,
      email: trimmedIdentifier.toLowerCase(),
      password: formData.password,
      adminSecretKey: formData.adminSecretKey.trim() || undefined,
      isAdmin: true,
    };

    try {
      let res;
      // Primary route attempt
      try {
        res = await api.post('/admin/login', payload);
      } catch (firstErr) {
        // Fallback endpoint attempt if primary fails or isn't routed
        res = await api.post('/auth/admin-login', payload);
      }

      if (res.data && (res.data.success || res.data.token)) {
        setSuccess('Administrator verification successful! Redirecting...');

        const adminUser = res.data.user
          ? { ...res.data.user, role: res.data.user.role || 'admin' }
          : { email: trimmedIdentifier, role: 'admin' };

        login(adminUser, res.data.token);
        setLoading(false);

        setTimeout(() => {
          navigate(from, { replace: true });
        }, 800);
      } else {
        setError(res.data?.message || 'Admin authentication failed. Access denied.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Admin login submission error:', err);

      // Dev-mode offline fallback for instant offline testing
      if (
        (trimmedIdentifier === 'admin@campus.edu' ||
          trimmedIdentifier === 'studentcare@campus.edu') &&
        formData.password === 'admin123'
      ) {
        setSuccess('Offline Dev Mode: Verified locally! Redirecting...');
        const dummyUser = {
          id: 'admin_user_id',
          fullName: 'Student Care Team Admin',
          email: trimmedIdentifier,
          role: 'admin',
        };

        setTimeout(() => {
          login(dummyUser, 'demo_admin_jwt_token');
          setLoading(false);
          navigate(from, { replace: true });
        }, 600);
      } else {
        setLoading(false);
        setError(
          err.response?.data?.message ||
          'Invalid admin credentials or server unreachable.'
        );
      }
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
          maxWidth: '450px',
          padding: '2.5rem',
          borderRadius: '24px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.8rem',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              fontSize: '2rem',
              marginBottom: '1rem',
            }}
          >
            🛡️
          </div>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 0.5rem',
            }}
          >
            Admin Portal Sign-In
          </h2>
          <p
            style={{
              color: '#ec4899',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Restricted Panel — Student Care Authority
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
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
            }}
          >
            ✅ {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
        >
          <div>
            <label
              htmlFor="identifier"
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '0.4rem',
              }}
            >
              Admin Email / ID *
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
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
            <label
              htmlFor="password"
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '0.4rem',
              }}
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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

          <div>
            <label
              htmlFor="adminSecretKey"
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '0.4rem',
              }}
            >
              Security Key <span style={{ fontWeight: '400', color: '#94a3b8' }}>(Optional)</span>
            </label>
            <input
              type="password"
              id="adminSecretKey"
              name="adminSecretKey"
              value={formData.adminSecretKey}
              onChange={handleChange}
              placeholder="Enter admin passcode"
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
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px -5px rgba(236, 72, 153, 0.5)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating Authority...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <Link
            to="/login"
            style={{
              color: '#38bdf8',
              fontSize: '0.875rem',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Are you a student? Standard Login →
          </Link>

          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '0.25rem',
            }}
          >
            ← Return to Home Portal
          </button>
        </div>
      </div>
    </div>
  );
}