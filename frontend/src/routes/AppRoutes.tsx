import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { OverseasCVBuilderPage } from '../pages/OverseasCVBuilderPage';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { PageLoader } from '../components/ui/loading';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/overseas-cv" element={<OverseasCVBuilderPage />} />

        {/* Redirect all other routes directly to Overseas Gulf CV Builder */}
        <Route path="/dashboard" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/ai-builder" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/templates" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/resumes/*" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/ai-assistant" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/profile" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/jobs" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/candidates/*" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/documents" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/employers" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/demands" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/medicals" element={<Navigate to="/overseas-cv" replace />} />
        <Route path="/visas" element={<Navigate to="/overseas-cv" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
