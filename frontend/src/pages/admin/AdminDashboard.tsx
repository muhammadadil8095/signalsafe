import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  Search,
  AlertTriangle,
  History,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { adminService } from '@/services/admin.service';
import { AdminDashboardStats } from '@/types';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const threatDistData = [
    { name: 'Safe', count: stats?.threat_distribution?.safe || 0, color: '#10B981' },
    { name: 'Suspicious', count: stats?.threat_distribution?.suspicious || 0, color: '#EAB308' },
    { name: 'Malicious', count: stats?.threat_distribution?.malicious || 0, color: '#E15A3E' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
            Console // Administrator
          </div>
          <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">
            Security Operations Command
          </h1>
          <p className="text-xs text-forest/70 font-sans mt-0.5">
            Aggregated institutional threat metrics, risk classifications, and operational triage pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/incidents">
            <Button variant="secondary" size="sm">
              Manage Incident Desk
            </Button>
          </Link>
          <Link to="/admin/audit">
            <Button variant="primary" size="sm">
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Enrolled Members</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{stats?.total_users || 0}</div>
          <div className="text-[10px] text-forest/50 mt-0.5">STUDENTS & FACULTY</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Total Threat Scans</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{stats?.total_scans || 0}</div>
          <div className="text-[10px] text-forest/50 mt-0.5">PLATFORM EXECUTION</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Malicious Blocks</div>
          <div className="text-2xl font-heading font-bold text-coral mt-1">{stats?.malicious_detections || 0}</div>
          <div className="text-[10px] text-coral/80 mt-0.5">ISOLATED VECTORS</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Open Incidents</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{stats?.open_reports || 0}</div>
          <div className="text-[10px] text-forest/50 mt-0.5">PENDING TRIAGE</div>
        </Card>
      </div>

      {/* Analytics Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-grid/20 rounded-sm lg:col-span-2 space-y-3 shadow-none">
          <div>
            <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">Telemetry</div>
            <h3 className="text-sm font-heading font-bold text-forest">Threat Category Distribution</h3>
            <p className="text-xs font-sans text-forest/70">Aggregated risk classifications from campus scans</p>
          </div>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#3A3A38" fontSize={11} tickLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="#3A3A38" fontSize={11} tickLine={false} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(58, 58, 56, 0.2)',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    color: '#1A3C2B',
                  }}
                />
                <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                  {threatDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#3A3A38" strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-grid/20 rounded-sm space-y-3 flex flex-col justify-between shadow-none">
          <div>
            <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">Subsystems</div>
            <h3 className="text-sm font-heading font-bold text-forest">Detection Source Health</h3>
            <p className="text-xs font-sans text-forest/70">Availability status of core detection engines</p>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded-sm bg-paper border border-grid/20 flex items-center justify-between">
              <span className="text-forest/70">ML Classifier:</span>
              <span className="text-forest bg-mint px-1.5 py-0.5 rounded-sm border border-forest/20 text-[10px] font-bold">ONLINE</span>
            </div>
            <div className="p-2.5 rounded-sm bg-paper border border-grid/20 flex items-center justify-between">
              <span className="text-forest/70">Heuristic Engine:</span>
              <span className="text-forest bg-mint px-1.5 py-0.5 rounded-sm border border-forest/20 text-[10px] font-bold">ONLINE</span>
            </div>
            <div className="p-2.5 rounded-sm bg-paper border border-grid/20 flex items-center justify-between">
              <span className="text-forest/70">Quishing Decoder:</span>
              <span className="text-forest bg-mint px-1.5 py-0.5 rounded-sm border border-forest/20 text-[10px] font-bold">ONLINE</span>
            </div>
            <div className="p-2.5 rounded-sm bg-paper border border-grid/20 flex items-center justify-between">
              <span className="text-forest/70">VirusTotal v3:</span>
              <span className="text-forest/60 bg-paper-muted px-1.5 py-0.5 rounded-sm border border-grid/20 text-[10px] font-bold">STANDALONE</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/admin/incidents" className="block">
          <Card hover className="p-4 bg-white border border-grid/20 rounded-sm">
            <div className="font-mono text-[10px] text-forest/60 uppercase">Operations Desk</div>
            <div className="text-sm font-heading font-bold text-forest mt-0.5">Incident Management</div>
            <p className="text-xs font-sans text-forest/70 mt-1">Triage and transition ticket states</p>
          </Card>
        </Link>
        <Link to="/admin/users" className="block">
          <Card hover className="p-4 bg-white border border-grid/20 rounded-sm">
            <div className="font-mono text-[10px] text-forest/60 uppercase">Access Governance</div>
            <div className="text-sm font-heading font-bold text-forest mt-0.5">User Directory & Roles</div>
            <p className="text-xs font-sans text-forest/70 mt-1">Manage RBAC permissions</p>
          </Card>
        </Link>
        <Link to="/admin/audit" className="block">
          <Card hover className="p-4 bg-white border border-grid/20 rounded-sm">
            <div className="font-mono text-[10px] text-forest/60 uppercase">Compliance Trail</div>
            <div className="text-sm font-heading font-bold text-forest mt-0.5">Security Audit Logs</div>
            <p className="text-xs font-sans text-forest/70 mt-1">Immutable administrative ledger</p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
