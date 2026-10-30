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
      title: 'Fake IT Password Reset',
      text: 'URGENT: Campus IT Support. Your university email access expires in 24 hours due to suspicious login attempts. Verify your password immediately at our campus portal to prevent account suspension.',
    },
    {
      title: 'Financial Aid Scam',
      text: 'Congratulations! You have been selected for an emergency student grant of $2,500. To release your funds, purchase a $50 Apple gift card processing fee and message us the code right now.',
    },
    {
      title: 'Legitimate Question (Safe)',
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Suspicious Message Analyzer</h1>
        <p className="text-xs text-slate-400 mt-1">
          Detect social engineering, false IT department notifications, student financial scams, and coercive language.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Input Card */}
      <Card className="p-6 bg-navy-900/80 border-white/10 glow-cyan">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Message Content (Email, SMS, or Direct Message text)
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste email body or text message here..."
              className="w-full rounded-lg bg-navy-900 border border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-400 font-mono">
              Preserves privacy: Message content is inspected statically without third-party tracking.
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} icon={<MessageSquareWarning className="w-4 h-4" />}>
              Analyze Message
            </Button>
          </div>
        </form>

        {/* Demo Example Buttons */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Load Demonstration Examples:</div>
          <div className="flex flex-wrap gap-2">
            {sampleMessages.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setContent(sample.text)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-navy-950 border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>
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
                <h3 className="text-xl font-bold text-white capitalize">
                  {result.risk_level === 'safe' ? 'Legitimate Communication' : 'Social Engineering Threat Detected'}
                </h3>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-3xl font-black text-white">{Math.round(result.risk_score)}/100</div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Risk Level Score</div>
              </div>
            </div>

            {/* Detected Indicators */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detected Red Flags & Signals ({result.indicators.length})
              </h4>
              {result.indicators.length === 0 ? (
                <div className="p-4 rounded-lg bg-navy-950 border border-white/5 text-xs text-cyber-green flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  No high-risk pressure keywords, gift card demands, or credential inquiries identified.
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

            {/* Explanations & Advice */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-semibold text-white">Security Guidance</h4>
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

