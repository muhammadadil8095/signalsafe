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

  const getScoreBlockStyle = (score: number) => {
    if (score < 25) return 'bg-[#A7F3D0] text-[#064E3B] border-2 border-[#064E3B] font-bold';
    if (score <= 60) return 'bg-[#FDE68A] text-[#78350F] border-2 border-[#78350F] font-bold';
    return 'bg-[#FECACA] text-[#7F1D1D] border-2 border-[#7F1D1D] font-bold';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Engine // 01
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">URL Threat Scanner</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Deterministic threat inspection fusing 17 lexical rules, 27-feature AI classification, and threat intelligence.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Input Card */}
      <Card className="p-5 bg-white border border-grid/20 rounded-sm shadow-none">
        <form onSubmit={handleScan} className="space-y-4">
          <Input
            label="Target Ingestion Vector"
            type="text"
            placeholder="https://example.com/login or http://suspicious-portal.tk"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            icon={<Search className="w-4 h-4 text-forest/50" />}
            required
          />

          {/* Test Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono pt-1 border-t border-grid/20">
            <span className="text-forest font-semibold">PRESET TARGETS:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUrl('http://campus-portal-auth.edu.verify-session.xyz/login')}
                className="text-[#7F1D1D] bg-[#FECACA] dark:bg-[#3D1414] dark:text-[#FCA5A5] border border-[#7F1D1D] px-2 py-0.5 rounded-sm hover:underline font-mono"
              >
                [Spear-Phishing Vector]
              </button>
              <button
                type="button"
                onClick={() => setUrl('https://portal.campus.edu/student-hub')}
                className="text-[#064E3B] bg-[#A7F3D0] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7] border border-[#064E3B] px-2 py-0.5 rounded-sm hover:underline font-mono"
              >
                [Official Campus Portal]
              </button>
              <button
                type="button"
                onClick={() => setUrl('http://192.168.104.22:8080/payroll/direct-deposit.php')}
                className="text-[#78350F] bg-[#FDE68A] dark:bg-[#451A03]/50 dark:text-[#FCD34D] border border-[#78350F] px-2 py-0.5 rounded-sm hover:underline font-mono"
              >
                [Unauthenticated IP Vector]
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#1A231E]/20">
            <div className="text-[11px] text-[#0D1F17] font-mono">
              ZERO-EXECUTION: Static lexical token parsing without opening untrusted sockets.
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} icon={<Search className="w-3.5 h-3.5" />}>
              Execute Analysis
            </Button>
          </div>
        </form>
      </Card>

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Main Risk Overview Banner */}
          <Card className="p-5 sm:p-6 bg-white border border-grid/20 rounded-sm shadow-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Risk Evaluation:</span>
                  <Badge variant="risk" value={result.risk_level} />
                </div>
                <div className="text-base sm:text-lg font-heading font-bold text-forest font-mono break-all">
                  {result.normalized_url || result.original_input}
                </div>
                <div className="text-[11px] text-forest/60 font-mono">
                  DOMAIN: <strong className="text-forest font-semibold">{result.domain || 'N/A'}</strong> • TIMESTAMP: {new Date(result.scanned_at).toLocaleString()}
                </div>
              </div>

              {/* Technical Flat Score Block */}
              <div className={`p-4 border rounded-sm flex flex-col items-center justify-center shrink-0 min-w-[120px] ${getScoreBlockStyle(result.risk_score)}`}>
                <span className="text-3xl font-heading font-extrabold leading-none">{Math.round(result.risk_score)}</span>
                <span className="text-[9px] font-mono tracking-[0.1em] uppercase mt-1">SCORE / 100</span>
              </div>
            </div>
          </Card>

          {/* Tri-Engine Intelligence Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Machine Learning Card */}
              <Card className="p-4 bg-white border border-grid/20 rounded-sm space-y-1.5 shadow-none">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> AI Classifier
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${result.ml_available ? 'text-forest bg-mint border-forest/20 font-semibold' : 'text-grid/60 bg-paper-muted border-grid/20'
                    }`}>
                    {result.ml_available ? 'ONLINE // LOADED' : 'HEURISTIC FALLBACK'}
                  </span>
                </div>
                <p className="text-xs font-mono text-forest/80">
                  PREDICTION: <strong className="text-forest uppercase">{result.ml_prediction || 'Heuristic Fallback'}</strong>
                  {result.ml_confidence !== undefined && result.ml_confidence !== null && (
                    <span> ({Math.round(result.ml_confidence * 100)}% Confidence)</span>
                  )}
                </p>
              </Card>

              {/* URLhaus Threat Intel Card */}
              <Card className="p-4 bg-white border border-grid/20 rounded-sm space-y-1.5 shadow-none">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> URLhaus Intel
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${result.urlhaus_detected ? 'text-crimson bg-crimson/10 border-crimson/30 font-semibold' : 'text-forest bg-mint border-forest/20 font-semibold'
                    }`}>
                    {result.urlhaus_detected ? 'THREAT DETECTED' : 'FEED ACTIVE'}
                  </span>
                </div>
                <p className="text-xs font-mono text-forest/80">
                  {result.urlhaus_detected
                    ? 'CRITICAL: Verified abuse.ch malware distribution vector'
                    : 'Screened against 170k+ verified abuse.ch threat signatures.'}
                </p>
              </Card>

              {/* VirusTotal Card */}
              <Card className="p-4 bg-white border border-grid/20 rounded-sm space-y-1.5 shadow-none">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Global Telemetry
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${result.vt_available ? 'text-forest bg-mint border-forest/20 font-semibold' : 'text-grid/60 bg-paper-muted border-grid/20'
                    }`}>
                    {result.vt_available ? 'CONNECTED' : 'AUTONOMOUS MODE'}
                  </span>
                </div>
                <p className="text-xs font-mono text-forest/80">
                  {result.vt_available
                    ? `Detections: ${result.vt_malicious || 0} engines flagged vector`
                    : 'Operating locally (offline 27-feature pipeline active).'}
                </p>
              </Card>
            </div>

            {/* Detected Signals Box */}
            <Card className="p-5 space-y-3 bg-white border border-grid/20 rounded-sm shadow-none">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Detected Evidence & Signals ({result.signals.length})
              </h3>

              {result.signals.length === 0 ? (
                <div className="p-3 rounded-sm bg-mint/20 border border-forest/20 text-xs font-mono text-forest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-forest" />
                  Zero malicious signals detected. Structure conforms to standard web protocols.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {result.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-sm bg-paper border border-grid/20 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-forest">{sig.signal_type}</span>
                          <span className="text-[10px] font-mono text-forest/50 uppercase">[{sig.source}]</span>
                        </div>
                        <p className="text-xs font-sans text-forest/80 leading-relaxed">{sig.description}</p>
                      </div>
                      <Badge variant="severity" value={sig.severity} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Security Recommendations */}
            <Card className="p-5 space-y-2 bg-paper border border-grid/20 rounded-sm shadow-none">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest">Recommended Actions</h3>
              <ul className="space-y-1.5 text-xs font-sans text-forest/80">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
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
