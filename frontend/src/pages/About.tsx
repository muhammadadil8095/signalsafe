import React from 'react';
import { Card } from '@/components/ui/Card';
import { Cpu, Database, AlertCircle, ShieldCheck, Scale, FileText } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="py-8 space-y-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header */}
      <div className="border-b border-grid/20 pb-6 text-left max-w-3xl">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase mb-2">
          Methodology & Governance
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold tracking-[-0.04em] leading-[0.92] text-forest">
          Engineering Methodology & AI Research
        </h1>
        <p className="mt-4 text-sm text-forest/80 font-sans leading-relaxed">
          The engineering architecture, 27-feature pipeline, dataset provenance, and responsible AI framework powering SignalSafe Campus.
        </p>
      </div>

      {/* Project Overview */}
      <Card className="p-6 sm:p-8 space-y-3 bg-white border border-grid/20 rounded-sm shadow-none">
        <div className="flex items-center gap-2 text-forest">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-xl font-heading font-bold tracking-tight">Project Overview & Motivation</h2>
        </div>
        <p className="text-xs font-sans text-forest/80 leading-relaxed">
          Universities represent high-density target environments for social engineering. With thousands of students interacting with unfamiliar online portals, course syllabi, campus housing boards, and financial aid systems each semester, threat actors increasingly weaponize collegiate trust.
        </p>
        <p className="text-xs font-sans text-forest/80 leading-relaxed">
          SignalSafe Campus was developed to bridge the vulnerability gap between enterprise security operations and daily campus student experiences. Rather than functioning as a black-box blocker, our platform emphasizes <strong>transparent detection, deterministic explanations, and user empowerment</strong>.
        </p>
      </Card>

      {/* ML Methodology */}
      <Card id="ml" className="p-6 sm:p-8 space-y-5 bg-white border border-grid/20 rounded-sm shadow-none">
        <div className="flex items-center gap-2 text-forest">
          <Cpu className="w-5 h-5" />
          <h2 className="text-xl font-heading font-bold tracking-tight">27-Feature Machine Learning Pipeline</h2>
        </div>
        <p className="text-xs font-sans text-forest/80 leading-relaxed">
          Phishing URLs display distinct lexical and structural anomalies designed to deceive human readers while traversing web infrastructure. Our feature extraction pipeline calculates 27 numerical indicators completely offline:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-4 rounded-sm bg-paper border border-grid/20 space-y-1.5">
            <div className="text-forest font-bold uppercase text-[10px]">Structural Metrics (1–14)</div>
            <p className="text-forest/70 text-[11px]">• URL length, domain length, path length</p>
            <p className="text-forest/70 text-[11px]">• Dot, hyphen, underscore, slash counts</p>
            <p className="text-forest/70 text-[11px]">• Query parameter count & fragment presence</p>
            <p className="text-forest/70 text-[11px]">• Raw IP address in domain authority</p>
            <p className="text-forest/70 text-[11px]">• '@' credential obfuscation token</p>
            <p className="text-forest/70 text-[11px]">• Double slash redirect indicators</p>
          </div>
          <div className="p-4 rounded-sm bg-paper border border-grid/20 space-y-1.5">
            <div className="text-forest font-bold uppercase text-[10px]">Statistical & Reputation (15–27)</div>
            <p className="text-forest/70 text-[11px]">• HTTPS scheme validation & www prefix</p>
            <p className="text-forest/70 text-[11px]">• Subdomain hierarchy depth counter</p>
            <p className="text-forest/70 text-[11px]">• Known URL shortener domain mapping</p>
            <p className="text-forest/70 text-[11px]">• High-abuse TLD cross-referencing</p>
            <p className="text-forest/70 text-[11px]">• Non-standard port identifiers</p>
            <p className="text-forest/70 text-[11px]">• Shannon entropy calculation (token randomness)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-sm bg-paper border border-grid/20 text-xs font-mono text-forest/80 space-y-1">
          <div className="font-bold text-forest uppercase text-[10px]">Model Evaluation</div>
          <p className="text-[11px] leading-relaxed">
            During candidate evaluation, Random Forest and XGBoost classifiers were trained using stratified 5-fold cross-validation. Random Forest exhibited deterministic classification, minimal inference latency (&lt; 1ms), and zero external network overhead, serialized via Joblib.
          </p>
        </div>
      </Card>

      {/* Dataset Sources */}
      <Card className="p-6 sm:p-8 space-y-4 bg-white border border-grid/20 rounded-sm shadow-none">
        <div className="flex items-center gap-2 text-forest">
          <Database className="w-5 h-5" />
          <h2 className="text-xl font-heading font-bold tracking-tight">Dataset Provenance & Curation</h2>
        </div>
        <p className="text-xs font-sans text-forest/80 leading-relaxed">
          The models are evaluated against verified academic and industry corpora:
        </p>
        <ul className="text-xs font-mono text-forest/80 space-y-2 list-disc pl-5">
          <li><strong>PhishTank Corpus</strong>: Verified active phishing links validated by security analysts.</li>
          <li><strong>Tranco Top 1M</strong>: Research-grade ranking of legitimate web domains to prevent false positives.</li>
          <li><strong>UCI Phishing Websites Benchmark</strong>: Peer-reviewed baseline for lexical feature correlation.</li>
        </ul>
        <div className="p-3 rounded-sm bg-mint/20 border border-forest/20 text-xs font-mono text-forest">
          Integrity Assurance: Zero fabricated detection statistics or synthetic accuracy metrics. Models execute genuine numerical inference on extracted feature vectors.
        </div>
      </Card>

      {/* Responsible AI & Limitations */}
      <Card id="responsible-ai" className="p-6 sm:p-8 space-y-4 bg-white border border-grid/20 rounded-sm shadow-none">
        <div className="flex items-center gap-2 text-forest">
          <Scale className="w-5 h-5" />
          <h2 className="text-xl font-heading font-bold tracking-tight">Limitations & Responsible AI Principles</h2>
        </div>
        <div className="space-y-3 text-xs font-sans text-forest/80 leading-relaxed">
          <p>
            <strong>1. Explainability Over Black-Box Decisions:</strong> Every scan returns explicit technical signals (e.g. why a URL was marked suspicious) alongside concrete recommendations. Users are never presented with arbitrary unexplained blocks.
          </p>
          <p>
            <strong>2. Academic Freedom & Disagreement:</strong> The Message Analyzer is calibrated specifically for financial scams, credential theft, and authority impersonation. Ordinary academic debate, grading disagreements, or emotional expression are strictly never labeled as cyber threats.
          </p>
          <p>
            <strong>3. Non-Execution Sandbox:</strong> Files and URLs are inspected through static heuristics and metadata parsing. SignalSafe does not execute active script payloads or trigger server-side request forgery (SSRF) loops against submitted URLs.
          </p>
          <p>
            <strong>4. Probabilistic Fallibility:</strong> No AI model is infallible. SignalSafe Campus should complement, not replace, university IT security guidelines, multi-factor authentication (MFA), and user vigilance.
          </p>
        </div>
      </Card>
    </div>
  );
};
