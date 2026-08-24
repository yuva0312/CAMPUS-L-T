import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();

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
    // Clear error on change
    if (error) setError('');
  };

  const validateForm = () => {
    const { fullName, studentId, email, phone, department, year, password, confirmPassword } = formData;

    if (!fullName.trim() || !studentId.trim() || !email.trim() || !phone.trim() || !department || !year || !password || !confirmPassword) {
      return 'All fields are required. Please complete the form.';
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid college email address.';
    }

    // Phone validation (digits, minimum 7 characters)
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return 'Please enter a valid phone number (at least 7 digits).';
    }

    // Password length check
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    // Confirm password match check
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
      const response = await api.post('/auth/register', {
        fullName: formData.fullName,
        studentId: formData.studentId,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        password: formData.password,
      });

      if (response.data && response.data.success) {
        setSuccess('Registration successful! Redirecting to home...');
        setLoading(false);
        // Redirect to Home with registered state after 1.5 seconds
        setTimeout(() => {
          navigate('/', { state: { registered: true } });
        }, 1500);
      } else {
        setError(response.data?.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Network error or server unreachable. Please check backend status.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Student Registration</h2>
          <p className="auth-subtitle">Create your campus account to report lost belongings or return found items</p>
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
          <div className="form-grid">
            {/* 1. Full Name */}
            <div className="form-group full-width">
              <label className="form-label" htmlFor="fullName">
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
              />
            </div>

            {/* 2. Student ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="studentId">
                Student ID / Register Number *
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
              />
            </div>

            {/* 3. College Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
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
              />
            </div>

            {/* 4. Phone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
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
              />
            </div>

            {/* 5. Department */}
            <div className="form-group full-width">
              <label className="form-label" htmlFor="department">
                Department *
              </label>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Year */}
            <div className="form-group full-width">
              <label className="form-label" htmlFor="year">
                Academic Year *
              </label>
              <select
                id="year"
                name="year"
                className="form-select"
                value={formData.year}
                onChange={handleChange}
                required
              >
                <option value="">Select Academic Year</option>
                {years.map((y, index) => (
                  <option key={index} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
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
              />
            </div>

            {/* 8. Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
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
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
