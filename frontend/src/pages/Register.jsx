import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Machine Learning',
    'Artificial Intelligence & Data Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Business Administration / Management',
    'Other',
  ];

  const years = [
    '1st Year (Freshman)',
    '2nd Year (Sophomore)',
    '3rd Year (Junior)',
    '4th Year (Senior)',
    'Postgraduate / Masters',
    'Ph.D. / Research Scholar',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    const { fullName, studentId, email, phone, department, year, password, confirmPassword } = formData;

    if (
      !fullName.trim() ||
      !studentId.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !department ||
      !year ||
      !password ||
      !confirmPassword
    ) {
      return 'All required fields must be completed.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid college email address.';
    }

    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return 'Please enter a valid phone number (at least 7 digits).';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      return 'Password and Confirm Password do not match.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(), // Dual payload naming support
        studentId: formData.studentId.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        year: formData.year,
        password: formData.password,
      };

      const response = await api.post('/auth/register', payload);

      if (response.data && (response.data.success || response.data.token)) {
        setSuccess('Registration successful! Redirecting...');

        // Save active session if backend responds with user and token credentials
        if (response.data.token && response.data.user) {
          login(response.data.user, response.data.token);
        }

        setTimeout(() => {
          navigate('/dashboard', { state: { registered: true } });
        }, 1200);
      } else {
        setError(response.data?.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.error('Registration submit error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message && err.message !== 'Network Error') {
        setError(err.message);
      } else {
        setError('Network error or server unreachable. Please verify backend status on port 5000.');
      }
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '580px', margin: '2.5rem auto', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="auth-card">
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="auth-title" style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#0f172a' }}>
            Student Registration
          </h2>
          <p className="auth-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Create your campus account to report lost belongings or return found items.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="alert-box alert-success" style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '0.875rem' }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-input"
              placeholder="e.g. Alex Johnson"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Student ID / Reg No. *
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                className="form-input"
                placeholder="e.g. STU202688"
                value={formData.studentId}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                placeholder="e.g. +1 555-0199"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
              College Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="e.g. student@college.edu"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="department" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Department *
              </label>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="year" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Academic Year *
              </label>
              <select
                id="year"
                name="year"
                className="form-select"
                value={formData.year}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
              >
                <option value="">Select Academic Year</option>
                {years.map((y, index) => (
                  <option key={index} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: loading ? '#94a3b8' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer-text" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link" style={{ color: '#0284c7', fontWeight: '600', textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}