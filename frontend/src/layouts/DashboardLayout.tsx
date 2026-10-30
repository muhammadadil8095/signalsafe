import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Link2,
  QrCode,
  MessageSquareWarning,
  FileWarning,
  AlertTriangle,
  History,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { InstallPwaButton } from '@/components/InstallPwaButton';

export const DashboardLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentNav = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'URL Scanner', href: '/dashboard/scan-url', icon: Link2 },
    { label: 'QR Scanner', href: '/dashboard/scan-qr', icon: QrCode },
    { label: 'Message Analysis', href: '/dashboard/analyze-message', icon: MessageSquareWarning },
    { label: 'Attachment Scanner', href: '/dashboard/analyze-file', icon: FileWarning },
    { label: 'File Incident', href: '/dashboard/report-incident', icon: AlertTriangle },
    { label: 'My Reports', href: '/dashboard/my-reports', icon: FileText },
    { label: 'Scan History', href: '/dashboard/history', icon: History },
  ];

  const adminNav = [
    { label: 'Admin Command', href: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Incident Desk', href: '/admin/incidents', icon: AlertTriangle },
    { label: 'Audit Trail', href: '/admin/audit', icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-navy-950 text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyber-green" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">SignalSafe</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-navy-950/70 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyber-cyan/30 to-cyber-green/30 border border-cyber-cyan/40 flex items-center justify-center font-bold text-cyber-green">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">{user?.full_name || user?.username}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                className={
                  user?.role === 'admin'
                    ? 'border-purple-500/40 text-purple-400 bg-purple-950/30'
                    : user?.role === 'faculty'
                    ? 'border-blue-500/40 text-blue-400 bg-blue-950/30'
                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                }
              >
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              Threat Operations
            </div>
            <div className="space-y-1">
              {studentNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Section (Only for Admin users) */}
          {hasRole('admin') && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-purple-400 uppercase flex items-center justify-between">
                <span>Security Administration</span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-950/50 text-purple-300 border border-purple-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Logout bottom button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-cyber-danger hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="h-16 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Campus Security Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white font-medium capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InstallPwaButton />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900 border border-white/5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="hidden sm:inline">Active Shield Protection</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

