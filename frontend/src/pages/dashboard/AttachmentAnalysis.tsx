import React, { useState } from 'react';
import { FileWarning, Upload, ShieldCheck, ShieldAlert, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { attachmentService, AttachmentAnalysisResult } from '@/services/attachment.service';

export const AttachmentAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttachmentAnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.html') && !ext.endsWith('.htm')) {
      setError('Unsupported format. Only PDF and HTML attachments are permitted.');
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
    setResult(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to inspect.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await attachmentService.analyzeAttachment(file);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to inspect file attachment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Engine // 04
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Attachment Static Inspector</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Non-executing structural inspection of PDFs and HTML files for embedded JavaScript, OpenAction triggers, and deceptive forms.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Upload Zone */}
      <Card className="p-6 sm:p-8 bg-white border border-grid/20 rounded-sm text-center shadow-none">
        <form onSubmit={handleUpload} className="space-y-5 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-sm bg-paper border border-grid/20 flex items-center justify-center text-forest mx-auto">
            <FileWarning className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-heading font-bold text-forest">Select Academic Attachment</h3>
            <p className="text-xs font-mono text-forest/60">PDF, HTML or HTM format (Limit: 10MB)</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-paper hover:bg-forest hover:text-paper text-forest font-mono text-xs uppercase tracking-wider border border-grid/20 transition-colors">
                {file ? 'Replace File' : 'Select Attachment'}
              </span>
            </label>

            {file && (
              <div className="text-xs font-mono text-forest bg-paper px-3 py-1.5 rounded-sm border border-grid/20 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest" />
                <span>{file.name}</span>
                <span className="text-forest/50">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!file}
            className="w-full"
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Execute Static Inspection
          </Button>

          <p className="text-[11px] text-forest/50 font-mono">
            ZERO EXECUTION: Evaluates file byte stream without launching binary runtime interpreters.
          </p>
        </form>
      </Card>

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Card className="p-5 sm:p-6 bg-white border border-grid/20 rounded-sm shadow-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-grid/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Risk Evaluation:</span>
                  <Badge variant="risk" value={result.risk_level} />
                </div>
                <h3 className="text-base font-heading font-bold text-forest font-mono break-all">{result.file_name}</h3>
                <p className="text-xs text-forest/60 font-mono mt-0.5">
                  TYPE: {result.file_type} • SIZE: {(result.file_size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-heading font-extrabold text-forest">{Math.round(result.risk_score)} / 100</div>
                <div className="text-[10px] font-mono text-forest/60 uppercase">Heuristic Threat Score</div>
              </div>
            </div>

            {/* Detected Indicators */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-forest">
                Structural Indicators Found ({result.indicators.length})
              </div>
              {result.indicators.length === 0 ? (
                <div className="p-3 rounded-sm bg-mint/20 border border-forest/20 text-xs font-mono text-forest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  No embedded scripts, OpenAction triggers, or suspicious form action tags found.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {result.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-sm bg-paper border border-grid/20 flex items-start justify-between gap-3 text-xs font-mono"
                    >
                      <p className="text-forest/80 leading-relaxed">{ind.description}</p>
                      <Badge variant="severity" value={ind.severity} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanations & Next Steps */}
            <div className="mt-5 pt-4 border-t border-grid/20 space-y-2 font-mono text-xs">
              <div className="font-bold uppercase tracking-wider text-forest">Recommended Actions</div>
              <ul className="space-y-1 text-forest/80">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
