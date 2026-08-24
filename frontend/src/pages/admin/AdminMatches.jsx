import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/matches');
        if (res.data?.success) {
          setMatches(res.data.data || []);
        }
      } catch (err) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ffffff' }}>
          AI Match Intelligence Governance
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
          Real-time AI similarity pairings generated between lost reports and campus found inventory.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a855f7' }}>Loading AI match intelligence...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {matches.map((m) => (
            <div
              key={m._id}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', padding: '4px 10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem' }}>
                  AI Score: {m.matchScore}%
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{m.matchLevel}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '700' }}>LOST ITEM</div>
                  <div style={{ fontWeight: '700' }}>{m.lostItemId?.itemName || 'Lost Item'}</div>
                </div>
                <div style={{ textAlign: 'center', color: '#ec4899', fontWeight: '800' }}>⚡ MATCHED WITH ⚡</div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: '700' }}>FOUND INVENTORY ITEM</div>
                  <div style={{ fontWeight: '700' }}>{m.foundItemId?.itemName || 'Found Item'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>📍 {m.foundItemId?.location || 'Campus'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMatches;
