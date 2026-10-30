import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck, Cpu, Database, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { scanService } from '@/services/scan.service';
import { ScanResult } from '@/types';

export const URLScanner: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a URL to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await scanService.scanURL(url.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete scan. Verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 25) return 'text-cyber-green stroke-cyber-green';
    if (score <= 60) return 'text-cyber-warning stroke-cyber-warning';
    return 'text-cyber-danger stroke-cyber-danger';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">URL Threat Scanner</h1>
        <p className="text-xs text-slate-400 mt-1">
          Autonomous multi-signal inspection fusing lexical heuristics, 27-feature AI classification, and threat intelligence.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Input Card */}
      <Card className="p-6 bg-navy-900/80 border-white/10 glow-cyan">
        <form onSubmit={handleScan} className="space-y-4">
          <Input
            label="Target URL"
            type="text"
            placeholder="https://example.com/login or http://suspicious-portal.tk"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            required
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 font-mono">
              Zero execution guarantee: Link structure is analyzed safely without requesting active scripts.
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} icon={<Search className="w-4 h-4" />}>
              Analyze URL
            </Button>
          </div>
        </form>
      </Card>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Risk Overview Banner */}
          <Card className="p-6 sm:p-8 bg-navy-900 border-white/15">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Risk Assessment:</span>
                  <Badge variant="risk" value={result.risk_level} />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white font-mono break-all">
                  {result.normalized_url || result.original_input}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Domain: <span className="text-cyber-cyan">{result.domain || 'N/A'}</span> • Scanned: {new Date(result.scanned_at).toLocaleString()}
                </div>
              </div>

              {/* Circular Risk Score Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-navy-950 stroke-current"
                    strokeWidth="8"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  />
                  <circle
                    className={getScoreColor(result.risk_score)}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * result.risk_score) / 100}
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{Math.round(result.risk_score)}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">SCORE / 100</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tri-Engine Intelligence Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Machine Learning Card */}
            <Card className="p-5 bg-navy-950/70 border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" /> AI Phishing Classifier
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  result.ml_available ? 'text-cyber-green bg-emerald-950/40 border-emerald-800/40' : 'text-slate-400 bg-slate-900 border-slate-700'
                }`}>
                  {result.ml_available ? 'ONLINE' : 'FALLBACK MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prediction: <strong className="text-white uppercase">{result.ml_prediction || 'Heuristic Fallback'}</strong>
                {result.ml_confidence !== undefined && result.ml_confidence !== null && (
                  <span> ({Math.round(result.ml_confidence * 100)}% Confidence)</span>
                )}
              </p>
            </Card>

            {/* VirusTotal Card */}
            <Card className="p-5 bg-navy-950/70 border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyber-cyan" /> VirusTotal Intelligence
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  result.vt_available ? 'text-cyber-green bg-emerald-950/40 border-emerald-800/40' : 'text-slate-400 bg-slate-900 border-slate-700'
                }`}>
                  {result.vt_available ? 'CONNECTED' : 'STANDALONE MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {result.vt_available
                  ? `Detections: ${result.vt_malicious || 0} malicious engines`
                  : 'Operating in self-sufficient heuristic & local ML mode (no external key configured).'}
              </p>
            </Card>
          </div>

          {/* Detected Signals Box */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyber-cyan" />
              Detected Evidence & Threat Signals ({result.signals.length})
            </h3>

            {result.signals.length === 0 ? (
              <div className="p-4 rounded-lg bg-navy-950 border border-white/5 text-xs text-cyber-green flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                No malicious flags detected. The URL structure aligns with legitimate collegiate web infrastructure.
              </div>
            ) : (
              <div className="space-y-2">
                {result.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-navy-950/80 border border-white/5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white">{sig.signal_type}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">source: {sig.source}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{sig.description}</p>
                    </div>
                    <Badge variant="severity" value={sig.severity} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Security Recommendations */}
          <Card className="p-6 space-y-3 bg-navy-900/60 border-white/10">
            <h3 className="text-sm font-semibold text-white">Recommended Actions</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-cyber-green shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

