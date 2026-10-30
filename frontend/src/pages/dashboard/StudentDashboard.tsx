import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  QrCode,
  MessageSquareWarning,
  FileWarning,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { scanService } from '@/services/scan.service';
import { reportService } from '@/services/report.service';
import { ScanResult, IncidentReport } from '@/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scansData, reportsData] = await Promise.all([
          scanService.getHistory(1, 10),
          reportService.getReports(1, 5),
        ]);
        setScans(scansData.items || []);
        setReports(reportsData.items || []);
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalScans = scans.length;
  const threatsDetected = scans.filter(s => s.risk_level === 'malicious' || s.risk_level === 'suspicious').length;
  const safeScans = scans.filter(s => s.risk_level === 'safe').length;
  const reportsCount = reports.length;

  const chartData = [
    { name: 'Safe', value: safeScans || 1, color: '#00ff88' },
    { name: 'Suspicious / Malicious', value: threatsDetected || 0, color: '#ff3366' },
    { name: 'Inconclusive', value: scans.filter(s => s.risk_level === 'inconclusive').length || 0, color: '#6366f1' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 border border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome, {user?.full_name || user?.username}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Institutional defense is active. Protect your digital footprint across campus.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/dashboard/scan-url">
            <Button variant="primary" size="sm" icon={<Search className="w-4 h-4" />}>
              Scan URL
            </Button>
          </Link>
          <Link to="/dashboard/scan-qr">
            <Button variant="secondary" size="sm" icon={<QrCode className="w-4 h-4" />}>
              Scan QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Total Scans Executed</div>
          <div className="text-3xl font-extrabold text-white mt-2">{totalScans}</div>
          <div className="text-[11px] text-cyber-cyan mt-1">Direct Telemetry</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Threats Flagged</div>
          <div className="text-3xl font-extrabold text-cyber-danger mt-2">{threatsDetected}</div>
          <div className="text-[11px] text-slate-400 mt-1">Neutralized in Sandbox</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">Safe Scans Verified</div>
          <div className="text-3xl font-extrabold text-cyber-green mt-2">{safeScans}</div>
          <div className="text-[11px] text-slate-400 mt-1">Legitimate Domains</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-mono text-slate-400">My Reports Filed</div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2">{reportsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Security Incident Desk</div>
        </Card>
      </div>

      {/* Middle Grid: Threat Chart & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Chart */}
        <Card className="p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Threat Distribution</h3>
            <p className="text-xs text-slate-400">Categorical breakdown of your scan history</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1022',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs text-slate-300 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-green" /> Safe</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-danger" /> Malicious</span>
          </div>
        </Card>

        {/* Security Recommendations & Quick Tools */}
        <Card className="p-6 lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Campus Safety Advisory</h3>
            <p className="text-xs text-slate-400">Current collegiate security recommendations based on telemetry</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-cyber-cyan flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Physical Poster Caution
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Always use SignalSafe QR Scanner before entering student portal credentials from physical campus flyers or stickers.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-cyber-green flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> IT Support Verification
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Campus IT will never email asking you to verify your university password via an external link.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <MessageSquareWarning className="w-4 h-4" /> Urgent Refund Alerts
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Financial aid disbursements are deposited directly to your bank, never through prepaid cards or wire services.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <FileWarning className="w-4 h-4" /> PDF Syllabus Safety
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If a downloaded class PDF requests enabling macros or executing JavaScript, submit it for static attachment analysis.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Scans Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Threat Scans</h3>
            <p className="text-xs text-slate-400">Latest URLs and assets inspected in sandbox</p>
          </div>
          <Link to="/dashboard/history" className="text-xs text-cyber-cyan hover:underline flex items-center gap-1">
            View All Scans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {scans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No scans recorded yet. Enter a URL above to inspect your first link!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3">Target / URL</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {scans.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-white truncate max-w-xs">{s.original_input}</td>
                    <td className="py-3 px-3 uppercase text-[11px] font-mono text-slate-400">{s.scan_type}</td>
                    <td className="py-3 px-3">
                      <Badge variant="risk" value={s.risk_level} />
                    </td>
                    <td className="py-3 px-3 font-mono">{s.risk_score}/100</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(s.scanned_at).toLocaleDateString()}</td>
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

