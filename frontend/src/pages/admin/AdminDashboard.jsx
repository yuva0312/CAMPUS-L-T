import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalLostReports: 0,
    totalFoundReports: 0,
    potentialMatches: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    returnedItems: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardStats = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const res = await api.get('/admin/dashboard');
        if (res.data?.success && isMounted) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Fetch dashboard stats error:', err);
      } finally {
        if (isInitial && isMounted) setLoading(false);
      }
    };

    fetchDashboardStats(true);

    const handleUpdateEvent = () => fetchDashboardStats(false);

    window.addEventListener('claimStatusChanged', handleUpdateEvent);
    window.addEventListener('dashboardStatsUpdated', handleUpdateEvent);
    window.addEventListener('focus', handleUpdateEvent);

    const intervalId = setInterval(() => {
      fetchDashboardStats(false);
    }, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener('claimStatusChanged', handleUpdateEvent);
      window.removeEventListener('dashboardStatsUpdated', handleUpdateEvent);
      window.removeEventListener('focus', handleUpdateEvent);
      clearInterval(intervalId);
    };
  }, []);

  const statCards = [
    { label: 'Total Lost Reports', value: stats.totalLostReports, icon: '🔍', color: '#6366f1', route: '/admin/lost-items' },
    { label: 'Total Found Reports', value: stats.totalFoundReports, icon: '📦', color: '#a855f7', route: '/admin/found-items' },
    { label: 'Potential Matches', value: stats.potentialMatches, icon: '⚡', color: '#ec4899', route: '/admin/matches' },
    { label: 'Pending Claims', value: stats.pendingClaims, icon: '⏳', color: '#f59e0b', route: '/admin/claims', highlight: true },
    { label: 'Approved Claims', value: stats.approvedClaims, icon: '✅', color: '#10b981', route: '/admin/claims' },
    { label: 'Rejected Claims', value: stats.rejectedClaims, icon: '❌', color: '#ef4444', route: '/admin/claims' },
    { label: 'Returned Items', value: stats.returnedItems, icon: '🎉', color: '#06b6d4', route: '/admin/found-items' },
  ];

  return (
    <div>
      {/* PAGE TITLE */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ffffff' }}>
          SC Dashboard Overview
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
          Live metrics, claim review controls, and inventory governance for the Student Care Team.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a855f7' }}>Loading dashboard metrics...</div>
      ) : (
        <>
          {/* 7 METRIC CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {statCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => navigate(card.route)}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: card.highlight ? `2px solid ${card.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, boxShadow 0.2s',
                  boxShadow: card.highlight ? `0 0 20px rgba(245, 158, 11, 0.2)` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{card.icon}</span>
                  {card.highlight && (
                    <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      Requires Action
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>{card.value}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.5rem', fontWeight: '600' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* QUICK ACTION BANNER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '20px',
              padding: '2rem',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#ffffff', fontSize: '1.3rem', fontWeight: '800' }}>
                Pending Claims Waiting for Review
              </h3>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '600px' }}>
                {stats.pendingClaims} claims require manual verification answer review by the Lost & Found Team. AI scores are provided for decision support.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/claims')}
              style={{
                padding: '0.85rem 2rem',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.5)',
              }}
            >
              Review Pending Claims →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
