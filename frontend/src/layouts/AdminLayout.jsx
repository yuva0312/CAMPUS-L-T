import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/claims', label: 'Claims Review', icon: '📋' },
    { path: '/admin/lost-items', label: 'Lost Reports', icon: '🔍' },
    { path: '/admin/found-items', label: 'Found Inventory', icon: '📦' },
    { path: '/admin/matches', label: 'AI Match Intelligence', icon: '⚡' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ADMIN HEADER */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
              🛡️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                Student Care Team Portal
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Care & Governance Control
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>
                {user?.fullName || user?.name || 'Admin Authority'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email || 'admin@campus.edu'}</div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ADMIN MAIN CONTENT WITH SUB NAV */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
        {/* SIDEBAR NAVIGATION */}
        <aside style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', height: 'fit-content' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
            Main SC Menu
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #ec4899' : '3px solid transparent',
                })}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '1.25rem', paddingTop: '1rem' }}>
            <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', display: 'block', textAlign: 'center' }}>
              &larr; Switch to Student View
            </Link>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main>{children}</main>
      </div>
    </div>
  );
}