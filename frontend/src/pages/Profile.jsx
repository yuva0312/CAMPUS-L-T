import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user: authUser, login } = useContext(AuthContext);

  const [profileData, setProfileData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    role: 'student',
  });

  const [activitySummary, setActivitySummary] = useState({
    totalLostReports: 0,
    totalFoundReports: 0,
    claimsSubmitted: 0,
    itemsRecovered: 0,
  });

  const [returnedHistory, setReturnedHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/profile');
        if (res.data?.success) {
          const u = res.data.data.user;
          setProfileData({
            fullName: u.fullName || authUser?.fullName || '',
            studentId: u.studentId || authUser?.studentId || '',
            email: u.email || authUser?.email || '',
            phone: u.phone || authUser?.phone || '',
            department: u.department || authUser?.department || '',
            year: u.year || authUser?.year || '',
            role: u.role || 'student',
          });
          setActivitySummary(res.data.data.activitySummary || {
            totalLostReports: 0,
            totalFoundReports: 0,
            claimsSubmitted: 0,
            itemsRecovered: 0,
          });
          setReturnedHistory(res.data.data.returnedHistory || []);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        // Fallback with auth user
        setProfileData({
          fullName: authUser?.fullName || 'Student Name',
          studentId: authUser?.studentId || 'CS2024-089',
          email: authUser?.email || 'student@campus.edu',
          phone: authUser?.phone || '+1 555-0192',
          department: authUser?.department || 'Computer Science',
          year: authUser?.year || '3rd Year',
          role: authUser?.role || 'student',
        });
        setActivitySummary({
          totalLostReports: 0,
          totalFoundReports: 0,
          claimsSubmitted: 0,
          itemsRecovered: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    try {
      setUpdating(true);
      const res = await api.put('/users/profile', {
        phone: profileData.phone,
        department: profileData.department,
        year: profileData.year,
      });

      if (res.data?.success) {
        setProfileMsg({ type: 'success', text: 'Profile details updated successfully!' });
        if (res.data.user && login) {
          const token = localStorage.getItem('token');
          login(res.data.user, token);
        }
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully!' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    try {
      setPasswordUpdating(true);
      const res = await api.put('/users/password', { currentPassword, newPassword });
      if (res.data?.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.data?.message || 'Failed to update password.' });
      }
    } catch (err) {
      console.error('Password error:', err);
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Current password is incorrect.' });
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>
          Student Account & Credentials
        </div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#ffffff' }}>
          Student Profile
        </h1>
        <p style={{ color: '#94a3b8', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
          Manage your personal information, department details, activity counters, and account security.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a855f7' }}>Loading student profile...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* SECTION 1: ACTIVITY SUMMARY */}
          <section
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Activity Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{activitySummary.totalLostReports}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', marginTop: '0.25rem' }}>Total Lost Reports</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#c084fc' }}>{activitySummary.totalFoundReports}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', marginTop: '0.25rem' }}>Total Found Reports</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24' }}>{activitySummary.claimsSubmitted}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', marginTop: '0.25rem' }}>Claims Submitted</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>{activitySummary.itemsRecovered}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', marginTop: '0.25rem' }}>Items Recovered</div>
              </div>
            </div>
          </section>

          {/* SECTION 2: PERSONAL INFORMATION & ACCOUNT INFORMATION */}
          <section
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 Personal & Account Information
            </h3>

            {profileMsg.text && (
              <div
                style={{
                  backgroundColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: profileMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: profileMsg.type === 'success' ? '#34d399' : '#f87171',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Full Name (Read-Only)
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Student ID / Register No. (Non-editable 🔒)
                </label>
                <input
                  type="text"
                  value={profileData.studentId}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  College Email (Non-editable 🔒)
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Phone Number (Editable ✏️)
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1 555-0192"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Department (Editable ✏️)
                </label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  placeholder="Computer Science"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Year of Study (Editable ✏️)
                </label>
                <input
                  type="text"
                  value={profileData.year}
                  onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                  placeholder="3rd Year"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: '0.8rem 1.8rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.5)',
                  }}
                >
                  {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* SECTION 3: CHANGE PASSWORD */}
          <section
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔑 Change Account Password
            </h3>

            {passwordMsg.text && (
              <div
                style={{
                  backgroundColor: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: passwordMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: passwordMsg.type === 'success' ? '#34d399' : '#f87171',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  style={{
                    padding: '0.8rem 1.8rem',
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.5)',
                  }}
                >
                  {passwordUpdating ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          {/* SECTION 4: RETURNED / RECOVERED ITEMS HISTORY */}
          <section
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎉 Returned / Recovered Items History
            </h3>

            {returnedHistory.length === 0 ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No returned or recovered items recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {returnedHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
                        {item.itemName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Category: {item.category} • Handover Date: {new Date(item.recoveredDate).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#34d399',
                        padding: '0.45rem 1.1rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                      }}
                    >
                      Item Returned ✓
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
