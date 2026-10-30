import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Route Lazy Loading for minimal initial payload and lightning-fast FCP/LCP
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const Product = lazy(() => import('@/pages/Product').then(m => ({ default: m.Product })));
const About = lazy(() => import('@/pages/About').then(m => ({ default: m.About })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));

const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const URLScanner = lazy(() => import('@/pages/dashboard/URLScanner').then(m => ({ default: m.URLScanner })));
const QRScanner = lazy(() => import('@/pages/dashboard/QRScanner').then(m => ({ default: m.QRScanner })));
const MessageAnalysis = lazy(() => import('@/pages/dashboard/MessageAnalysis').then(m => ({ default: m.MessageAnalysis })));
const AttachmentAnalysis = lazy(() => import('@/pages/dashboard/AttachmentAnalysis').then(m => ({ default: m.AttachmentAnalysis })));
const IncidentReport = lazy(() => import('@/pages/dashboard/IncidentReport').then(m => ({ default: m.IncidentReport })));
const ScanHistory = lazy(() => import('@/pages/dashboard/ScanHistory').then(m => ({ default: m.ScanHistory })));
const MyReports = lazy(() => import('@/pages/dashboard/MyReports').then(m => ({ default: m.MyReports })));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const IncidentManagement = lazy(() => import('@/pages/admin/IncidentManagement').then(m => ({ default: m.IncidentManagement })));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs').then(m => ({ default: m.AuditLogs })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <LoadingSpinner size="lg" />
    <span className="text-xs text-slate-400 font-mono">Loading security modules...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              {/* Public Marketing & Info Pages */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/scan" element={<div className="max-w-5xl mx-auto px-4 py-8 w-full"><URLScanner /></div>} />
                <Route path="/scan-qr" element={<div className="max-w-5xl mx-auto px-4 py-8 w-full"><QRScanner /></div>} />
                <Route path="/product" element={<Product />} />
                <Route path="/about" element={<About />} />
              </Route>

              {/* Auth Pages */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected Student / Faculty Threat Operations */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/dashboard/scan-url" element={<URLScanner />} />
                  <Route path="/dashboard/scan-qr" element={<QRScanner />} />
                  <Route path="/dashboard/analyze-message" element={<MessageAnalysis />} />
                  <Route path="/dashboard/analyze-file" element={<AttachmentAnalysis />} />
                  <Route path="/dashboard/report-incident" element={<IncidentReport />} />
                  <Route path="/dashboard/history" element={<ScanHistory />} />
                  <Route path="/dashboard/my-reports" element={<MyReports />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/incidents" element={<IncidentManagement />} />
                  <Route path="/admin/audit" element={<AuditLogs />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
