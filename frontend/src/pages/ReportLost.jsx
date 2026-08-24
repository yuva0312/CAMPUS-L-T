import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORY_OPTIONS = [
  'Mobile Phone',
  'Laptop',
  'Tablet',
  'Watch',
  'Wallet',
  'Bag',
  'Keys',
  'ID Card',
  'Books',
  'Earphones',
  'Glasses',
  'Water Bottle',
  'Stationery',
  'Other',
];

const LOCATION_OPTIONS = [
  'Hut cafe',
  'Rec cafe',
  'library(J block)',
  'Classroom',
  'Indoor Auditorium',
  'Playground',
  'swimming pool',
  'GYM',
  'Hostel',
  'Other',
];

const CLASSROOM_BLOCKS = [
  'A block',
  'B block',
  'C block',
  'D block',
  'Tifac core',
];

const ReportLost = ({ onReturnToDashboard }) => {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    if (typeof onReturnToDashboard === 'function') {
      onReturnToDashboard();
    }
    navigate('/dashboard');
  };

  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    itemName: '',
    location: '',
    classroomBlock: '',
    customLocation: '',
    specificLocation: '',
    lostDate: '',
    lostTime: '',
    timeRange: '',
    brand: '',
    colour: '',
    uniqueMark: '',
    specialFeature: '',
    damage: '',
    privateDescription: '',
    imageUrl: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

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

    // Validation
    const selectedCategory =
      formData.category === 'Other'
        ? formData.customCategory.trim()
        : formData.category;

    let selectedLocation = formData.location;
    if (formData.location === 'Classroom') {
      if (!formData.classroomBlock) {
        setError('Please select the classroom block (A block, B block, C block, D block, or Tifac core).');
        return;
      }
      selectedLocation = `Classroom (${formData.classroomBlock})`;
    } else if (formData.location === 'Other') {
      if (!formData.customLocation.trim()) {
        setError('Please specify the custom campus location.');
        return;
      }
      selectedLocation = formData.customLocation.trim();
    }

    if (!selectedCategory) {
      setError('Please select or specify an item category.');
      return;
    }

    if (!formData.itemName.trim()) {
      setError('Please enter the item name.');
      return;
    }

    if (!selectedLocation) {
      setError('Please select or specify the lost campus location.');
      return;
    }

    if (!formData.lostDate) {
      setError('Please select the date when the item was lost.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category: selectedCategory,
        itemName: formData.itemName.trim(),
        location: selectedLocation,
        specificLocation: formData.specificLocation.trim(),
        lostDate: formData.lostDate,
        lostTime: formData.lostTime,
        timeRange: formData.timeRange.trim(),
        brand: formData.brand.trim(),
        colour: formData.colour.trim(),
        uniqueMark: formData.uniqueMark.trim(),
        specialFeature: formData.specialFeature.trim(),
        damage: formData.damage.trim(),
        privateDescription: formData.privateDescription.trim(),
        imageUrl: formData.imageUrl,
      };

      const response = await api.post('/lost-items', payload);

      if (response.data.success) {
        setSubmittedReport(response.data.data);
      } else {
        setError(response.data.message || 'Failed to submit lost item report.');
      }
    } catch (err) {
      console.error('Submit report error:', err);
      setError(
        err.response?.data?.message ||
          'Server error while submitting report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedReport(null);
    setFormData({
      category: '',
      customCategory: '',
      itemName: '',
      location: '',
      classroomBlock: '',
      customLocation: '',
      specificLocation: '',
      lostDate: '',
      lostTime: '',
      timeRange: '',
      brand: '',
      colour: '',
      uniqueMark: '',
      specialFeature: '',
      damage: '',
      privateDescription: '',
      imageUrl: '',
    });
    setError('');
  };

  // Render Success Screen after submission
  if (submittedReport) {
    const reportId = submittedReport._id || submittedReport.id;

    return (
      <div className="form-page-container">
        <div className="glass-card success-card" style={{ maxWidth: '640px', margin: '2rem auto', textAlign: 'center' }}>
          <div className="success-icon-badge" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            🎉
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem', color: '#10b981' }}>
            Lost item reported successfully.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Your lost item report has been created and registered in the system.
          </p>

          <div 
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
              REPORT ID
            </span>
            <strong style={{ fontSize: '1.5rem', letterSpacing: '0.05em', color: '#ffffff' }}>
              {reportId}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleReturnToDashboard}
              className="btn-register-glow"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem', border: 'none', cursor: 'pointer' }}
            >
              Return to Dashboard
            </button>
            <Link to="/my-reports" className="btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '1rem', color: '#ffffff' }}>
              View My Reports
            </Link>
            <button
              onClick={handleResetForm}
              className="btn-outline"
              style={{ padding: '0.8rem 2rem', borderRadius: '14px', cursor: 'pointer' }}
            >
              Report Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-container" style={{ padding: '2rem 1rem 4rem' }}>
      <div className="glass-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div className="form-header" style={{ marginBottom: '2rem' }}>
          <div className="badge-pill" style={{ marginBottom: '0.75rem' }}>
            <span className="badge-dot"></span> Report Lost Item
          </div>
          <h1 className="hero-heading" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            <span className="heading-white">Report a</span>{' '}
            <span className="heading-gradient">Lost Item</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>
            Fill out the details below to log your lost item in the campus recovery system.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1 — ITEM INFORMATION */}
          <div className="form-section" style={{ marginBottom: '2.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.25rem', color: '#c084fc', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              SECTION 1 — ITEM INFORMATION
            </h3>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="category">Item Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                id="category"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Category --</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {formData.category === 'Other' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="customCategory">Specify Custom Category <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  id="customCategory"
                  name="customCategory"
                  className="form-input"
                  placeholder="e.g. Smartwatch Strap, Umbrella, Calculator"
                  value={formData.customCategory}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="itemName">Item Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                className="form-input"
                placeholder="e.g. Black Leather Wallet, iPhone 14 Pro"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* SECTION 2 — LOST LOCATION */}
          <div className="form-section" style={{ marginBottom: '2.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.25rem', color: '#c084fc', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              SECTION 2 — LOST LOCATION
            </h3>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="location">Campus Location <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                id="location"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Campus Location --</option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {formData.location === 'Classroom' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="classroomBlock">Select Classroom Block <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  id="classroomBlock"
                  name="classroomBlock"
                  className="form-input"
                  value={formData.classroomBlock}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Classroom Block --</option>
                  {CLASSROOM_BLOCKS.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.location === 'Other' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="customLocation">Specify Custom Location <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  id="customLocation"
                  name="customLocation"
                  className="form-input"
                  placeholder="e.g. Main Gate Bus Stop, Tennis Court"
                  value={formData.customLocation}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="specificLocation">Specific Location</label>
              <input
                type="text"
                id="specificLocation"
                name="specificLocation"
                className="form-input"
                placeholder="e.g. Canteen entrance near the staircase"
                value={formData.specificLocation}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SECTION 3 — LOST DATE AND TIME */}
          <div className="form-section" style={{ marginBottom: '2.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.25rem', color: '#c084fc', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              SECTION 3 — LOST DATE AND TIME
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="lostDate">Lost Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  id="lostDate"
                  name="lostDate"
                  className="form-input"
                  value={formData.lostDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostTime">Approximate Lost Time</label>
                <input
                  type="time"
                  id="lostTime"
                  name="lostTime"
                  className="form-input"
                  value={formData.lostTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label" htmlFor="timeRange">Time Range (Optional)</label>
              <input
                type="text"
                id="timeRange"
                name="timeRange"
                className="form-input"
                placeholder="e.g. 2:00 PM – 3:00 PM"
                value={formData.timeRange}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SECTION 4 — PRIVATE IDENTIFICATION INFORMATION */}
          <div className="form-section" style={{ marginBottom: '2.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.25rem', color: '#c084fc', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              SECTION 4 — PRIVATE IDENTIFICATION INFORMATION
            </h3>

            <div 
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#a5b4fc',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <span>
                These details are private and will not be publicly shown. They may be used for Student Care verification.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  className="form-input"
                  placeholder="e.g. Apple, Samsung, Titan"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="colour">Colour</label>
                <input
                  type="text"
                  id="colour"
                  name="colour"
                  className="form-input"
                  placeholder="e.g. Midnight Blue, Matte Black"
                  value={formData.colour}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="uniqueMark">Unique Mark</label>
              <input
                type="text"
                id="uniqueMark"
                name="uniqueMark"
                className="form-input"
                placeholder="e.g. Initial sticker 'Y.K', custom key chain attached"
                value={formData.uniqueMark}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="specialFeature">Special Feature</label>
              <input
                type="text"
                id="specialFeature"
                name="specialFeature"
                className="form-input"
                placeholder="e.g. Encrypted wallpaper lock, engraved text on back"
                value={formData.specialFeature}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="damage">Scratch / Damage</label>
              <input
                type="text"
                id="damage"
                name="damage"
                className="form-input"
                placeholder="e.g. Small hairline scratch on top right corner of screen"
                value={formData.damage}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="privateDescription">Additional Description</label>
              <textarea
                id="privateDescription"
                name="privateDescription"
                className="form-input"
                rows="3"
                placeholder="e.g. Contains student ID card inside back case and $20 bill in side slot"
                value={formData.privateDescription}
                onChange={handleChange}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn-register-glow"
              disabled={loading}
              style={{
                width: '100%',
                maxWidth: '360px',
                padding: '1rem 2rem',
                fontSize: '1.15rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Submitting Report...' : 'Submit Lost Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportLost;
