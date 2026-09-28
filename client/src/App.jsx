import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConsignmentsPage from './pages/ConsignmentsPage';
import TrucksPage from './pages/TrucksPage';
import DispatchPage from './pages/DispatchPage';
import BranchesPage from './pages/BranchesPage';
import RatesPage from './pages/RatesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, requireManager = false }) => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner message="Verifying session credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireManager && !isManager) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="consignments" element={<ConsignmentsPage />} />
            <Route path="trucks" element={<TrucksPage />} />
            <Route path="dispatch" element={<DispatchPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="rates" element={<RatesPage />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute requireManager={true}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requireManager={true}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
