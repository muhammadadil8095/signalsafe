import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-navy-950 cyber-grid relative">
      <div className="absolute inset-0 bg-gradient-radial from-cyber-cyan/5 via-transparent to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-green/20 to-cyber-cyan/20 border border-cyber-cyan/30 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-cyber-green shadow-xl shadow-cyber-green/5">
            <Shield className="w-6 h-6 text-cyber-green" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">SignalSafe</span>
        </Link>
        <p className="text-xs text-slate-400">Institutional Cybersecurity Ecosystem</p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      {/* Bottom return link */}
      <div className="mt-8 text-center relative z-10">
        <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to SignalSafe Campus Home
        </Link>
      </div>
    </div>
  );
};

