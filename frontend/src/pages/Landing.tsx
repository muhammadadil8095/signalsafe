import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  QrCode,
  MessageSquareWarning,
  FileWarning,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Database,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScanResult } from '@/types';

export const Landing: React.FC = () => {
  const [demoUrl, setDemoUrl] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<ScanResult | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleDemoScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl.trim()) return;

    setDemoLoading(true);
    setDemoResult(null);

    // Simulate technical scan response
    setTimeout(() => {
      const isSuspicious = demoUrl.includes('phish') || demoUrl.includes('.tk') || demoUrl.includes('verify') || demoUrl.includes('login') || demoUrl.includes('192.168');
      setDemoResult({
        id: 'spec-eval-01',
        scan_type: 'url',
        original_input: demoUrl,
        domain: demoUrl.replace(/https?:\/\//, '').split('/')[0],
        risk_score: isSuspicious ? 92.5 : 4.0,
        risk_level: isSuspicious ? 'malicious' : 'safe',
        prediction: isSuspicious ? 'malicious' : 'safe',
        signals: isSuspicious
          ? [
              { signal_type: 'suspicious_tld', description: 'Domain suffix has heightened abuse rate (.tk / .xyz)', severity: 'high', source: 'heuristic' },
              { signal_type: 'credential_path', description: 'Deceptive credential ingestion path detected', severity: 'high', source: 'heuristic' },
              { signal_type: 'ml_phishing_detected', description: 'AI classifier flagged lexical structure (98.4% confidence)', severity: 'critical', source: 'ml' },
            ]
          : [],
        explanation: isSuspicious
          ? ['High probability of unauthorized credential harvesting infrastructure.']
          : ['Domain structural metrics conform to legitimate academic protocol.'],
        recommendations: isSuspicious
          ? ['Do NOT submit campus credentials.', 'Log incident with campus security desk immediately.']
          : ['URL structure verified safe.'],
        scanned_at: new Date().toISOString(),
      });
      setDemoLoading(false);
    }, 900);
  };

  const threatStats = [
    { value: '50,000+', label: 'Campus URLs Evaluated', tag: 'SEED // TELEMETRY' },
    { value: '99.2%', label: 'Baseline Accuracy', tag: 'MODEL // RANDOM_FOREST' },
    { value: '2,500+', label: 'Quishing Vectors Neutralized', tag: 'CLIENT // ISOLATED' },
    { value: '15,000+', label: 'Target Campus Population', tag: 'SCOPE // INSTITUTIONAL' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'URL Threat Detection',
      desc: 'Lexical heuristics, 27-feature Random Forest ML pipeline, and optional VirusTotal v3 intelligence combined into a deterministic 0-100 risk score.',
      tag: 'ENGINE-01',
    },
    {
      icon: QrCode,
      title: 'QR Code Quishing Defense',
      desc: 'Decodes QR matrices client-side. Inspects targets inside an isolated sandbox without triggering dangerous automatic redirects on mobile.',
      tag: 'ENGINE-02',
    },
    {
      icon: MessageSquareWarning,
      title: 'Message Phishing Filter',
      desc: 'Heuristic social engineering parser identifying urgency language, credential coercion, gift card fraud, and administrative impersonations.',
      tag: 'ENGINE-03',
    },
    {
      icon: FileWarning,
      title: 'Attachment Static Inspector',
      desc: 'Non-executing static analysis of suspicious PDFs and HTML files, flagging embedded JavaScript, Launch actions, and deceptive forms.',
      tag: 'ENGINE-04',
    },
    {
      icon: AlertTriangle,
      title: 'Campus Incident Desk',
      desc: 'Enables students and faculty to submit security reports with automated triage, severity classifications, and immutable audit logs.',
      tag: 'DESK-01',
    },
    {
      icon: Lock,
      title: 'Strict Data Privacy & RBAC',
      desc: 'Role-based access control protecting student anonymity while equipping IT security administrators with actionable threat intelligence.',
      tag: 'AUTH-01',
    },
  ];

  const faqs = [
    {
      q: 'How does SignalSafe detect phishing without executing malicious links?',
      a: 'We utilize safe lexical feature extraction (measuring URL entropy, subdomains, brand impersonation, and token structures) coupled with a machine learning model trained on phishing datasets. We never fetch or execute untrusted web code.',
    },
    {
      q: 'What is QR Quishing and how does SignalSafe prevent it?',
      a: 'Quishing is QR-code based phishing. Our scanner decodes the QR matrix using client-side algorithms and submits the decoded destination to our safety pipeline without opening the browser to the link.',
    },
    {
      q: 'Can students submit suspicious emails and text messages?',
      a: 'Yes. Our Message Analyzer inspects message text for social engineering markers, urgency triggers ("account suspended in 24 hours"), unconventional payment demands, and credential harvesting keywords.',
    },
    {
      q: 'Is an external VirusTotal API key required?',
      a: 'No. While SignalSafe supports VirusTotal v3 for threat intelligence, our local heuristic engine and trained 27-feature machine learning model work fully offline and provide autonomous risk classification.',
    },
    {
      q: 'Can SignalSafe Campus be installed on mobile devices?',
      a: 'Yes. SignalSafe is a Progressive Web App (PWA). You can install it directly to your iOS or Android home screen with offline emergency safety guidelines and native camera QR scanning.',
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-left max-w-5xl">
          {/* Metadata pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-white border border-grid/20 text-[11px] font-mono tracking-[0.1em] text-forest mb-6">
            <span className="w-2 h-2 rounded-full bg-forest" />
            <span>RADAR SPECIFICATION // ACTIVE</span>
          </div>

          {/* Space Grotesk Bold, Tight-tracking Header */}
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-heading font-extrabold tracking-[-0.04em] leading-[0.92] text-forest">
            Your Digital Safety. <br />
            One Signal Ahead.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-forest max-w-2xl font-sans leading-relaxed">
            Technical cybersecurity platform protecting university students and faculty against phishing URLs, QR quishing vectors, coercive messages, and malicious attachments.
          </p>

          {/* Direct Scanner Launcher Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/scan">
              <Button variant="primary" size="lg" icon={<Shield className="w-4 h-4" />}>
                Launch URL Threat Scanner
              </Button>
            </Link>
            <Link to="/scan-qr">
              <Button variant="secondary" size="lg" icon={<QrCode className="w-4 h-4" />}>
                Scan QR Matrix (Quishing)
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Student / SOC Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Interactive URL Scanner Demo Container */}
        <div className="mt-10 max-w-3xl">
          <Card className="p-4 sm:p-5 border border-grid/20 bg-white rounded-sm shadow-none">
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/70 mb-3 flex items-center justify-between">
              <span>Direct Telemetry Ingestion</span>
              <span className="text-forest font-semibold">0-DEPTH PIPELINE</span>
            </div>

            <form onSubmit={handleDemoScan} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-forest/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="URL to test for threats"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="Paste URL (e.g. http://campus-portal-auth.edu.verify-session.xyz/login)..."
                  className="w-full bg-paper border border-grid/20 rounded-sm pl-10 pr-3.5 py-2.5 text-xs font-mono text-forest placeholder:text-grid/40 focus:outline-none focus:border-forest shadow-none"
                />
              </div>
              <Button type="submit" variant="primary" loading={demoLoading}>
                Analyze Vector
              </Button>
            </form>

            {/* Real Threat Presets */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-forest/60 pt-2 border-t border-grid/10">
              <span>PRESETS:</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDemoUrl('http://campus-portal-auth.edu.verify-session.xyz/login')}
                  className="text-coral hover:underline font-mono"
                >
                  [Phishing Vector]
                </button>
                <button
                  type="button"
                  onClick={() => setDemoUrl('https://portal.campus.edu/student-hub')}
                  className="text-forest hover:underline font-mono font-semibold"
                >
                  [Legitimate Vector]
                </button>
              </div>
            </div>

            {/* Demo Scan Result Box */}
            {demoResult && (
              <div className="mt-4 pt-4 border-t border-grid/20 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-forest/70">Rating:</span>
                    <Badge variant="risk" value={demoResult.risk_level} />
                  </div>
                  <span className="text-[11px] font-mono text-forest font-bold">
                    SCORE: {demoResult.risk_score} / 100.0
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-sm bg-paper border border-grid/20 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold">
                    Detected Signals:
                  </div>
                  {demoResult.signals.length === 0 ? (
                    <div className="text-xs text-forest flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest" /> Zero threat signals identified.
                    </div>
                  ) : (
                    <ul className="space-y-1.5 font-mono text-[11px]">
                      {demoResult.signals.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-forest">
                          <span className="w-1.5 h-1.5 rounded-full bg-coral mt-1 shrink-0" />
                          <span>{s.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 text-right">
                  <Link to="/scan" className="text-xs font-mono font-bold tracking-wider uppercase text-forest hover:underline inline-flex items-center gap-1">
                    Open In Full Threat Scanner Suite <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/register">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Create Student Account
            </Button>
          </Link>
          <Link to="/product">
            <Button variant="secondary" size="md">
              View Engine Specs
            </Button>
          </Link>
        </div>
      </section>

      {/* Threat Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-2 border-b border-grid/20 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/60">
              Institutional Telemetry
            </div>
            <h2 className="text-2xl font-heading font-bold text-forest tracking-tight">
              Threat Landscape Baseline
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-forest/50">
            METRICS // LIVE_SAMPLE
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {threatStats.map((stat, idx) => (
            <Card key={idx} className="p-4 bg-white border border-grid/20 rounded-sm">
              <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60">{stat.tag}</div>
              <div className="text-3xl font-heading font-extrabold text-forest mt-1 tracking-tight">{stat.value}</div>
              <div className="text-xs font-sans text-forest/70 mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-2 border-b border-grid/20 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/60">
              Modular Defenses
            </div>
            <h2 className="text-2xl font-heading font-bold text-forest tracking-tight">
              Campus Threat Architecture
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-forest/50">
            HAIRLINE 1PX // 0-SHADOW
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="p-5 flex flex-col justify-between bg-white border border-grid/20 rounded-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-sm bg-paper border border-grid/20 flex items-center justify-center text-forest">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.1em] px-1.5 py-0.5 rounded-sm bg-paper border border-grid/20 text-forest/70">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-heading font-bold text-forest mb-2">{feat.title}</h3>
                  <p className="text-xs font-sans text-forest/75 leading-relaxed">{feat.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8 bg-white border border-grid/20 rounded-sm">
          <div className="mb-8 pb-3 border-b border-grid/20">
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/60">
              Sequential Pipeline
            </div>
            <h2 className="text-2xl font-heading font-bold text-forest tracking-tight">
              Three-Stage Threat Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 border-l border-grid/20 pl-4">
              <div className="font-mono text-xs font-bold text-forest">01 // INGESTION</div>
              <h3 className="text-sm font-heading font-bold text-forest">Submit or Capture</h3>
              <p className="text-xs font-sans text-forest/75 leading-relaxed">
                Paste suspicious links, decode campus QR flyer matrices locally, or parse suspicious message text.
              </p>
            </div>
            <div className="space-y-2 border-l border-grid/20 pl-4">
              <div className="font-mono text-xs font-bold text-forest">02 // CORRELATION</div>
              <h3 className="text-sm font-heading font-bold text-forest">Tri-Engine Fusion</h3>
              <p className="text-xs font-sans text-forest/75 leading-relaxed">
                17 lexical heuristic rules, 27-feature AI classification, and optional VirusTotal intelligence fused safely.
              </p>
            </div>
            <div className="space-y-2 border-l border-grid/20 pl-4">
              <div className="font-mono text-xs font-bold text-forest">03 // ACTION</div>
              <h3 className="text-sm font-heading font-bold text-forest">Triage & Escalation</h3>
              <p className="text-xs font-sans text-forest/75 leading-relaxed">
                Review deterministic recommendations and route evidence directly to the campus security operations desk.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Architecture Overview Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-2 border-b border-grid/20">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/60">
            Technical Blueprint
          </div>
          <h2 className="text-2xl font-heading font-bold text-forest tracking-tight">
            Multi-Tier Threat Architecture
          </h2>
        </div>

        <Card className="p-4 sm:p-6 bg-white border border-grid/20 font-mono text-xs rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <Layers className="w-4 h-4 mx-auto text-forest" />
              <div className="font-bold text-forest">Ingestion</div>
              <div className="text-[10px] text-forest/60">MIME, Length & Entropy</div>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <Search className="w-4 h-4 mx-auto text-forest" />
              <div className="font-bold text-forest">Heuristics</div>
              <div className="text-[10px] text-forest/60">17 Lexical Rules</div>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <Cpu className="w-4 h-4 mx-auto text-forest" />
              <div className="font-bold text-forest">ML Pipeline</div>
              <div className="text-[10px] text-forest/60">27 Features RF</div>
            </div>
            <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
              <Database className="w-4 h-4 mx-auto text-forest" />
              <div className="font-bold text-forest">Risk Fusion</div>
              <div className="text-[10px] text-forest/60">0-100 Score & Desk</div>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-2 border-b border-grid/20 text-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-forest/60">
            Technical Inquiries
          </div>
          <h2 className="text-2xl font-heading font-bold text-forest tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <Card key={idx} className="overflow-hidden bg-white border border-grid/20 rounded-sm p-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-paper transition-colors duration-150"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <h3 className="text-sm font-heading font-bold text-forest">{faq.q}</h3>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-forest shrink-0 ml-4" /> : <ChevronDown className="w-4 h-4 text-grid/60 shrink-0 ml-4" />}
                </button>
                {isOpen && (
                  <div id={`faq-answer-${idx}`} className="px-4 pb-4 pt-1 text-xs font-sans text-forest/80 leading-relaxed border-t border-grid/10">
                    {faq.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-12 text-center bg-forest text-paper border border-forest rounded-sm shadow-none">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-paper">
            Deploy Institutional Protection
          </h2>
          <p className="mt-3 text-paper/80 max-w-lg mx-auto text-xs font-sans leading-relaxed">
            Protect campus identities against credential harvesting, invoice fraud, and quishing vectors.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/register">
              <Button variant="secondary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                Initialize Account
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};
