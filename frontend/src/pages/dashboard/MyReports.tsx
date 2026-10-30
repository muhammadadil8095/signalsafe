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
        return { label: 'SUBMITTED', color: 'text-forest bg-paper border-grid/20' };
      case 'under_review':
        return { label: 'IN_REVIEW', color: 'text-forest bg-gold border-forest/20' };
      case 'investigating':
        return { label: 'INVESTIGATING', color: 'text-forest bg-gold border-forest/20' };
      case 'resolved':
        return { label: 'RESOLVED', color: 'text-forest bg-mint border-forest/20' };
      case 'rejected':
      case 'dismissed':
        return { label: 'DISMISSED', color: 'text-forest-dark bg-coral border-coral' };
      default:
        return { label: status.toUpperCase(), color: 'text-forest/70 bg-paper border-grid/20' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grid/20 pb-3">
        <div>
          <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
            Desk // Tickets
          </div>
          <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Security Incident Reports</h1>
          <p className="text-xs text-forest/70 font-sans mt-0.5">Track status and review notes of escalated incident tickets.</p>
        </div>

        <Link to="/dashboard/report-incident">
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
            New Incident Report
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden border border-grid/20 bg-white rounded-sm shadow-none">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-forest/60 space-y-3">
            <FileText className="w-6 h-6 mx-auto text-forest/40" />
            <p>No active incident tickets filed.</p>
            <Link to="/dashboard/report-incident">
              <Button variant="secondary" size="sm">File Incident</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-forest/70 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {reports.map((r) => {
                  const statusInfo = formatStatus(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-paper transition-colors">
                      <td className="py-3 px-4 font-semibold text-forest max-w-xs truncate font-sans">
                        {r.title}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] text-forest/60">
                        {r.incident_type}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="severity" value={r.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-forest/60">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="text-forest hover:underline font-semibold uppercase text-[11px] inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3 h-3" />
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
          <div className="space-y-4 text-xs font-mono">
            <div>
              <h4 className="text-sm font-heading font-bold text-forest">{selectedReport.title}</h4>
              <p className="text-forest/60 text-[10px] mt-0.5">
                FILED: {new Date(selectedReport.created_at).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-sm bg-paper border border-grid/20">
              <div>
                <span className="text-forest/60 block text-[10px] uppercase">Category</span>
                <span className="font-bold text-forest uppercase">{selectedReport.incident_type}</span>
              </div>
              <div>
                <span className="text-forest/60 block text-[10px] uppercase">Severity</span>
                <Badge variant="severity" value={selectedReport.severity} />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-forest/60 font-bold uppercase text-[10px] tracking-wider">Report Description</span>
              <p className="p-3 rounded-sm bg-paper border border-grid/20 text-forest/80 font-sans leading-relaxed whitespace-pre-wrap">
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.resolution_notes && (
              <div className="space-y-1">
                <span className="text-forest font-bold uppercase text-[10px] tracking-wider">Security Desk Notes</span>
                <p className="p-3 rounded-sm bg-mint/20 border border-forest/20 text-forest font-sans leading-relaxed">
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
