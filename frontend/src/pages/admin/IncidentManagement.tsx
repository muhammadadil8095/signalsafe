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
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Triage Desk // Governance
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Campus Incident Triage Desk</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">Review student and faculty incident reports, assign statuses, and record resolution logs.</p>
      </div>

      <Card className="p-0 overflow-hidden border border-grid/20 bg-white rounded-sm shadow-none">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-forest/60">
            No incident reports recorded in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-forest/70 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 font-semibold text-forest max-w-sm truncate font-sans">{r.title}</td>
                    <td className="py-3 px-4 uppercase text-[10px] text-forest/60">{r.incident_type}</td>
                    <td className="py-3 px-4"><Badge variant="severity" value={r.severity} /></td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 rounded-sm bg-paper border border-grid/20 text-forest font-semibold">{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-forest/60">{new Date(r.created_at).toLocaleDateString()}</td>
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
          <div className="space-y-4 text-xs font-mono">
            {successMsg && <Alert type="success" message={successMsg} />}

            <div>
              <h4 className="text-sm font-heading font-bold text-forest">{selectedReport.title}</h4>
              <p className="text-forest/60 text-[10px] mt-0.5">
                SUBMITTED: {new Date(selectedReport.created_at).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <span className="text-forest/60 font-bold uppercase text-[10px]">Report Description</span>
              <p className="text-forest font-sans leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-forest/60 font-bold uppercase text-[10px]">Update Status</label>
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value as IncidentStatus)}
                  className="w-full rounded-sm bg-white border border-grid/20 px-3 py-1.5 text-xs font-mono text-forest focus:outline-none focus:border-forest shadow-none"
                >
                  <option value="submitted">SUBMITTED</option>
                  <option value="under_review">UNDER_REVIEW</option>
                  <option value="investigating">INVESTIGATING</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="rejected">REJECTED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-forest/60 font-bold uppercase text-[10px]">Report Severity</label>
                <div className="py-1"><Badge variant="severity" value={selectedReport.severity} /></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-forest/60 font-bold uppercase text-[10px]">
                Administrative Resolution Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Log notes about DNS blocks, firewall rules, or student notifications..."
                className="w-full rounded-sm bg-white border border-grid/20 p-2.5 text-xs font-mono text-forest focus:outline-none focus:border-forest shadow-none"
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
                icon={<Save className="w-3.5 h-3.5" />}
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
