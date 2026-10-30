import React from 'react';
import { Card } from '@/components/ui/Card';
import { Cpu, Database, AlertCircle, ShieldCheck, Scale, FileText } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="py-12 space-y-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          About & <span className="cyber-gradient-text">Threat Research</span>
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          The engineering methodology, dataset curation, machine learning pipeline, and responsible AI framework powering SignalSafe Campus.
        </p>
      </div>

      {/* Project Overview */}
      <Card className="p-8 space-y-4 bg-navy-900/60 border-white/10">
        <div className="flex items-center gap-3 text-cyber-green">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">Project Overview & Motivation</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Universities represent high-density target environments for social engineering. With thousands of students interacting with unfamiliar online portals, course syllabi, campus housing boards, and financial aid systems each semester, threat actors increasingly weaponize collegiate trust.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          SignalSafe Campus was developed to bridge the vulnerability gap between advanced enterprise security operations and daily campus student experiences. Rather than functioning as a black-box blocker, our platform emphasizes <strong>transparent detection, clear explanations, and student empowerment</strong>.
        </p>
      </Card>

      {/* ML Methodology */}
      <Card id="ml" className="p-8 space-y-6 bg-navy-900/60 border-white/10">
        <div className="flex items-center gap-3 text-cyber-cyan">
          <Cpu className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">Machine Learning Methodology</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Phishing URLs frequently display specific lexical and structural anomalies designed to deceive human readers while navigating web infrastructure. Our feature extraction pipeline computes 27 distinct numerical indicators:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-navy-950 border border-white/5 space-y-1.5">
            <div className="text-cyber-green font-semibold">Structural Features (1-14)</div>
            <p className="text-slate-400">• Total URL length, domain length, path length</p>
            <p className="text-slate-400">• Dot, hyphen, underscore, and slash frequencies</p>
            <p className="text-slate-400">• Query parameter counts and fragment presence</p>
            <p className="text-slate-400">• Raw IP address presence in domain authority</p>
            <p className="text-slate-400">• '@' symbol redirection markers</p>
            <p className="text-slate-400">• Double slash '//' path redirect indicators</p>
          </div>
          <div className="p-4 rounded-lg bg-navy-950 border border-white/5 space-y-1.5">
            <div className="text-cyber-cyan font-semibold">Reputational & Statistical (15-27)</div>
            <p className="text-slate-400">• HTTPS scheme validation & www prefix</p>
            <p className="text-slate-400">• Deep subdomain hierarchy counts</p>
            <p className="text-slate-400">• Known URL shortener domain mapping</p>
            <p className="text-slate-400">• High-abuse TLD cross-referencing</p>
            <p className="text-slate-400">• Non-standard port identifiers</p>
            <p className="text-slate-400">• Shannon entropy calculation (randomness factor)</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-navy-950/80 border border-white/5 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-white">Candidate Model Comparison</div>
          <p className="leading-relaxed">
            During model selection, Random Forest and XGBoost classifiers were trained using stratified 5-fold cross-validation. Random Forest achieved superior generalization on high-dimensional lexical features with lower inference latency, making it the primary production model serialized via Joblib.
          </p>
        </div>
      </Card>

      {/* Dataset Information */}
      <Card className="p-8 space-y-4 bg-navy-900/60 border-white/10">
        <div className="flex items-center gap-3 text-purple-400">
          <Database className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">Dataset Sources & Curation</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          The models are trained and evaluated against verifiable cybersecurity corpora:
        </p>
        <ul className="text-xs text-slate-300 space-y-2.5 list-disc pl-5 leading-relaxed">
          <li><strong>PhishTank Corpus</strong>: Verified active phishing links validated by security analysts.</li>
          <li><strong>Tranco Top 1M</strong>: Research-grade ranking of the most popular and legitimate web domains to prevent false positives.</li>
          <li><strong>UCI Phishing Websites Dataset</strong>: Peer-reviewed benchmarks for feature correlation and comparative analysis.</li>
        </ul>
        <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300 font-mono">
          Note: No fabricated data, synthetic accuracy metrics, or placeholder accuracy numbers are reported. Models run real inferences on extracted feature vectors.
        </div>
      </Card>

      {/* Responsible AI & Limitations */}
      <Card id="responsible-ai" className="p-8 space-y-4 bg-navy-900/60 border-white/10">
        <div className="flex items-center gap-3 text-amber-400">
          <Scale className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">Limitations & Responsible AI Principles</h2>
        </div>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
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

