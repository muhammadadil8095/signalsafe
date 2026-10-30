import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { reportService } from '@/services/report.service';
import { IncidentSeverity, IncidentType } from '@/types';

export const IncidentReport: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('phishing');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [relatedScanId, setRelatedScanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reportService.createReport({
        title: title.trim(),
        description: description.trim(),
        incident_type: incidentType,
        severity,
        related_scan_id: relatedScanId.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/my-reports');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit incident report.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Desk // Dispatch
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Report Security Incident</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Escalate suspected phishing links, physical quishing vectors, or impersonation attempts directly to Campus SOC.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && (
        <Alert
          type="success"
          title="Incident Logged"
          message="Telemetry payload dispatched to Campus Security operations desk. Navigating to reports..."
        />
      )}

      <Card className="p-6 sm:p-8 bg-white border border-grid/20 rounded-sm shadow-none">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Incident Subject Title"
            type="text"
            placeholder="e.g. Deceptive Financial Aid verification portal link"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-forest">
                Threat Classification
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full rounded-sm bg-white border border-grid/20 px-3 py-2 text-xs font-mono text-forest focus:outline-none focus:border-forest shadow-none"
              >
                <option value="phishing">Phishing Vector</option>
                <option value="quishing">Quishing (QR Code)</option>
                <option value="malware">Malicious Attachment</option>
                <option value="impersonation">Administrative Impersonation</option>
                <option value="coercion">Coercive / Threatening Message</option>
                <option value="other">Other Campus Anomaly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-forest">
                Perceived Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-sm bg-white border border-grid/20 px-3 py-2 text-xs font-mono text-forest focus:outline-none focus:border-forest shadow-none"
              >
                <option value="low">Low (General Curiosity)</option>
                <option value="medium">Medium (Suspicious Vector)</option>
                <option value="high">High (Active Targeted Phish)</option>
                <option value="critical">Critical (Compromise / Extortion)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-forest">
              Incident Evidence & Context Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe where the threat was encountered (email header, physical campus flyer location, SMS sender number)..."
              className="w-full rounded-sm bg-white border border-grid/20 p-3 text-xs font-mono text-forest placeholder:text-grid/40 focus:outline-none focus:border-forest shadow-none"
              required
            />
          </div>

          <Input
            label="Associated Scan ID (Optional)"
            type="text"
            placeholder="Paste Scan UUID from Scan History"
            value={relatedScanId}
            onChange={(e) => setRelatedScanId(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Dispatch Incident Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
