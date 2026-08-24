import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' | 'found'
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError('');

      const [lostRes, foundRes] = await Promise.allSettled([
        api.get('/lost-items/my'),
        api.get('/found-items/my'),
      ]);

      if (lostRes.status === 'fulfilled' && lostRes.value.data.success) {
        setLostItems(lostRes.value.data.data);
      }

      if (foundRes.status === 'fulfilled' && foundRes.value.data.success) {
        setFoundItems(foundRes.value.data.data);
      }
    } catch (err) {
      console.error('Fetch my reports error:', err);
      setError('Failed to load your reports. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status, type) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'searching' || statusLower === 'reported') {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        label: statusLower === 'searching' ? 'Searching' : 'Reported',
      };
    }
    if (statusLower === 'potential_match' || statusLower === 'matched' || statusLower === 'under_review') {
      return {
        bg: 'rgba(99, 102, 241, 0.15)',
        color: '#818cf8',
        label: statusLower === 'potential_match' ? 'Potential Match' : statusLower === 'matched' ? 'Matched' : 'Under Review',
      };
    }
    if (statusLower === 'claimed' || statusLower === 'claim_pending') {
      return {
        bg: 'rgba(236, 72, 153, 0.15)',
        color: '#ec4899',
        label: statusLower === 'claimed' ? 'Claimed' : 'Claim Pending',
      };
    }
    if (statusLower === 'recovered' || statusLower === 'returned') {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        label: statusLower === 'recovered' ? 'Recovered' : 'Returned',
      };
    }
    return {
      bg: 'rgba(148, 163, 184, 0.15)',
      color: '#94a3b8',
      label: status || 'Closed',
    };
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
          <h1 className="hero-heading" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            <span className="heading-white">My Campus</span>{' '}
            <span className="heading-gradient">Reports</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Track and manage all your submitted lost and found item reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/dashboard"
            className="btn-outline"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.95rem',
              borderRadius: '14px',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/find-my-item"
            className="btn-outline"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.95rem',
              borderRadius: '14px',
              color: '#a855f7',
              borderColor: 'rgba(168, 85, 247, 0.3)',
            }}
          >
            ⚡ Find Matches
          </Link>
          <Link
            to="/report-lost"
            className="btn-register-glow"
            style={{ padding: '0.65rem 1.35rem', fontSize: '0.95rem' }}
          >
            + Report Lost Item
          </Link>
          <Link
            to="/report-found"
            className="btn-outline"
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.95rem',
              borderRadius: '14px',
              color: '#10b981',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            + Report Found Item
          </Link>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => setActiveTab('lost')}
          style={{
            background: activeTab === 'lost' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
            color: activeTab === 'lost' ? '#ffffff' : '#94a3b8',
            border: activeTab === 'lost' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            padding: '0.65rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🔍 Lost Items</span>
          <span
            style={{
              background: activeTab === 'lost' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              padding: '0.15rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
            }}
          >
            {lostItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('found')}
          style={{
            background: activeTab === 'found' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'transparent',
            color: activeTab === 'found' ? '#ffffff' : '#94a3b8',
            border: activeTab === 'found' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            padding: '0.65rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <span>📦 Found Items</span>
          <span
            style={{
              background: activeTab === 'found' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              padding: '0.15rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
            }}
          >
            {foundItems.length}
          </span>
        </button>
      </div>

      {/* BODY CONTENT */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⌛</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>Loading your reports...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="alert-box alert-error" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span>⚠️</span> {error}
          </div>
          <button onClick={fetchAllReports} className="btn-register-glow" style={{ padding: '0.6rem 1.5rem' }}>
            Retry Loading
          </button>
        </div>
      ) : activeTab === 'lost' ? (
        /* LOST ITEMS TAB */
        lostItems.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Lost Items Reported</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
              You haven't reported any lost items on campus yet. If you've lost something, log a report so our system can match it.
            </p>
            <Link to="/report-lost" className="btn-register-glow" style={{ padding: '0.75rem 2rem', display: 'inline-block' }}>
              Report a Lost Item
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {lostItems.map((item) => {
              const statusBadge = getStatusBadgeStyle(item.status, 'lost');
              const reportId = item._id || item.id;
              const dateStr = item.lostDate ? new Date(item.lostDate).toLocaleDateString() : 'N/A';

              return (
                <div
                  key={reportId}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    borderLeft: '4px solid #6366f1',
                  }}
                >
                  <div style={{ flex: '1', minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <span
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          color: '#c084fc',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        ● {statusBadge.label}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
                      {item.itemName}
                    </h3>

                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      📍 <strong>Location:</strong> {item.location} {item.specificLocation ? `(${item.specificLocation})` : ''}
                      <br />
                      📅 <strong>Lost Date:</strong> {dateStr} {item.lostTime ? `| 🕒 ${item.lostTime}` : ''} {item.timeRange ? `(${item.timeRange})` : ''}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                      ID: {reportId}
                    </span>
                    <button
                      onClick={() => setSelectedModalItem({ ...item, reportType: 'Lost Item' })}
                      className="btn-outline"
                      style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#c084fc',
                        borderColor: 'rgba(168, 85, 247, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* FOUND ITEMS TAB */
        foundItems.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Found Items Reported</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
              You haven't reported any found items on campus yet. If you found someone's lost item, report it to help reunite them.
            </p>
            <Link
              to="/report-found"
              className="btn-register-glow"
              style={{
                padding: '0.75rem 2rem',
                display: 'inline-block',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              }}
            >
              Report a Found Item
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {foundItems.map((item) => {
              const statusBadge = getStatusBadgeStyle(item.status, 'found');
              const reportId = item._id || item.id;
              const dateStr = item.foundDate ? new Date(item.foundDate).toLocaleDateString() : 'N/A';

              return (
                <div
                  key={reportId}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    borderLeft: '4px solid #10b981',
                  }}
                >
                  <div style={{ flex: '1', minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34d399',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        ● {statusBadge.label}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
                      {item.itemName}
                    </h3>

                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      📍 <strong>Found Location:</strong> {item.location} {item.specificLocation ? `(${item.specificLocation})` : ''}
                      <br />
                      📅 <strong>Found Date:</strong> {dateStr} {item.foundTime ? `| 🕒 ${item.foundTime}` : ''} {item.timeRange ? `(${item.timeRange})` : ''}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                      ID: {reportId}
                    </span>
                    <button
                      onClick={() => setSelectedModalItem({ ...item, reportType: 'Found Item' })}
                      className="btn-outline"
                      style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#34d399',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(7, 10, 19, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedModalItem(null)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedModalItem(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.1rem',
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                {selectedModalItem.reportType}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                ID: {selectedModalItem._id || selectedModalItem.id}
              </span>
            </div>

            <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontWeight: '800', marginBottom: '1rem' }}>
              {selectedModalItem.itemName}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Category</span>
                <strong style={{ color: '#ffffff' }}>{selectedModalItem.category}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Location</span>
                <strong style={{ color: '#ffffff' }}>{selectedModalItem.location}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Date</span>
                <strong style={{ color: '#ffffff' }}>
                  {new Date(selectedModalItem.lostDate || selectedModalItem.foundDate).toLocaleDateString()}
                </strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Status</span>
                <strong style={{ color: '#10b981', textTransform: 'capitalize' }}>
                  {selectedModalItem.status.replace('_', ' ')}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'right',
              }}
            >
              <button
                onClick={() => setSelectedModalItem(null)}
                className="btn-register-glow"
                style={{
                  padding: '0.6rem 1.75rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
