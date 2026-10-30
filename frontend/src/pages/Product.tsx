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
      tag: 'SPEC-01 // RADAR',
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
      tag: 'SPEC-02 // MATRIX',
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
      tag: 'SPEC-03 // NLP',
      desc: 'Campus communication frequently faces spoofing: fake IT alerts demanding password verification, urgent financial aid refunds requiring gift cards, or impersonation of faculty members.',
      capabilities: [
        'Detection of urgency keywords and artificial pressure markers',
        'Flagging of unconventional payment demands (cryptocurrency, gift cards, wire transfers)',
        'Identification of authority claims (campus administration, professors, system admins)',
        'Zero-execution static analysis preserving student privacy and communications confidentiality',
      ],
      action: '/dashboard/analyze-message',
      actionLabel: 'Analyze Messages',
    },
    {
      id: 'attachment',
      title: 'Attachment Static Inspector',
      subtitle: 'Structural Analysis of Educational Documents',
      icon: FileWarning,
      tag: 'SPEC-04 // PARSER',
      desc: 'Malicious PDFs and weaponized HTML files disguise themselves as class syllabi, research papers, or campus invoices. We inspect document byte streams without running binary payload code.',
      capabilities: [
        'PDF inspection for JavaScript streams, OpenAction triggers, and Launch directives',
        'HTML inspection for hidden iframe redirects, script obfuscation, and credential forms',
        'Immediate quarantine recommendations prior to student interaction',
        'Strict 10MB file limit with deterministic static extraction',
      ],
      action: '/dashboard/analyze-file',
      actionLabel: 'Inspect Attachments',
    },
    {
      id: 'incident',
      title: 'Campus Incident Desk',
      subtitle: 'End-to-End Institutional Triage & Response',
      icon: AlertTriangle,
      tag: 'SPEC-05 // DESK',
      desc: 'Empowers students and faculty to escalate verified threats directly to university security operations with attached telemetry and audit trails.',
      capabilities: [
        'Incident submission with severity categorization (low, medium, high, critical)',
        'Automated linkage to prior scan records and evidence tokens',
        'Administrative dashboard with status transitions (submitted, investigating, resolved)',
        'Immutable audit logs tracking administrative reviews and enforcement decisions',
      ],
      action: '/dashboard/report-incident',
      actionLabel: 'Open Incident Desk',
    },
  ];

  return (
    <div className="space-y-16 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header */}
      <div className="border-b border-grid/20 pb-8 text-left max-w-4xl">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase mb-2">
          Architecture Specifications
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-[-0.04em] leading-[0.92] text-forest">
          Core Threat Engines & Defensive Architecture
        </h1>
        <p className="mt-4 text-sm sm:text-base text-forest/80 font-sans leading-relaxed">
          Detailed technical specifications for the five modular security systems defending university networks against phishing, quishing, and social engineering.
        </p>
      </div>

      {/* Feature Deep Dives */}
      <div className="space-y-8">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.id} id={sec.id} className="p-6 sm:p-8 bg-white border border-grid/20 rounded-sm shadow-none">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-paper border border-grid/20 flex items-center justify-center text-forest">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.1em] text-forest/60 uppercase">
                      {sec.tag}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-forest tracking-tight">{sec.title}</h2>
                    <p className="text-xs font-mono text-forest/60 mt-0.5">{sec.subtitle}</p>
                  </div>

                  <p className="text-xs font-sans text-forest/80 leading-relaxed">{sec.desc}</p>

                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60 mb-2 font-bold">
                      Technical Capabilities:
                    </div>
                    <ul className="space-y-1.5 font-mono text-xs text-forest/85">
                      {sec.capabilities.map((cap, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 shrink-0" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="w-full lg:w-64 pt-4 lg:pt-0 shrink-0">
                  <div className="p-4 rounded-sm bg-paper border border-grid/20 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-forest/60">
                      Module Status
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-forest">
                      <span className="w-2 h-2 rounded-full bg-forest" />
                      OPERATIONAL
                    </div>
                    <Link to={sec.action} className="block w-full">
                      <Button variant="primary" size="sm" className="w-full" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                        {sec.actionLabel}
                      </Button>
                    </Link>
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
