import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  QrCode,
  MessageSquareWarning,
  FileWarning,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const Product: React.FC = () => {
  const sections = [
    {
      id: 'url',
      title: 'URL Threat Scanner',
      subtitle: 'Multi-Signal Autonomous Web Threat Detection',
      icon: Shield,
      color: 'text-cyber-green',
      desc: 'Our primary defense engine combines static lexical analysis, 27 machine learning features, and external reputation databases to classify suspicious destinations before users interact with them.',
      capabilities: [
        'Heuristic inspection of URL length, punycode, TLDs, and path patterns',
        'Machine learning classification via Random Forest trained on verified phishing datasets',
        'Optional VirusTotal v3 asynchronous intelligence lookup',
        'Consolidated 0-100 risk score with human-readable rationale and actionable next steps',
      ],
      action: '/dashboard/scan-url',
      actionLabel: 'Launch URL Scanner',
    },
    {
      id: 'qr',
      title: 'QR Code Quishing Shield',
      subtitle: 'Physical & Digital QR Threat Neutralization',
      icon: QrCode,
      color: 'text-cyber-cyan',
      desc: 'QR codes are pervasive on university campuses — on bulletin boards, parking meters, and library desks. Attackers replace legitimate codes with malicious redirects.',
      capabilities: [
        'Live device camera QR scanning with client-side matrix decoding',
        'Image file upload alternative for QR screenshots and digital flyers',
        'Destination isolation: decodes and inspects without automatic browser redirection',
        'Immediate risk assessment before visiting university portals or payment gateways',
      ],
      action: '/dashboard/scan-qr',
      actionLabel: 'Open QR Scanner',
    },
    {
      id: 'message',
      title: 'Suspicious Message Analyzer',
      subtitle: 'Social Engineering & Coercive Phishing Detection',
      icon: MessageSquareWarning,
      color: 'text-amber-400',
      desc: 'Campus communication frequently faces spoofing: fake IT alerts demanding password verification, urgent financial aid refunds requiring gift cards, or impersonation of faculty members.',
      capabilities: [
        'Detection of urgency keywords and artificial pressure markers',
        'Flagging of unconventional payment demands (cryptocurrency, gift cards, wire transfers)',
        'Authority impersonation detection (IT desk, dean, registrar, financial aid office)',
        'Clear contextual guidance without misclassifying legitimate academic disagreement',
      ],
      action: '/dashboard/analyze-message',
      actionLabel: 'Analyze Message',
    },
    {
      id: 'attachment',
      title: 'Attachment Static Inspector',
      subtitle: 'Safe Structural Parsing for PDF and HTML Files',
      icon: FileWarning,
      color: 'text-purple-400',
      desc: 'Deceptive syllabi, financial aid notices, and academic materials are often distributed via PDF and HTML attachments containing embedded exploits or credential forms.',
      capabilities: [
        'Zero execution policy: static inspection of file structure only',
        'PDF inspection: OpenAction triggers, /Launch commands, embedded binaries, and external URIs',
        'HTML inspection: External form actions, hidden iframes, script obfuscation, and meta-refresh',
        '10MB maximum file size limit, strict MIME verification, and immediate server memory cleanup',
      ],
      action: '/dashboard/analyze-file',
      actionLabel: 'Inspect File Attachment',
    },
    {
      id: 'incident',
      title: 'Campus Incident Desk',
      subtitle: 'Collaborative Reporting & Threat Mitigation',
      icon: AlertTriangle,
      color: 'text-rose-400',
      desc: 'Empowers university students and faculty to escalate confirmed threats directly to security operations centers for institutional takedown and remediation.',
      capabilities: [
        'End-to-end incident lifecycle: Submitted → Under Review → Investigating → Resolved',
        'Severity triage and administrative status management',
        'Optional linking of scan evidence to report submissions',
        'Immutable audit logs tracking all administrative actions and status updates',
      ],
      action: '/dashboard/report-incident',
      actionLabel: 'Submit Security Report',
    },
  ];

  return (
    <div className="py-12 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Product & <span className="cyber-gradient-text">Protection Engines</span>
        </h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Deep-dive into the five foundational cybersecurity capabilities defending university campuses against modern digital threats.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          const isEven = idx % 2 === 0;
          return (
            <Card
              key={sec.id}
              id={sec.id}
              className="p-8 sm:p-12 border-white/10 bg-navy-900/60 transition-all hover:border-white/20"
            >
              <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-start ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-navy-800 border border-white/10 ${sec.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{sec.title}</h2>
                      <div className="text-xs font-mono text-slate-400">{sec.subtitle}</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed pt-2">{sec.desc}</p>

                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Capabilities</h4>
                    <ul className="space-y-2">
                      {sec.capabilities.map((cap, capIdx) => (
                        <li key={capIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-cyber-green shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Link to={sec.action}>
                      <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                        {sec.actionLabel}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="w-full lg:w-5/12 rounded-xl bg-navy-950 border border-white/10 p-5 font-mono text-xs text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" /> ENGINE_SPEC.JSON
                    </span>
                    <span>STANDALONE MODE</span>
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    <p><span className="text-cyber-cyan">"target_scope"</span>: "Campus Network & User Submissions",</p>
                    <p><span className="text-cyber-cyan">"execution_model"</span>: "Zero-Execution Static Parsing",</p>
                    <p><span className="text-cyber-cyan">"explainability"</span>: "True",</p>
                    <p><span className="text-cyber-cyan">"persistence"</span>: "SQLAlchemy & Audit Store",</p>
                    <p><span className="text-cyber-cyan">"status"</span>: "Production Ready"</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

