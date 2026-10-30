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
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Report Security Incident</h1>
        <p className="text-xs text-slate-400 mt-1">
          Escalate suspected phishing links, impersonation attempts, or quishing attacks to Campus IT Security.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && (
        <Alert
          type="success"
          title="Incident Submitted"
          message="Your report has been dispatched to campus security administrators. Redirecting to reports..."
        />
      )}

      <Card className="p-6 sm:p-8 bg-navy-900/80 border-white/10 glow-cyan">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Incident Title"
            type="text"
            placeholder="e.g. Phishing flyer with QR code spotted in Science Library"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Incident Category</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full rounded-lg bg-navy-900 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="phishing">Phishing Link / Email</option>
                <option value="scam">Student Financial / Job Scam</option>
                <option value="malware">Malware / Suspicious File</option>
                <option value="harassment">Impersonation / Coercive Message</option>
                <option value="data_breach">Potential Credential Compromise</option>
                <option value="other">Other Campus Cyber Incident</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Assessed Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-lg bg-navy-900 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="low">Low - Unsolicited message / no interaction</option>
                <option value="medium">Medium - Deceptive link actively distributed</option>
                <option value="high">High - Targeted attack impersonating campus office</option>
                <option value="critical">Critical - Credentials or funds actively transferred</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Detailed Description & Timeline
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe where and how the incident occurred, the sender address, or the physical location of the flyer..."
              className="w-full rounded-lg bg-navy-900 border border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
              required
            />
          </div>

          <Input
            label="Related Scan ID (Optional)"
            type="text"
            placeholder="e.g. 46e8e397-97f1-445c-ab82-61737749e3b8"
            value={relatedScanId}
            onChange={(e) => setRelatedScanId(e.target.value)}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md" loading={loading} icon={<Send className="w-4 h-4" />}>
              Submit Incident Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

