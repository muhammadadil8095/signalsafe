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
    { name: 'Safe', value: safeScans || 1, color: '#10B981' },
    { name: 'Suspicious / Malicious', value: threatsDetected || 0, color: '#E15A3E' },
    { name: 'Inconclusive', value: scans.filter(s => s.risk_level === 'inconclusive').length || 0, color: '#EAB308' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-sm bg-white border border-grid/20 shadow-none">
        <div>
          <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
            OPERATIONS // STUDENT_HUB
          </div>
          <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">
            Welcome, {user?.full_name || user?.username}
          </h1>
          <p className="text-xs text-forest/70 font-sans mt-0.5">
            Active threat perimeter deployed. Evaluate vectors and track institutional reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/scan-url">
            <Button variant="primary" size="sm" icon={<Search className="w-3.5 h-3.5" />}>
              Scan URL
            </Button>
          </Link>
          <Link to="/dashboard/scan-qr">
            <Button variant="secondary" size="sm" icon={<QrCode className="w-3.5 h-3.5" />}>
              Scan QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Total Scans</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{totalScans}</div>
          <div className="text-[10px] font-mono text-forest/50 mt-0.5">TELEMETRY_LOGS</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Threats Flagged</div>
          <div className="text-2xl font-heading font-bold text-coral mt-1">{threatsDetected}</div>
          <div className="text-[10px] font-mono text-coral/80 mt-0.5">ISOLATED_SANDBOX</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Verified Clean</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{safeScans}</div>
          <div className="text-[10px] font-mono text-forest/70 mt-0.5">VALID_DOMAINS</div>
        </Card>
        <Card className="p-4 bg-white border border-grid/20 rounded-sm shadow-none">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Reports Logged</div>
          <div className="text-2xl font-heading font-bold text-forest mt-1">{reportsCount}</div>
          <div className="text-[10px] font-mono text-forest/50 mt-0.5">DESK_ESCALATIONS</div>
        </Card>
      </div>

      {/* Middle Grid: Threat Chart & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Distribution Chart */}
        <Card className="p-5 bg-white border border-grid/20 rounded-sm lg:col-span-1 flex flex-col justify-between shadow-none">
          <div>
            <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">Telemetry Analysis</div>
            <h3 className="text-sm font-heading font-bold text-forest mb-0.5">Threat Distribution</h3>
            <p className="text-xs font-sans text-forest/70">Categorical scan classification</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#3A3A38" strokeWidth={1} />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-[10px] font-mono text-forest/80 pt-2 border-t border-grid/10">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-mint border border-forest/20" /> Safe</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-coral border border-forest/20" /> Malicious</span>
          </div>
        </Card>

        {/* Security Recommendations & Quick Tools */}
        <Card className="p-5 bg-white border border-grid/20 rounded-sm lg:col-span-2 space-y-4 shadow-none">
          <div>
            <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">Defensive Protocol</div>
            <h3 className="text-sm font-heading font-bold text-forest mb-0.5">Campus Safety Advisories</h3>
            <p className="text-xs font-sans text-forest/70">Autonomous rules based on collegiate threat patterns</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <div className="text-forest font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <QrCode className="w-3.5 h-3.5" /> Physical Poster Caution
              </div>
              <p className="text-[11px] font-sans text-forest/80 leading-relaxed">
                Always decode QR flyers with SignalSafe Quishing Shield before submitting credentials.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <div className="text-forest font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> IT Support Verification
              </div>
              <p className="text-[11px] font-sans text-forest/80 leading-relaxed">
                Campus IT will never email asking for university password renewals through external forms.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <div className="text-forest font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <MessageSquareWarning className="w-3.5 h-3.5" /> Advance-Fee Grants
              </div>
              <p className="text-[11px] font-sans text-forest/80 leading-relaxed">
                Financial aid grants do not require prepaid processing gift cards or wire transfers.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <div className="text-forest font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <FileWarning className="w-3.5 h-3.5" /> Attachment Inspection
              </div>
              <p className="text-[11px] font-sans text-forest/80 leading-relaxed">
                Inspect syllabus PDFs statically if they request enabling macros or JavaScript interpreters.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Scans Table */}
      <Card className="p-5 bg-white border border-grid/20 rounded-sm space-y-3 shadow-none">
        <div className="flex items-center justify-between pb-2 border-b border-grid/10">
          <div>
            <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">Historical Record</div>
            <h3 className="text-sm font-heading font-bold text-forest">Recent Threat Scans</h3>
          </div>
          <Link to="/dashboard/history" className="text-xs font-mono tracking-wider uppercase text-forest hover:underline flex items-center gap-1">
            View All Scans <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {scans.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-forest/60">
            No scans recorded in active session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-forest/60 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Target Vector</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Evaluation</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {scans.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-paper transition-colors">
                    <td className="py-2.5 px-3 font-mono truncate max-w-xs">{s.original_input}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] text-forest/70">{s.scan_type}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="risk" value={s.risk_level} />
                    </td>
                    <td className="py-2.5 px-3">{s.risk_score} / 100</td>
                    <td className="py-2.5 px-3 text-forest/60">{new Date(s.scanned_at).toLocaleDateString()}</td>
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
