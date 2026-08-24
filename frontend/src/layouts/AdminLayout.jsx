import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
                {user?.fullName || 'Admin Authority'}
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
            <NavLink
              to="/admin/dashboard"
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
              📊 Dashboard
            </NavLink>

            <NavLink
              to="/admin/claims"
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
              📋 Claims Review
            </NavLink>

            <NavLink
              to="/admin/lost-items"
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
              🔍 Lost Reports
            </NavLink>

            <NavLink
              to="/admin/found-items"
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
              📦 Found Inventory
            </NavLink>

            <NavLink
              to="/admin/matches"
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
              ⚡ AI Match Intelligence
            </NavLink>
          </nav>
        </aside>

        {/* MAIN BODY AREA */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
