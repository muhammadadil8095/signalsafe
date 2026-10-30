import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { InstallPwaButton } from '@/components/InstallPwaButton';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Product & Features', href: '/product' },
    { label: 'Architecture & Research', href: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 cyber-grid">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-green/20 to-cyber-cyan/20 border border-cyber-cyan/30 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-cyber-green">
              <Shield className="w-5 h-5 text-cyber-green" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                SignalSafe <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/20">CAMPUS</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-cyber-green ${
                  location.pathname === link.href ? 'text-cyber-green' : 'text-slate-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            <InstallPwaButton />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Dashboard ({user?.username})
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Protected
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <InstallPwaButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-navy-900/95 backdrop-blur-xl px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-cyber-green"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-navy-950/90 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyber-green" />
              <span className="font-bold text-white tracking-tight">SignalSafe Campus</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your digital safety. One signal ahead. Institutional cybersecurity shield designed for modern university communities.
            </p>
          </div>
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Threat Engines</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/product#url" className="hover:text-cyber-green transition-colors">URL Threat Scanner</Link></li>
              <li><Link to="/product#qr" className="hover:text-cyber-green transition-colors">QR Quishing Detection</Link></li>
              <li><Link to="/product#message" className="hover:text-cyber-green transition-colors">Social Engineering Filter</Link></li>
              <li><Link to="/product#attachment" className="hover:text-cyber-green transition-colors">PDF/HTML Attachment Inspector</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Institutional</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-cyber-green transition-colors">System Architecture</Link></li>
              <li><Link to="/about#ml" className="hover:text-cyber-green transition-colors">ML Feature Extraction</Link></li>
              <li><Link to="/about#responsible-ai" className="hover:text-cyber-green transition-colors">Responsible AI Principles</Link></li>
              <li><a href="/docs" target="_blank" className="hover:text-cyber-green transition-colors flex items-center gap-1">FastAPI Docs <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Campus Security</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Need immediate help? Contact your campus incident response hotline or log in to file an authorized report.
            </p>
            <div className="text-xs font-mono text-cyber-cyan">
              v1.0.0 Production Core
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 SignalSafe Campus. Built for collegiate threat defense.</p>
          <p className="mt-2 sm:mt-0 font-mono">Status: All threat analyzers operational</p>
        </div>
      </footer>
    </div>
  );
};

