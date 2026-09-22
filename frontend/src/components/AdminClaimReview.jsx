import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminClaimReview = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/claims', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClaims(response.data.data || []);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (claimId, newStatus) => {
        setActionLoading(claimId);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `/api/claims/${claimId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update state locally
            setClaims((prev) =>
                prev.map((c) => (c._id === claimId ? { ...c, status: newStatus } : c))
            );
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update claim status.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div>Loading submitted claims...</div>;

    return (
        <div className="admin-claim-review">
            <h2>Claim Review Dashboard</h2>
            {claims.length === 0 ? (
                <p>No claims submitted yet.</p>
            ) : (
                <table className="claim-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                            <th>Student</th>
                            <th>Score</th>
                            <th>Proof Image</th>
                            <th>Verification Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claims.map((claim) => (
                            <tr key={claim._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td>
                                    <strong>{claim.studentName || claim.studentId?.fullName || 'N/A'}</strong>
                                    <br />
                                    <small>{claim.studentEmail || claim.studentId?.email}</small>
                                </td>
                                <td>
                                    <span
                                        style={{
                                            fontWeight: 'bold',
                                            color: claim.verificationScore >= 70 ? 'green' : 'orange',
                                        }}
                                    >
                                        {claim.verificationScore || 0}%
                                    </span>
                                </td>
                                <td>
                                    {claim.proofImage ? (
                                        <img
                                            src={claim.proofImage}
                                            alt="Claim Proof"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                                            onClick={() => setSelectedImage(claim.proofImage)}
                                        />
                                    ) : (
                                        <span style={{ color: '#888' }}>No Proof</span>
                                    )}
                                </td>
                                <td>
                                    <small>
                                        <strong>Brand:</strong> {claim.verificationAnswers?.brand} <br />
                                        <strong>Colour:</strong> {claim.verificationAnswers?.colour} <br />
                                        <strong>Location:</strong> {claim.verificationAnswers?.lostLocation}
                                    </small>
                                </td>
                                <td>
                                    <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                                </td>
                                <td>
                                    <button
                                        disabled={actionLoading === claim._id || claim.status === 'approved'}
                                        onClick={() => handleStatusUpdate(claim._id, 'approved')}
                                        style={{ marginRight: '8px', backgroundColor: '#28a745', color: '#fff' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        disabled={actionLoading === claim._id || claim.status === 'rejected'}
                                        onClick={() => handleStatusUpdate(claim._id, 'rejected')}
                                        style={{ backgroundColor: '#dc3545', color: '#fff' }}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <img src={selectedImage} alt="Full Proof Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} />
                </div>
            )}
        </div>
    );
};

export default AdminClaimReview;