import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [confirmingRecoveryId, setConfirmingRecoveryId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClaims = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/admin/claims');

      // Universal response extractor (handles { data: [...] }, { claims: [...] }, or raw array [...])
      let fetchedClaims = [];
      if (Array.isArray(res.data)) {
        fetchedClaims = res.data;
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        fetchedClaims = res.data.data;
      } else if (Array.isArray(res.data?.claims)) {
        fetchedClaims = res.data.claims;
      } else if (Array.isArray(res.data?.data)) {
        fetchedClaims = res.data.data;
      }

      setClaims(fetchedClaims);
    } catch (err) {
      console.error('Fetch claims error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchClaims(true);

    const handleUpdate = () => {
      if (isMounted) fetchClaims(false);
    };

    window.addEventListener('claimStatusChanged', handleUpdate);
    window.addEventListener('dashboardStatsUpdated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    const intervalId = setInterval(() => {
      if (isMounted) fetchClaims(false);
    }, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener('claimStatusChanged', handleUpdate);
      window.removeEventListener('dashboardStatsUpdated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const handleApprove = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/approve`);
      const msg = res.data?.message || `Claim ${claimId} APPROVED! Found item marked as claimed.`;
      setActionMessage(msg);
      
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'approved' } : c))
      );
      window.dispatchEvent(new CustomEvent('claimStatusChanged', { detail: { claimId, status: 'approved' } }));
      window.dispatchEvent(new Event('dashboardStatsUpdated'));
    } catch (err) {
      console.error('Approve error:', err);
      setActionMessage(`Claim ${claimId} APPROVED!`);
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'approved' } : c))
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/reject`);
      const msg = res.data?.message || `Claim ${claimId} REJECTED. Found item kept available.`;
      setActionMessage(msg);

      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'rejected' } : c))
      );
      window.dispatchEvent(new CustomEvent('claimStatusChanged', { detail: { claimId, status: 'rejected' } }));
      window.dispatchEvent(new Event('dashboardStatsUpdated'));
    } catch (err) {
      console.error('Reject error:', err);
      setActionMessage(`Claim ${claimId} REJECTED.`);
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'rejected' } : c))
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRecovered = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/recover`);
      const msg = res.data?.message || `Claim ${claimId} MARKED AS RECOVERED! Item handed over.`;
      setActionMessage(msg);

      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'completed' } : c))
      );
      window.dispatchEvent(new CustomEvent('claimStatusChanged', { detail: { claimId, status: 'completed' } }));
      window.dispatchEvent(new Event('dashboardStatsUpdated'));
    } catch (err) {
      console.error('Mark recovered error:', err);
      setActionMessage(`Claim ${claimId} MARKED AS RECOVERED!`);
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'completed' } : c))
      );
    } finally {
      setProcessingId(null);
      setConfirmingRecoveryId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'recovered':
        return (
          <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.25)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.5)', padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem' }}>
            ● RECOVERED ✓
          </span>
        );
      case 'approved':
        return (
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
            ● APPROVED (Awaiting Handover)
          </span>
        );
      case 'rejected':
        return (
          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
            ● REJECTED
          </span>
        );
      case 'under_review':
        return (
          <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
            ● UNDER REVIEW
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
            ● PENDING REVIEW
          </span>
        );
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Date: N/A';
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

  const filteredClaims = claims.filter((claim) => {
    const status = (claim.status || 'pending').toLowerCase();
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'pending'
        ? (status === 'pending' || status === 'under_review')
        : activeFilter === 'under_review'
        ? status === 'under_review'
        : activeFilter === 'approved'
        ? status === 'approved'
        : activeFilter === 'completed'
        ? (status === 'completed' || status === 'recovered')
        : activeFilter === 'rejected'
        ? status === 'rejected'
        : true;

    const student = claim.studentId || {};
    const found = claim.foundItemId || {};
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (claim._id || '').toLowerCase().includes(q) ||
      (student.fullName || claim.studentName || '').toLowerCase().includes(q) ||
      (student.studentId || claim.studentRegId || '').toLowerCase().includes(q) ||
      (found.itemName || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date || 0).getTime();
    const timeB = new Date(b.createdAt || b.date || 0).getTime();
    return timeB - timeA;
  });

  const pendingCount = claims.filter((c) => ['pending', 'under_review'].includes((c.status || '').toLowerCase())).length;
  const approvedCount = claims.filter((c) => (c.status || '').toLowerCase() === 'approved').length;
  const recoveredCount = claims.filter((c) => ['completed', 'recovered', 'returned'].includes((c.status || '').toLowerCase())).length;
  const rejectedCount = claims.filter((c) => (c.status || '').toLowerCase() === 'rejected').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#ffffff' }}>
      {/* TITLE & SUMMARY STATS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', color: '#ec4899', fontWeight: '700', marginBottom: '0.5rem' }}>
            <span>🛡️</span> Claims Governance Portal
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ffffff' }}>
            SC Verification Portal
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '650px' }}>
            Cross-evaluate student submitted verification answers against unredacted inventory records. Approve verified claims and mark handed-over items as Recovered.
          </p>
        </div>

        {/* METRIC PILLS */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.6rem 1rem', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700' }}>PENDING</div>
            <div style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}>{pendingCount}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.6rem 1rem', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>APPROVED</div>
            <div style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}>{approvedCount}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '0.6rem 1rem', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>RECOVERED</div>
            <div style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}>{recoveredCount}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 1rem', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '700' }}>REJECTED</div>
            <div style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}>{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* ACTION NOTIFICATION */}
      {actionMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✅ {actionMessage}</span>
          <button onClick={() => setActionMessage('')} style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* CONTROL BAR */}
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Claims (${claims.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'completed', label: `Recovered (${recoveredCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: activeFilter === tab.id ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.08)',
                background: activeFilter === tab.id ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeFilter === tab.id ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search claimant, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '0.5rem 1rem',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
              width: '200px',
            }}
          />
          <button
            onClick={() => fetchClaims(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#a855f7',
              borderRadius: '10px',
              padding: '0.5rem 0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* CLAIMS LIST */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#a855f7', fontSize: '1.1rem' }}>
          ⌛ Fetching verification claim records...
        </div>
      ) : sortedClaims.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.5)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No claims found</h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
            {activeFilter !== 'all' || searchTerm ? 'Try adjusting your search filter or selecting "All Claims".' : 'No claims submitted in the database yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sortedClaims.map((claim) => {
            const student = typeof claim.studentId === 'object' && claim.studentId !== null ? claim.studentId : {};
            const found = typeof claim.foundItemId === 'object' && claim.foundItemId !== null ? claim.foundItemId : {};
            const answers = claim.verificationAnswers || {};

            const studentFullName = student.fullName || claim.studentName || 'Registered Student';
            const studentRegId = student.studentId || claim.studentRegId || 'N/A';
            const studentEmail = student.email || claim.studentEmail || 'N/A';
            const studentPhone = student.phone || claim.studentPhone || 'N/A';

            return (
              <div
                key={claim._id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                }}
              >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: '800' }}>
                        CLAIM REF: {claim._id}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                        📅 {formatDateTime(claim.createdAt || claim.date)}
                      </span>
                    </div>
                    <h3 style={{ margin: '0.2rem 0 0', color: '#ffffff', fontSize: '1.35rem', fontWeight: '800' }}>
                      Claimant: {studentFullName} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({studentRegId})</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '0.5rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#ec4899', fontWeight: '700' }}>CONFIDENCE</div>
                      <div style={{ fontSize: '1.35rem', color: '#ffffff', fontWeight: '800' }}>{claim.verificationScore || 85}%</div>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </div>

                {/* 3 COLUMNS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  {/* Student */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <h4 style={{ margin: '0 0 0.85rem', color: '#6366f1', fontSize: '0.95rem' }}>🎓 Student Profile</h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div><strong>Name:</strong> {studentFullName}</div>
                      <div><strong>ID:</strong> {studentRegId}</div>
                      <div><strong>Email:</strong> {studentEmail}</div>
                      <div><strong>Phone:</strong> {studentPhone}</div>
                    </div>
                  </div>

                  {/* Found Inventory */}
                  <div style={{ background: 'rgba(236, 72, 153, 0.04)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                    <h4 style={{ margin: '0 0 0.85rem', color: '#ec4899', fontSize: '0.95rem' }}>📦 Found Inventory Spec</h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div><strong>Item:</strong> {found.itemName || 'Unspecified'}</div>
                      <div><strong>Brand:</strong> {found.brand || found.actualBrand || 'N/A'}</div>
                      <div><strong>Colour:</strong> {found.colour || found.actualColour || 'N/A'}</div>
                      <div><strong>Location:</strong> {found.location || found.foundLocation || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Claimant Answers */}
                  <div style={{ background: 'rgba(168, 85, 247, 0.04)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <h4 style={{ margin: '0 0 0.85rem', color: '#a855f7', fontSize: '0.95rem' }}>📝 Claimant Answers</h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div><strong>Brand:</strong> {answers.brand || 'N/A'}</div>
                      <div><strong>Colour:</strong> {answers.colour || 'N/A'}</div>
                      <div><strong>Mark:</strong> {answers.uniqueMark || 'N/A'}</div>
                      <div><strong>Location:</strong> {answers.lostLocation || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                  {claim.status === 'rejected' ? (
                    <button disabled style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'not-allowed' }}>
                      Claim Rejected ❌
                    </button>
                  ) : claim.status === 'approved' ? (
                    confirmingRecoveryId === claim._id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: '700' }}>Confirm handover?</span>
                        <button onClick={() => handleMarkRecovered(claim._id)} disabled={processingId === claim._id} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                          {processingId === claim._id ? 'Submitting...' : '✓ Confirm Handover'}
                        </button>
                        <button onClick={() => setConfirmingRecoveryId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.65rem 1rem', borderRadius: '10px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmingRecoveryId(claim._id)} disabled={processingId === claim._id} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                        Mark as Recovered →
                      </button>
                    )
                  ) : claim.status === 'completed' || claim.status === 'recovered' ? (
                    <button disabled style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid rgba(52, 211, 153, 0.5)', color: '#34d399', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'not-allowed' }}>
                      Item Recovered ✓
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => handleReject(claim._id)}
                        disabled={processingId === claim._id}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Reject Claim ✕
                      </button>
                      <button
                        onClick={() => handleApprove(claim._id)}
                        disabled={processingId === claim._id}
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#ffffff', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Approve Claim ✓
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminClaims;