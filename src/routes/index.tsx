import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Pages
import { LandingPage } from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';

import ChangePasswordPage from '../pages/auth/ChangePasswordPage';

// Dashboard Components
import AdminDashboard from '../components/dashboard/admin/AdminDashboard';
import { TPODashboard } from '../components/dashboard/tpo/TPODashboard';
import { StudentDashboard } from '../components/dashboard/student/StudentDashboard';

// Common Components
import { Layout } from '../components/common/Layout';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Role-based route protection
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.role !== 'admin') return <Navigate to="/unauthorized" />;
    return <>{children}</>;
  };

  const TPORoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.role !== 'tpo') return <Navigate to="/unauthorized" />;
    return <>{children}</>;
  };

  const StudentRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.role !== 'student') return <Navigate to="/unauthorized" />;
    return <>{children}</>;
  };

  // Redirect authenticated users to their dashboard
  const AuthenticatedRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" />;
      case 'tpo':
        return <Navigate to="/tpo/dashboard" />;
      case 'student':
        return <Navigate to="/student/dashboard" />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Password Change Route */}
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />
        
        <Route
          path="/tpo/dashboard"
          element={
            <TPORoute>
              <Layout>
                <TPODashboard />
              </Layout>
            </TPORoute>
          }
        />
        
        <Route
          path="/student/dashboard"
          element={
            <StudentRoute>
              <Layout>
                <StudentDashboard />
              </Layout>
            </StudentRoute>
          }
        />

        {/* Default redirect for authenticated users */}
        <Route path="/dashboard" element={<AuthenticatedRedirect />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;