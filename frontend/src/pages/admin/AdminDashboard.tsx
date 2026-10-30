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
    { name: 'Safe', count: stats?.threat_distribution?.safe || 0, color: '#00ff88' },
    { name: 'Suspicious', count: stats?.threat_distribution?.suspicious || 0, color: '#ffbb00' },
    { name: 'Malicious', count: stats?.threat_distribution?.malicious || 0, color: '#ff3366' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Security Operations Center
          <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/30">
            ADMINISTRATOR
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Institutional cybersecurity metrics, threat distributions, and incident triage pipeline.
        </p>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Total Enrolled Accounts</div>
          <div className="text-3xl font-extrabold text-white mt-2">{stats?.total_users || 0}</div>
          <div className="text-[11px] text-cyber-cyan mt-1">Students & Faculty</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Total Threat Scans</div>
          <div className="text-3xl font-extrabold text-cyber-green mt-2">{stats?.total_scans || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Platform-Wide Execution</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Malicious Blocks</div>
          <div className="text-3xl font-extrabold text-cyber-danger mt-2">{stats?.malicious_detections || 0}</div>
          <div className="text-[11px] text-rose-400 mt-1">High-Risk Threats</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Open Incidents</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">{stats?.open_reports || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending Investigation</div>
        </Card>
      </div>

      {/* Analytics Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Threat Category Distribution</h3>
            <p className="text-xs text-slate-400">Aggregated risk classifications from user scans</p>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1022',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {threatDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Detection Source Health</h3>
            <p className="text-xs text-slate-400">Subsystem status & pipeline availability</p>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-navy-950 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">ML Random Forest:</span>
              <span className="text-cyber-green font-bold">ONLINE</span>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Heuristic Engine:</span>
              <span className="text-cyber-green font-bold">ONLINE</span>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Quishing Decoder:</span>
              <span className="text-cyber-green font-bold">ONLINE</span>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">VirusTotal v3:</span>
              <span className="text-slate-400">STANDALONE</span>
            </div>
          </div>
          <Link to="/admin/incidents">
            <Button variant="secondary" size="sm" className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
              Open Incident Triage Desk
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Incidents Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Security Reports</h3>
            <p className="text-xs text-slate-400">Reports filed by students and faculty requiring investigation</p>
          </div>
          <Link to="/admin/incidents" className="text-xs text-cyber-cyan hover:underline flex items-center gap-1">
            View All Reports <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_incidents?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No incidents reported yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3">Case Title</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Filed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {stats?.recent_incidents?.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">{inc.title}</td>
                    <td className="py-3 px-3 capitalize font-mono text-slate-400">{inc.incident_type}</td>
                    <td className="py-3 px-3"><Badge variant="severity" value={inc.severity} /></td>
                    <td className="py-3 px-3 uppercase text-[11px] font-mono">{inc.status}</td>
                    <td className="py-3 px-3 text-slate-400">{inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

