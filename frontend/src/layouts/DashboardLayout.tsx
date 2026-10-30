import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  QrCode,
  MessageSquareWarning,
  FileWarning,
  AlertTriangle,
  History,
  FileText,
  Users,
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { InstallPwaButton } from '@/components/InstallPwaButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentNav = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'URL Threat Scanner', href: '/dashboard/scan-url', icon: Search },
    { label: 'QR Quishing Shield', href: '/dashboard/scan-qr', icon: QrCode },
    { label: 'Message Analyzer', href: '/dashboard/analyze-message', icon: MessageSquareWarning },
    { label: 'Attachment Inspector', href: '/dashboard/analyze-file', icon: FileWarning },
    { label: 'Report Incident', href: '/dashboard/report-incident', icon: AlertTriangle },
    { label: 'Scan History', href: '/dashboard/history', icon: History },
    { label: 'My Reports', href: '/dashboard/my-reports', icon: FileText },
  ];

  const adminNav = [
    { label: 'Command Center', href: '/admin', icon: ShieldAlert },
    { label: 'Incident Desk', href: '/admin/incidents', icon: ClipboardList },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Security Audit Log', href: '/admin/audit', icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-paper text-forest font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-forest/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-paper border-r border-grid/20 flex flex-col transition-transform duration-150 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 border-b border-grid/20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-white border border-grid/20 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-forest" />
            </div>
            <span className="font-heading font-bold text-sm tracking-tight text-forest">SignalSafe</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar menu"
            className="p-1 rounded-sm text-forest border border-grid/20 lg:hidden hover:bg-paper-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-3 rounded-sm bg-white border border-grid/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-paper-muted border border-grid/20 flex items-center justify-center font-mono font-bold text-xs text-forest">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate text-forest">{user?.full_name || user?.username}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-mint text-forest border border-forest/20">
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold tracking-[0.1em] text-forest/60 uppercase">
              Operations
            </div>
            <div className="space-y-0.5">
              {studentNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono tracking-wider uppercase transition-colors duration-150 ${
                      isActive
                        ? 'bg-forest text-paper font-semibold border border-forest'
                        : 'text-forest/70 hover:bg-white hover:text-forest border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Tools Section */}
          {user?.role === 'admin' && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-mono font-bold tracking-[0.1em] text-forest/60 uppercase">
                Admin Console
              </div>
              <div className="space-y-0.5">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono tracking-wider uppercase transition-colors duration-150 ${
                        isActive
                          ? 'bg-forest text-paper font-semibold border border-forest'
                          : 'text-forest/70 hover:bg-white hover:text-forest border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Logout bottom button */}
        <div className="p-3 border-t border-grid/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono uppercase tracking-wider text-forest/70 hover:text-coral hover:bg-white transition-colors duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="h-16 border-b border-grid/20 bg-paper/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="p-1.5 rounded-sm text-forest border border-grid/20 bg-white hover:bg-paper-muted lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-forest/60">
              <span>Security Portal</span>
              <ChevronRight className="w-3 h-3 text-grid/40" />
              <span className="text-forest font-semibold uppercase">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <InstallPwaButton />
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-white border border-grid/20 text-[11px] font-mono text-forest">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              <span className="hidden sm:inline">RADAR ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
