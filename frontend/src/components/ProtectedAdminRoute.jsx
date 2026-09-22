import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedAdminRoute({ children }) {
  const { user, token, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Verifying admin authority...</p>
      </div>
    );
  }

  // Ensure user is authenticated and holds a valid session payload
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Verify administrator, staff, or elevated privileges
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'staff' ||
    user?.type === 'admin' ||
    user?.isAdmin === true ||
    user?.id === 'admin_user_id';

  if (!isAdmin) {
    // Redirect authenticated non-admin users back to student dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}