import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch notifications for logged in user
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.log('Notification polling active/fallback');
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'potential_match':
        return '🔍';
      case 'claim_submitted':
        return '📋';
      case 'claim_approved':
        return '✅';
      case 'claim_rejected':
        return '❌';
      case 'item_returned':
        return '🎉';
      default:
        return '🔔';
    }
  };

  return (
    <nav className="navbar" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <NavLink to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.1rem' }}>
            LF
          </div>
          <span className="brand-text" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
            Campus Lost & Found
          </span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? '#a855f7' : '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' })}>
                Dashboard
              </NavLink>
              <NavLink to="/find-my-item" style={({ isActive }) => ({ color: isActive ? '#a855f7' : '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' })}>
                Find Matches
              </NavLink>
              <NavLink to="/my-claims" style={({ isActive }) => ({ color: isActive ? '#a855f7' : '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' })}>
                My Claims
              </NavLink>
              <NavLink to="/my-reports" style={({ isActive }) => ({ color: isActive ? '#a855f7' : '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' })}>
                My Reports
              </NavLink>

              {/* NOTIFICATION BELL ICON WITH UNREAD COUNTER BADGE */}
              <div style={{ position: 'relative' }}>
                <button
                  id="nav-notification-bell"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN MENU */}
                {showNotifMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '0',
                      top: '50px',
                      width: '360px',
                      maxHeight: '450px',
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                      zIndex: 1000,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: '700' }}>
                        Notifications ({unreadCount} unread)
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#a855f7',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            style={{
                              padding: '0.85rem',
                              borderRadius: '12px',
                              marginBottom: '0.5rem',
                              background: notif.isRead ? 'transparent' : 'rgba(168, 85, 247, 0.08)',
                              borderLeft: notif.isRead ? '3px solid transparent' : '3px solid #a855f7',
                              transition: 'background 0.2s',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{getNotifIcon(notif.type)}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: '700' }}>
                                  {notif.title}
                                </strong>
                                <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.3rem 0 0', lineHeight: '1.3' }}>
                                {notif.message}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(notif._id, e)}
                                title="Mark read"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#a855f7',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  padding: '2px',
                                }}
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* USER / LOGOUT */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: '600' }}>
                  {user?.fullName || 'Student'}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
                Login
              </NavLink>
              <NavLink to="/register" className="btn-register-glow" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderRadius: '10px', textDecoration: 'none' }}>
                Register
              </NavLink>
              <NavLink to="/admin/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                Admin Portal →
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
