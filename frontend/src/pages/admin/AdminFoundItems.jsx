import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminFoundItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/found-items');
        if (res.data?.success) {
          setItems(res.data.data || []);
        }
      } catch (err) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFoundItems();
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.foundDate || (a._id && String(a._id).length >= 8 ? parseInt(String(a._id).substring(0, 8), 16) * 1000 : 0) || 0).getTime();
    const timeB = new Date(b.createdAt || b.foundDate || (b._id && String(b._id).length >= 8 ? parseInt(String(b._id).substring(0, 8), 16) * 1000 : 0) || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ffffff' }}>
          Campus Found Inventory Inspection
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
          Full unredacted specifications for all found items stored in campus custody.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a855f7' }}>Loading found inventory...</div>
      ) : sortedItems.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '16px', color: '#94a3b8' }}>
          No found reports submitted yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {sortedItems.map((item) => (
            <div
              key={item._id}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '700' }}>{item.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    📅 {formatDateTime(item.createdAt || item.foundDate)}
                  </span>
                  <span style={{ backgroundColor: item.status === 'claimed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(236, 72, 153, 0.2)', color: item.status === 'claimed' ? '#34d399' : '#ec4899', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {item.status}
                  </span>
                </div>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: '700' }}>{item.itemName}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1rem' }}>📍 {item.location}</p>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Brand:</strong> {item.brand || 'Unspecified'}</div>
                <div><strong>Colour:</strong> {item.colour || 'Unspecified'}</div>
                <div><strong>Unique Mark:</strong> {item.uniqueMark || 'None'}</div>
                <div><strong>Special Feature:</strong> {item.specialFeature || 'None'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFoundItems;
