import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ClaimItem = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Passed state from Find My Item page or fallback match data
  const [matchData, setMatchData] = useState(
    location.state?.match || {
      foundItemId: matchId || '',
      category: '',
      generalItemName: '',
      foundLocation: '',
      foundDate: null,
      approximateTime: '',
      matchScore: 0,
      matchLevel: '',
    }
  );

  const [formData, setFormData] = useState({
    brand: '',
    colour: '',
    uniqueMark: '',
    lostLocation: '',
    lostDateAndTime: '',
    additionalFeature: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedClaim, setSubmittedClaim] = useState(null);

  useEffect(() => {
    if (!location.state?.match && matchId) {
      const fetchMatchInfo = async () => {
        try {
          const res = await api.get(`/found-items/${matchId}`);
          if (res.data?.success && res.data?.data) {
            const item = res.data.data;
            setMatchData({
              foundItemId: item._id || matchId,
              category: item.category || 'General Item',
              generalItemName: item.itemName || 'Found Campus Item',
              foundLocation: item.location || 'Campus Location',
              foundDate: item.foundDate || new Date(),
              approximateTime: item.foundTime || 'N/A',
              matchScore: 85,
              matchLevel: 'High Potential Match',
            });
          }
        } catch (err) {
          console.log('Match info auto-fetch fallback active');
        }
      };
      fetchMatchInfo();
    }
  }, [matchId, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.brand.trim() || !formData.colour.trim() || !formData.lostLocation.trim() || !formData.lostDateAndTime.trim()) {
      setError('Please complete all required verification questions marked with *');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/claims', {
        matchId: matchId || `match_${Date.now()}`,
        lostItemId: location.state?.lostItemId || null,
        foundItemId: matchData.foundItemId,
        verificationAnswers: formData,
      });

      if (response.data.success) {
        setSubmittedClaim(response.data.data);
      }
    } catch (err) {
      console.error('Submit claim error:', err);
      setError(err.response?.data?.message || 'Server error submitting claim request.');
    } finally {
      setLoading(false);
    }
  };

  const foundDateStr = matchData.foundDate
    ? new Date(matchData.foundDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <div style={{ padding: '2rem 1rem 4rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* PAGE HEADER */}
      <div className="form-header" style={{ marginBottom: '2rem' }}>
        <div className="badge-pill" style={{ marginBottom: '0.75rem' }}>
          <span className="badge-dot" style={{ backgroundColor: '#ec4899', boxShadow: '0 0 8px #ec4899' }}></span> Verification Protocol
        </div>
        <h1 className="hero-heading" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          <span className="heading-white">Claim Item</span>{' '}
          <span className="heading-gradient">Verification</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
          Answer Student Care verification questions to submit your claim request to the Student Care team.
        </p>
      </div>

      {submittedClaim ? (
        /* CONFIRMATION SCREEN */
        <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontWeight: '800', marginBottom: '0.5rem' }}>
            Your verification has been submitted.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
            Waiting for Lost & Found Team review. Claim Reference ID: <strong style={{ color: '#ec4899', fontFamily: 'monospace' }}>{submittedClaim._id || submittedClaim.id}</strong>.
          </p>

          <div
            style={{
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              marginBottom: '2rem',
              display: 'inline-block',
            }}
          >
            <span style={{ color: '#ec4899', fontWeight: '700' }}>● Current Status: Waiting for Lost & Found Team review</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/my-reports')} className="btn-register-glow" style={{ padding: '0.75rem 2rem' }}>
              View My Reports & Claims
            </button>
            <button onClick={() => navigate('/find-my-item')} className="btn-outline" style={{ padding: '0.75rem 2rem', color: '#ffffff' }}>
              Back to Find My Item
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: POTENTIAL MATCH SUMMARY (SAFE PUBLIC INFO ONLY) */}
          <div
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              borderLeft: '4px solid #ec4899',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Potential Match Summary
              </span>
              <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '800' }}>
                AI Score: {matchData.matchScore}% ({matchData.matchLevel})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>General Category</span>
                <strong style={{ color: '#ffffff' }}>{matchData.category || matchData.generalItemName}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Found Location</span>
                <strong style={{ color: '#ffffff' }}>{matchData.foundLocation}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Found Date</span>
                <strong style={{ color: '#ffffff' }}>{foundDateStr}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Approximate Time</span>
                <strong style={{ color: '#ffffff' }}>{matchData.approximateTime || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* NOTICE BANNER */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>🛡️</span>
            <span>
              <strong>Verification Requirement:</strong> The claim request will be submitted to the Lost & Found Verification Team. Claims are manually reviewed by campus staff to prevent false claims.
            </span>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* SECTION 2: VERIFICATION QUESTIONS FORM */}
          <form onSubmit={handleSubmit} className="form-card">
            <h2 style={{ fontSize: '1.3rem', color: '#ffffff', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              📝 Student Care Verification Questions
            </h2>

            {/* QUESTION 1 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                1. What is the brand? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Fastrack, Apple, Casio, Titan"
                className="form-input"
                required
              />
            </div>

            {/* QUESTION 2 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                2. What is the colour? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="colour"
                value={formData.colour}
                onChange={handleChange}
                placeholder="e.g. Matte Black with Silver Dial"
                className="form-input"
                required
              />
            </div>

            {/* QUESTION 3 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                3. What unique mark does it have?
              </label>
              <input
                type="text"
                name="uniqueMark"
                value={formData.uniqueMark}
                onChange={handleChange}
                placeholder="e.g. Small sticker on back, engraved initials, specific strap design"
                className="form-input"
              />
            </div>

            {/* QUESTION 4 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                4. Where did you lose it? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="lostLocation"
                value={formData.lostLocation}
                onChange={handleChange}
                placeholder="e.g. Near Canteen Table 4 / Library J Block 2nd floor"
                className="form-input"
                required
              />
            </div>

            {/* QUESTION 5 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                5. Approximately when did you lose it? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="lostDateAndTime"
                value={formData.lostDateAndTime}
                onChange={handleChange}
                placeholder="e.g. 17 August 2026 around 2:30 PM"
                className="form-input"
                required
              />
            </div>

            {/* QUESTION 6 */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontWeight: '600', color: '#e2e8f0' }}>
                6. Describe one additional identifying feature.
              </label>
              <textarea
                name="additionalFeature"
                value={formData.additionalFeature}
                onChange={handleChange}
                placeholder="e.g. Slight scratch on bottom right corner, leather band stitching detail"
                className="form-textarea"
                rows={3}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/find-my-item')}
                className="btn-outline"
                style={{ padding: '0.75rem 1.5rem', color: '#94a3b8' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-register-glow"
                style={{
                  padding: '0.75rem 2.25rem',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                }}
              >
                {loading ? 'Submitting Claim...' : 'Submit Claim Request'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ClaimItem;
