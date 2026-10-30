import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

import { Landing } from '@/pages/Landing';
import { Product } from '@/pages/Product';
import { About } from '@/pages/About';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

import { StudentDashboard } from '@/pages/dashboard/StudentDashboard';
import { URLScanner } from '@/pages/dashboard/URLScanner';
import { QRScanner } from '@/pages/dashboard/QRScanner';
import { MessageAnalysis } from '@/pages/dashboard/MessageAnalysis';
import { AttachmentAnalysis } from '@/pages/dashboard/AttachmentAnalysis';
import { IncidentReport } from '@/pages/dashboard/IncidentReport';
import { ScanHistory } from '@/pages/dashboard/ScanHistory';
import { MyReports } from '@/pages/dashboard/MyReports';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UserManagement } from '@/pages/admin/UserManagement';
import { IncidentManagement } from '@/pages/admin/IncidentManagement';
import { AuditLogs } from '@/pages/admin/AuditLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Info Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
