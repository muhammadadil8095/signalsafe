import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-paper paper-grid relative font-sans">
      {/* Brand Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
          <div className="w-10 h-10 rounded-sm bg-white border border-grid/20 flex items-center justify-center transition-colors group-hover:border-forest">
            <Shield className="w-5 h-5 text-forest" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight text-forest">SignalSafe</span>
        </Link>
        <p className="text-xs font-mono uppercase tracking-[0.1em] text-forest/60">Institutional Threat Architecture</p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      {/* Bottom return link */}
      <div className="mt-8 text-center relative z-10">
        <Link to="/" className="text-xs font-mono tracking-wider uppercase text-forest/70 hover:text-forest hover:underline">
          ← Return to Radar Overview
        </Link>
      </div>
    </div>
  );
};
