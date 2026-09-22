import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Primary Header */}
      <header style={{ background: '#1e293b', color: '#fff', padding: '0.75rem 1.5rem' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Quick Menu
            </button>
            <Link to="/" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'none' }}>
              Campus Lost & Found
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Dashboard</Link>
                <Link to="/find-my-item" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Find Item</Link>
                <Link to="/report-lost" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Report Lost</Link>
                <Link to="/report-found" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Report Found</Link>
                <Link to="/my-claims" style={{ color: '#cbd5e1', textDecoration: 'none' }}>My Claims</Link>
                <Link to="/profile" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  {user?.name || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Login</Link>
                <Link to="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Register</Link>
                <button
                  onClick={() => navigate('/admin/login')}
                  style={{
                    backgroundColor: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Slide-out Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
          }}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            style={{
              width: '320px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '2rem',
              boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Portal Sign-In</h3>
            <p style={{ color: '#64748b' }}>Select your portal access path:</p>
            <button
              onClick={() => { setIsSidebarOpen(false); navigate('/login'); }}
              style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}
            >
              Student Sign In
            </button>
            <button
              onClick={() => { setIsSidebarOpen(false); navigate('/admin/login'); }}
              style={{ width: '100%', padding: '0.6rem', cursor: 'pointer' }}
            >
              Admin Sign In
            </button>
          </div>
        </div>
      )}

      {/* Page Content Viewport */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Campus Lost & Found System</p>
      </footer>
    </div>
  );
}