import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Profile from './Profile';
import MyClaims from './MyClaims';
import MyReports from './MyReports';
import FindMyItem from './FindMyItem';
import ReportLost from './ReportLost';
import ReportFound from './ReportFound';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Dashboard DB Data state
  const [dashboardData, setDashboardData] = useState({
    stats: {
      lostReports: 0,
      potentialMatches: 0,
      pendingClaims: 0,
      recoveredItems: 0,
    },
    recentActivity: [],
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const studentName = user?.fullName || 'Student';
  const studentInitial = studentName.charAt(0).toUpperCase();

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const res = await api.get('/users/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
      setDashboardData({
        stats: {
          lostReports: 0,
          potentialMatches: 0,
          pendingClaims: 0,
          recoveredItems: 0,
        },
        recentActivity: [],
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateInput) => {
    if (!dateInput) return 'Recently';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

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
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Report Lost Item', label: 'Report Lost Item', icon: '🔍' },
    { id: 'Report Found Item', label: 'Report Found Item', icon: '📦' },
    { id: 'Find My Item', label: 'Find My Item', icon: '⚡' },
    { id: 'My Reports', label: 'My Reports', icon: '📋' },
    { id: 'My Claims', label: 'My Claims', icon: '🏷️' },
    { id: 'Profile', label: 'Profile', icon: '👤' },
  ];

  const actionCards = [
    {
      id: 'report-lost',
      title: 'Report Lost Item',
      desc: 'Lost something on campus? Register details so AI can match it with found items.',
      icon: '🔍',
      tab: 'Report Lost Item'
    },
    {
      id: 'report-found',
      title: 'Report Found Item',
      desc: 'Found an item? Hand it over or register location to reunite it with its owner.',
      icon: '📦',
      tab: 'Report Found Item'
    },
    {
      id: 'find-item',
      title: 'Find My Item',
      desc: 'Browse and search campus lost & found inventory with smart image matching.',
      icon: '⚡',
      tab: 'Find My Item'
    },
    {
      id: 'my-reports',
      title: 'My Reports',
      desc: 'Track status and active matches for all your submitted lost & found reports.',
      icon: '📋',
      tab: 'My Reports'
    },
    {
      id: 'my-claims',
      title: 'My Claims',
      desc: 'Review pending claim verifications and claim history for matched items.',
      icon: '🏷️',
      tab: 'My Claims'
    },
  ];

  const statsList = [
    { label: 'Lost Reports', value: dashboardData.stats?.lostReports || 0, icon: '🔍', color: 'rgba(239, 68, 68, 0.2)' },
    { label: 'Potential Matches', value: dashboardData.stats?.potentialMatches || 0, icon: '⚡', color: 'rgba(99, 102, 241, 0.2)' },
    { label: 'Pending Claims', value: dashboardData.stats?.pendingClaims || 0, icon: '🏷️', color: 'rgba(245, 158, 11, 0.2)' },
    { label: 'Recovered Items', value: dashboardData.stats?.recoveredItems || 0, icon: '✅', color: 'rgba(16, 185, 129, 0.2)' },
  ];

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">LF</div>
            <span>Lost & Found</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'Notifications') {
                  fetchNotifications();
                } else if (item.id === 'Dashboard') {
                  fetchDashboardData();
                }
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'Notifications' && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout} style={{ color: '#fca5a5' }}>
            <span className="sidebar-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-welcome">
            <h1 className="header-greeting">Welcome, {studentName}</h1>
            <span className="header-subtitle">
              {user?.department ? `${user.department} • ${user.year || 'Student'}` : 'Campus Lost & Found Portal'}
            </span>
          </div>

          <div className="header-actions" style={{ position: 'relative' }}>
            {/* Notification Icon */}
            <button
              className="icon-btn"
              title="Notifications"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                fetchNotifications();
              }}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* TOP-RIGHT NOTIFICATION DROPDOWN MENU */}
            {showNotifMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '55px',
                  width: '360px',
                  maxHeight: '440px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
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
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: '700' }}>
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
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                      No notifications yet. You're all caught up! 🎉
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
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{getNotifIcon(notif.type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: '700' }}>
                              {notif.title}
                            </strong>
                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
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

            {/* Profile Pill */}
            <div
              className="user-profile-badge"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('Profile')}
            >
              <div className="avatar-circle">{studentInitial}</div>
              <span className="user-name-text">{studentName.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <main className="dashboard-content">
          {activeTab === 'Profile' ? (
            <Profile />
          ) : activeTab === 'My Claims' || activeTab === 'my-claims' ? (
            <MyClaims />
          ) : activeTab === 'My Reports' || activeTab === 'my-reports' ? (
            <MyReports />
          ) : activeTab === 'Find My Item' || activeTab === 'find-my-item' ? (
            <FindMyItem />
          ) : activeTab === 'Report Lost Item' || activeTab === 'report-lost' ? (
            <ReportLost onReturnToDashboard={() => setActiveTab('Dashboard')} />
          ) : activeTab === 'Report Found Item' || activeTab === 'report-found' ? (
            <ReportFound onReturnToDashboard={() => setActiveTab('Dashboard')} />
          ) : (
            /* MAIN DASHBOARD CONTENT */
            <>
              {/* STATISTICS CARDS SECTION */}
              <section>
                <div className="stats-grid">
                  {statsList.map((stat, idx) => (
                    <div className="stat-card" key={idx}>
                      <div className="stat-info">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                      </div>
                      <div
                        className="stat-icon-wrapper"
                        style={{ backgroundColor: stat.color }}
                      >
                        {stat.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ACTION CARDS SECTION */}
              <section>
                <h2 className="section-header-title">
                  <span>⚡</span> Quick Actions
                </h2>
                <div className="actions-grid">
                  {actionCards.map((card) => (
                    <div
                      key={card.id}
                      className="action-card"
                      onClick={() => {
                        if (card.id === 'report-lost') {
                          navigate('/report-lost');
                        } else if (card.id === 'report-found') {
                          navigate('/report-found');
                        } else if (card.id === 'find-item') {
                          navigate('/find-my-item');
                        } else if (card.id === 'my-reports') {
                          navigate('/my-reports');
                        } else if (card.id === 'my-claims' || card.tab === 'My Claims') {
                          navigate('/my-claims');
                        } else if (card.id === 'notifications' || card.tab === 'Notifications') {
                          setActiveTab('Notifications');
                          fetchNotifications();
                        } else {
                          setActiveTab(card.tab);
                        }
                      }}
                    >
                      <div className="action-header">
                        <div className="action-icon">{card.icon}</div>
                        <span className="action-arrow">→</span>
                      </div>
                      <div>
                        <h3 className="action-title">{card.title}</h3>
                        <p className="action-desc">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* RECENT ACTIVITY SECTION */}
              <section>
                <h2 className="section-header-title">
                  <span>🕒</span> Recent Campus Activity
                </h2>
                <div className="activity-card">
                  {dashboardData.recentActivity.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No recent campus activity.</p>
                    </div>
                  ) : (
                    <div className="activity-table-wrapper">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th>Location</th>
                            <th>Reported</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recentActivity.map((activity) => (
                            <tr key={activity.id}>
                              <td style={{ fontWeight: '600' }}>{activity.item}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{activity.location}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(activity.date)}</td>
                              <td>
                                <span className={`status-pill ${activity.statusClass}`}>
                                  ● {activity.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
