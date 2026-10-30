import React, { useState } from 'react';
import { MessageSquareWarning, ShieldAlert, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { messageService, MessageAnalysisResult } from '@/services/message.service';

export const MessageAnalysis: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MessageAnalysisResult | null>(null);

  const sampleMessages = [
    {
      title: 'IT Password Threat',
      text: 'URGENT: Campus IT Support. Your university email access expires in 24 hours due to suspicious login attempts. Verify your password immediately at our campus portal to prevent account suspension.',
    },
    {
      title: 'Grant Advance Fee',
      text: 'Congratulations! You have been selected for an emergency student grant of $2,500. To release your funds, purchase a $50 Apple gift card processing fee and message us the code right now.',
    },
    {
      title: 'Legitimate Notice (Safe)',
      text: 'Hi professor, I was reviewing the lecture notes for chapter 4 and had a question regarding the database normalization homework due next Monday. Are office hours still held on Zoom?',
    },
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide message text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await messageService.analyzeMessage(content.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Engine // 03
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Suspicious Message Analyzer</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Detects social engineering indicators, deceptive administrative impersonation, gift card advance-fee fraud, and coercive pressure.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Input Card */}
      <Card className="p-5 bg-white border border-grid/20 rounded-sm shadow-none">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-forest">
              Ingestion Payload (Email, SMS, or Direct Message text)
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste email body or suspicious message text..."
              className="w-full rounded-sm bg-paper border border-grid/20 p-3 text-xs font-mono text-forest placeholder:text-grid/40 focus:outline-none focus:border-forest shadow-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-grid/10">
            <div className="text-[11px] text-forest/60 font-mono">
              ZERO THIRD-PARTY EXPOSURE: Analyzed strictly within the local security boundary.
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} icon={<MessageSquareWarning className="w-3.5 h-3.5" />}>
              Analyze Text
            </Button>
          </div>
        </form>

        {/* Real Incident Presets */}
        <div className="mt-4 pt-3 border-t border-grid/10 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Load Incident Vector Presets:</div>
          <div className="flex flex-wrap gap-2">
            {sampleMessages.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setContent(sample.text)}
                className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-sm bg-paper border border-grid/20 text-forest hover:bg-forest hover:text-paper transition-colors duration-150"
              >
                [{sample.title}]
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Card className="p-5 sm:p-6 bg-white border border-grid/20 rounded-sm shadow-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-grid/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">Assessment:</span>
                  <Badge variant="risk" value={result.risk_level} />
                </div>
                <h3 className="text-lg font-heading font-bold text-forest capitalize">
                  {result.risk_level === 'safe' ? 'Legitimate Communication Structure' : 'Social Engineering Markers Detected'}
                </h3>
              </div>

              <div className="text-right">
                <div className="text-2xl font-heading font-extrabold text-forest">{Math.round(result.risk_score)} / 100</div>
                <div className="text-[10px] font-mono text-forest/60 uppercase">Heuristic Severity Score</div>
              </div>
            </div>

            {/* Detected Indicators */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-forest">
                Detected Red Flags & Signals ({result.indicators.length})
              </div>
              {result.indicators.length === 0 ? (
                <div className="p-3 rounded-sm bg-mint/20 border border-forest/20 text-xs font-mono text-forest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  No high-risk pressure keywords, gift card demands, or credential inquiries identified.
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

            {/* Explanations & Advice */}
            <div className="mt-5 pt-4 border-t border-grid/20 space-y-2 font-mono text-xs">
              <div className="font-bold uppercase tracking-wider text-forest">Safety Advisory</div>
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
