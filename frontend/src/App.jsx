import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import MyReports from './pages/MyReports';
import FindMyItem from './pages/FindMyItem';
import ClaimItem from './pages/ClaimItem';
import MyClaims from './pages/MyClaims';
import Profile from './pages/Profile';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClaims from './pages/admin/AdminClaims';
import AdminLostItems from './pages/admin/AdminLostItems';
import AdminFoundItems from './pages/admin/AdminFoundItems';
import AdminMatches from './pages/admin/AdminMatches';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Student Routes */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-lost"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReportLost />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-found"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReportFound />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-my-item"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FindMyItem />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/claim/:matchId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ClaimItem />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-claims"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MyClaims />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MyReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/claims"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <AdminClaims />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/lost-items"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <AdminLostItems />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/found-items"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <AdminFoundItems />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <AdminMatches />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
