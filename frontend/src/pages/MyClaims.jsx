import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState(null);

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/claims/my');
      if (response.data.success) {
        setClaims(response.data.data);
      }
    } catch (err) {
      console.error('Fetch my claims error:', err);
      setError('Failed to load your claim requests.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        label: 'Pending Team Review',
        icon: '⌛',
      };
    }
    if (s === 'under_review') {
      return {
        bg: 'rgba(99, 102, 241, 0.15)',
        color: '#818cf8',
        label: 'Under Review',
        icon: '🔍',
      };
    }
    if (s === 'approved') {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        label: 'Approved - Ready for Pickup',
        icon: '✅',
      };
    }
    if (s === 'rejected') {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        label: 'Rejected',
        icon: '❌',
      };
    }
    if (s === 'completed' || s === 'recovered') {
      return {
        bg: 'rgba(52, 211, 153, 0.15)',
        color: '#34d399',
        label: 'Recovered & Handed Over',
        icon: '🎉',
      };
    }
    return {
      bg: 'rgba(148, 163, 184, 0.15)',
      color: '#94a3b8',
      label: status || 'Submitted',
      icon: '📄',
    };
  };

  const toggleExpand = (id) => {
    setExpandedClaimId(expandedClaimId === id ? null : id);
  };

  return (
    <div style={{ padding: '2rem 1rem 4rem', maxWidth: '1050px', margin: '0 auto' }}>
      {/* PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div className="badge-pill" style={{ marginBottom: '0.5rem' }}>
            <span className="badge-dot" style={{ backgroundColor: '#ec4899', boxShadow: '0 0 8px #ec4899' }}></span> Student Care Claims
          </div>
          <h1 className="hero-heading" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            <span className="heading-white">My Submitted</span>{' '}
            <span className="heading-gradient">Claims</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Track the verification progress of your claim requests with the Lost & Found team
          </p>
        </div>

        <Link
          to="/find-my-item"
          className="btn-register-glow"
          style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
        >
          🔍 Search Potential Matches
        </Link>
      </div>

      {/* BODY CONTENT */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⌛</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>Loading your claim requests...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="alert-box alert-error" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span>⚠️</span> {error}
          </div>
          <button onClick={fetchMyClaims} className="btn-register-glow" style={{ padding: '0.6rem 1.5rem' }}>
            Retry Loading
          </button>
        </div>
      ) : claims.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Claims Submitted Yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            When you find a potential match for your lost item, click "Request Claim" to submit Student Care verification.
          </p>
          <Link to="/find-my-item" className="btn-register-glow" style={{ padding: '0.75rem 2rem', display: 'inline-block' }}>
            Go to Find My Item
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {claims.map((claim) => {
            const claimId = claim._id || claim.id;
            const statusBadge = getStatusBadgeStyle(claim.status);
            const dateStr = claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A';
            const isExpanded = expandedClaimId === claimId;
            const answers = claim.verificationAnswers || {};

            return (
              <div
                key={claimId}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  borderLeft: `4px solid ${statusBadge.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '0.25rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{statusBadge.icon}</span> {statusBadge.label}
                      </span>

                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Submitted: {dateStr}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.25rem' }}>
                      Claim Request #{claimId.slice(-8)}
                    </h3>

                    <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                      📍 <strong>Lost Location:</strong> {answers.lostLocation || 'N/A'} | 🕒 <strong>When:</strong> {answers.lostDateAndTime || 'N/A'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleExpand(claimId)}
                      className="btn-outline"
                      style={{
                        padding: '0.45rem 1.1rem',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        color: '#ec4899',
                        borderColor: 'rgba(236, 72, 153, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? 'Hide Verification Answers ▲' : 'View Submitted Answers ▼'}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE VERIFICATION ANSWERS */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '0.85rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Brand</span>
                      <strong style={{ color: '#ffffff' }}>{answers.brand || 'N/A'}</strong>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Colour</span>
                      <strong style={{ color: '#ffffff' }}>{answers.colour || 'N/A'}</strong>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Unique Mark</span>
                      <strong style={{ color: '#ffffff' }}>{answers.uniqueMark || 'None'}</strong>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Additional Identifying Feature</span>
                      <strong style={{ color: '#ffffff' }}>{answers.additionalFeature || 'None'}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyClaims;
