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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Attachment Static Inspector</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform non-executing structural inspection of academic PDFs and HTML files for embedded scripts and credential theft.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Upload Zone */}
      <Card className="p-8 bg-navy-900/80 border-white/10 text-center glow-cyan">
        <form onSubmit={handleUpload} className="space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-white/10 flex items-center justify-center text-purple-400 mx-auto">
            <FileWarning className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Upload Syllabus or Attachment</h3>
            <p className="text-xs text-slate-400">PDF, HTML or HTM files up to 10MB</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white font-medium text-sm border border-white/15 transition-colors">
                {file ? 'Change Selected File' : 'Select File from Device'}
              </span>
            </label>

            {file && (
              <div className="text-xs font-mono text-cyber-cyan bg-navy-950 px-3 py-1.5 rounded-md border border-white/10 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
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
            icon={<Upload className="w-4 h-4" />}
          >
            Run Static Inspection
          </Button>

          <p className="text-[11px] text-slate-500 font-mono">
            Zero-Execution Guarantee: File contents are never executed in the runtime.
          </p>
        </form>
      </Card>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-6 sm:p-8 bg-navy-900 border-white/15">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase text-slate-400">Risk Assessment:</span>
                  <Badge variant="risk" value={result.risk_level} />
                </div>
                <h3 className="text-xl font-bold text-white font-mono break-all">{result.file_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Type: {result.file_type} • Size: {(result.file_size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-3xl font-black text-white">{Math.round(result.risk_score)}/100</div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Threat Score</div>
              </div>
            </div>

            {/* Detected Indicators */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Structural Indicators Found ({result.indicators.length})
              </h4>
              {result.indicators.length === 0 ? (
                <div className="p-4 rounded-lg bg-navy-950 border border-white/5 text-xs text-cyber-green flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  No embedded scripts, OpenAction triggers, or suspicious form action tags found.
                </div>
              ) : (
                <div className="space-y-2">
                  {result.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-navy-950/80 border border-white/5 flex items-start justify-between gap-4"
                    >
                      <p className="text-xs text-slate-300 leading-relaxed">{ind.description}</p>
                      <Badge variant="severity" value={ind.severity} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanations & Next Steps */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-semibold text-white">Recommended Actions</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-cyber-green shrink-0 mt-0.5" />
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

