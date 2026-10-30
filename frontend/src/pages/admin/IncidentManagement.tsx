import React, { useEffect, useState } from 'react';
import { AlertTriangle, Filter, CheckCircle2, FileText, ArrowRight, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { reportService } from '@/services/report.service';
import { IncidentReport, IncidentStatus, IncidentSeverity } from '@/types';

export const IncidentManagement: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<IncidentStatus>('submitted');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports(1, 100);
      setReports(data.items || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openReviewModal = (report: IncidentReport) => {
    setSelectedReport(report);
    setStatusToUpdate(report.status);
    setResolutionNotes(report.resolution_notes || '');
    setSuccessMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    setUpdating(true);
    try {
      await reportService.updateReportStatus(selectedReport.id, statusToUpdate, resolutionNotes);
      setSuccessMsg('Incident status and investigation notes updated successfully.');
      fetchReports();
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Campus Incident Triage Desk</h1>
        <p className="text-xs text-slate-400 mt-1">Review student & faculty incident reports, assign statuses, and record resolution logs.</p>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 bg-navy-900/60">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No incident reports recorded in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white max-w-sm truncate">{r.title}</td>
                    <td className="py-3 px-4 capitalize font-mono text-slate-400">{r.incident_type}</td>
                    <td className="py-3 px-4"><Badge variant="severity" value={r.severity} /></td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase text-[11px] text-cyber-cyan">{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => openReviewModal(r)}>
                        Review Case
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Incident Investigation: ${selectedReport.id.slice(0, 8)}`}
        >
          <div className="space-y-4 text-xs">
            {successMsg && <Alert type="success" message={successMsg} />}

            <div>
              <h4 className="text-base font-bold text-white">{selectedReport.title}</h4>
              <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                Submitted on {new Date(selectedReport.created_at).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-navy-950 border border-white/5 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Report Description</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold uppercase text-[10px]">Update Status</label>
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value as IncidentStatus)}
                  className="w-full rounded-lg bg-navy-950 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold uppercase text-[10px]">Report Severity</label>
                <div className="py-2"><Badge variant="severity" value={selectedReport.severity} /></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 font-semibold uppercase text-[10px]">
                Administrative Resolution Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Log notes about DNS blocks, firewall rules, or student notifications..."
                className="w-full rounded-lg bg-navy-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateStatus}
                loading={updating}
                icon={<Save className="w-4 h-4" />}
              >
                Save Triage Updates
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

