import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { reportService } from '@/services/report.service';
import { IncidentReport } from '@/types';

export const MyReports: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports(1, 50);
      setReports(data.items || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatStatus = (status: string) => {
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' };
      case 'under_review':
        return { label: 'Under Review', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
      case 'investigating':
        return { label: 'Investigating', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' };
      case 'resolved':
        return { label: 'Resolved', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
      case 'rejected':
        return { label: 'Rejected', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' };
      default:
        return { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Incident Reports</h1>
          <p className="text-xs text-slate-400 mt-1">Track status and administrative review of your reported incidents.</p>
        </div>

        <Link to="/dashboard/report-incident">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            New Incident Report
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 bg-navy-900/60">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p>You haven't filed any incident reports yet.</p>
            <Link to="/dashboard/report-incident">
              <Button variant="secondary" size="sm">File an Incident</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {reports.map((r) => {
                  const statusInfo = formatStatus(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                        {r.title}
                      </td>
                      <td className="py-3 px-4 capitalize font-mono text-slate-400">
                        {r.incident_type}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="severity" value={r.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="text-cyber-cyan hover:underline font-medium text-xs inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Report Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Incident Case #${selectedReport.id.slice(0, 8)}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-base font-bold text-white">{selectedReport.title}</h4>
              <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                Filed on {new Date(selectedReport.created_at).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-navy-950 border border-white/5">
              <div>
                <span className="text-slate-400 block text-[11px]">Category</span>
                <span className="font-semibold text-white capitalize">{selectedReport.incident_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Severity</span>
                <Badge variant="severity" value={selectedReport.severity} />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Report Description</span>
              <p className="p-3 rounded-lg bg-navy-950 border border-white/5 text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.resolution_notes && (
              <div className="space-y-1">
                <span className="text-cyber-green font-semibold uppercase text-[10px] tracking-wider">Security Desk Notes</span>
                <p className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-200 leading-relaxed">
                  {selectedReport.resolution_notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

