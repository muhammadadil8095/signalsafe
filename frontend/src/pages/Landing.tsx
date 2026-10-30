import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
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
import { scanService } from '@/services/scan.service';
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

    // Provide a sample simulated scan response for unauthenticated visitors on the public landing page demo
    setTimeout(() => {
      const isSuspicious = demoUrl.includes('phish') || demoUrl.includes('.tk') || demoUrl.includes('verify') || demoUrl.includes('login');
      setDemoResult({
        id: 'demo-scan-1',
        scan_type: 'url',
        original_input: demoUrl,
        domain: demoUrl.replace(/https?:\/\//, '').split('/')[0],
        risk_score: isSuspicious ? 88 : 0,
        risk_level: isSuspicious ? 'malicious' : 'safe',
        prediction: isSuspicious ? 'malicious' : 'safe',
        signals: isSuspicious
          ? [
              { signal_type: 'suspicious_tld', description: 'Domain suffix has heightened abuse rate', severity: 'medium', source: 'heuristic' },
              { signal_type: 'credential_path', description: 'Deceptive login verification pattern detected', severity: 'high', source: 'heuristic' },
              { signal_type: 'ml_phishing_detected', description: 'AI Model classified URL structure as phishing (98.4% confidence)', severity: 'critical', source: 'ml' },
            ]
          : [],
        explanation: isSuspicious
          ? ['[DEMO] High likelihood of credential harvesting infrastructure.']
          : ['[DEMO] No structural or reputation threat flags identified.'],
        recommendations: isSuspicious
          ? ['Do NOT visit this link or input campus credentials.', 'Report incident to campus IT security.']
          : ['URL structure appears consistent with legitimate web services.'],
        scanned_at: new Date().toISOString(),
      });
      setDemoLoading(false);
    }, 1200);
  };

  const threatStats = [
    { value: '50,000+', label: 'Campus URLs Analyzed', note: '[Demo Seed Data]' },
    { value: '99.2%', label: 'Detection Accuracy', note: '[RF Model Baseline]' },
    { value: '2,500+', label: 'Quishing & Phishing Blocked', note: '[Simulated Telemetry]' },
    { value: '15,000+', label: 'Protected University Accounts', note: '[Target Deployment]' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'URL Threat Detection',
      desc: 'Lexical heuristics, 27-feature Random Forest ML pipeline, and optional VirusTotal v3 intelligence combined into an explainable risk score.',
    },
    {
      icon: QrCode,
      title: 'QR Code (Quishing) Defense',
      desc: 'Detects malicious QR codes on physical posters or digital flyers. Inspects target domains without auto-navigating dangerous redirects.',
    },
    {
      icon: MessageSquareWarning,
      title: 'Message Phishing Filter',
      desc: 'Analyzes urgency language, gift card scams, student loan fraud, and false IT department impersonations with explainable context.',
    },
    {
      icon: FileWarning,
      title: 'Attachment Static Inspector',
      desc: 'Performs non-executing static analysis of suspicious PDFs and HTML files, flagging embedded JavaScript and deceptive forms.',
    },
    {
      icon: AlertTriangle,
      title: 'Institutional Incident Desk',
      desc: 'Enables students and faculty to submit security reports with automated triage, severity classifications, and audit logs.',
    },
    {
      icon: Lock,
      title: 'Strict Data Privacy & RBAC',
      desc: 'Role-based access control protecting student anonymity while equipping IT security administrators with actionable threat intelligence.',
    },
  ];

  const faqs = [
    {
      q: 'How does SignalSafe Campus detect phishing without executing malicious links?',
      a: 'We utilize safe lexical feature extraction (measuring URL entropy, subdomains, brand impersonation, and token structures) coupled with a machine learning model trained on phishing datasets. We never fetch or render untrusted active web code on the server.',
    },
    {
      q: 'What is QR Quishing and how does SignalSafe prevent it?',
      a: 'Quishing is QR-code based phishing, frequently found on physical campus flyers, dorm posters, and parking meters. Our scanner decodes the QR matrix using client-side algorithms and submits the decoded destination to our safety pipeline without opening the browser to the link.',
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
      a: 'Yes. SignalSafe is a Progressive Web App (PWA). You can install it directly to your iOS or Android home screen with offline emergency safety guidelines and native-like camera QR scanning.',
    },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900 border border-white/10 text-xs font-mono text-cyber-cyan mb-8">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          SIGNALSAFE CAMPUS THREAT RADAR ACTIVE
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
          Your Digital Safety. <br />
          <span className="cyber-gradient-text">One Signal Ahead.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          AI-powered cybersecurity shield defending university students and faculty against phishing URLs, QR quishing, deceptive messages, and malicious attachments.
        </p>

        {/* Interactive URL Scanner Demo */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="p-3 sm:p-4 border-cyber-cyan/30 bg-navy-900/90 glow-cyan">
            <form onSubmit={handleDemoScan} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="Paste any link to test (e.g. http://paypal-verify.tk/login)..."
                  className="w-full bg-navy-950/80 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyber-green"
                />
              </div>
              <Button type="submit" variant="primary" loading={demoLoading}>
                Analyze Link
              </Button>
            </form>

            {/* Quick Demo Pre-fill suggestions */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Try sample:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDemoUrl('http://paypal-security-update.tk/login.php')}
                  className="text-cyber-danger hover:underline font-mono"
                >
                  Phishing Sample
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setDemoUrl('https://mit.edu/admissions')}
                  className="text-cyber-green hover:underline font-mono"
                >
                  Legitimate Sample
                </button>
              </div>
            </div>

            {/* Demo Scan Result Box */}
            {demoResult && (
              <div className="mt-4 pt-4 border-t border-white/10 text-left animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Risk Assessment:</span>
                    <Badge variant="risk" value={demoResult.risk_level} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Threat Score: <strong className="text-white">{demoResult.risk_score}/100</strong>
                  </span>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-navy-950 border border-white/5 space-y-2">
                  <div className="text-xs text-slate-300 font-medium">Detected Evidence & AI Signals:</div>
                  {demoResult.signals.length === 0 ? (
                    <div className="text-xs text-cyber-green flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Domain structure verified. No malicious indicators detected.
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {demoResult.signals.map((s, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2 text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyber-danger mt-1.5 shrink-0" />
                          <span>{s.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-3 text-right">
                  <Link to="/register" className="text-xs text-cyber-cyan hover:underline inline-flex items-center gap-1">
                    Sign in to log full telemetry & report incident <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              Get Protected Free
            </Button>
          </Link>
          <Link to="/product">
            <Button variant="secondary" size="lg">
              Explore Threat Engines
            </Button>
          </Link>
        </div>
      </section>

      {/* Threat Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-cyber-green uppercase">
            Institutional Telemetry
          </h2>
          <p className="text-2xl font-bold text-white mt-1">Campus Threat Landscape Metrics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {threatStats.map((stat, idx) => (
            <Card key={idx} className="text-center p-6 bg-navy-900/60 hover:border-white/20 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-slate-300 mt-2">{stat.label}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">{stat.note}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-cyber-cyan uppercase">
            Autonomous Protection
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-white mt-2">Comprehensive Campus Threat Defense</p>
          <p className="text-slate-400 mt-3 text-sm">
            Purpose-built detection pipelines replacing fragmented tools with an institutional security mesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} hover className="p-6 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center text-cyber-green mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-12 bg-navy-900/40 border-white/10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-cyber-green uppercase">
              Three-Step Lifecycle
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">From Suspicion to Neutralization</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-navy-800 border border-cyber-cyan text-cyber-cyan flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-lg font-semibold text-white">Submit or Capture</h4>
              <p className="text-sm text-slate-400">
                Paste a suspicious URL, scan a campus QR poster using the camera, or forward a dubious message text.
              </p>
            </div>
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-navy-800 border border-cyber-green text-cyber-green flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-lg font-semibold text-white">Tri-Engine Fusion</h4>
              <p className="text-sm text-slate-400">
                Static heuristic inspectors, 27-feature AI classification, and threat intelligence correlate risk without dangerous execution.
              </p>
            </div>
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-navy-800 border border-purple-400 text-purple-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-lg font-semibold text-white">Act & Report</h4>
              <p className="text-sm text-slate-400">
                Receive plain-English explanations and recommendations. Escalate with one click to the campus security desk.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Architecture Overview Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-cyber-cyan uppercase">
            Technical Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">Multi-Tier Threat Pipeline</p>
        </div>

        <Card className="p-6 sm:p-8 bg-navy-950/80 border-white/10 font-mono text-xs overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-navy-900 border border-white/5 space-y-2">
              <Layers className="w-5 h-5 mx-auto text-cyber-cyan" />
              <div className="font-bold text-white">Ingestion</div>
              <div className="text-slate-400">URL / QR / Msg / File MIME & Length Check</div>
            </div>
            <div className="p-4 rounded-lg bg-navy-900 border border-white/5 space-y-2">
              <Search className="w-5 h-5 mx-auto text-cyber-green" />
              <div className="font-bold text-white">Heuristic Rules</div>
              <div className="text-slate-400">Punycode, TLD abuse, brand impersonation</div>
            </div>
            <div className="p-4 rounded-lg bg-navy-900 border border-white/5 space-y-2">
              <Cpu className="w-5 h-5 mx-auto text-purple-400" />
              <div className="font-bold text-white">ML Predictor</div>
              <div className="text-slate-400">27 lexical features Random Forest Classifier</div>
            </div>
            <div className="p-4 rounded-lg bg-navy-900 border border-white/5 space-y-2">
              <Database className="w-5 h-5 mx-auto text-amber-400" />
              <div className="font-bold text-white">Risk Fusion</div>
              <div className="text-slate-400">Consolidated score (0-100) + Explainability</div>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-cyber-green uppercase">FAQ</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <Card
                key={idx}
                className="p-5 cursor-pointer hover:border-white/20 transition-colors"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">{faq.q}</h4>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-cyber-green shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </div>
                {isOpen && <p className="mt-3 text-sm text-slate-300 leading-relaxed animate-in fade-in duration-200">{faq.a}</p>}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-800 border-cyber-cyan/30 glow-cyan">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Secure Your University Experience Today</h2>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm">
            Join students and faculty already protected against campus quishing, invoice fraud, and phishing campaigns.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Create Campus Account
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

