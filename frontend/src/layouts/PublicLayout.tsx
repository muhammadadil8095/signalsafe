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
    { label: 'URL Scanner', href: '/scan' },
    { label: 'QR Scanner', href: '/scan-qr' },
    { label: 'Threat Engines', href: '/product' },
    { label: 'Architecture', href: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-forest paper-grid font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-grid/20 bg-paper/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-sm bg-white border border-grid/20 flex items-center justify-center transition-colors group-hover:border-forest">
              <Shield className="w-4 h-4 text-forest" />
            </div>
            <div>
              <span className="font-heading font-bold text-base tracking-tight text-forest flex items-center gap-1.5">
                SignalSafe <span className="text-[10px] font-mono font-semibold tracking-[0.1em] px-1.5 py-0.5 rounded-sm bg-mint text-forest border border-forest/20">CAMPUS</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-xs font-mono tracking-wider uppercase transition-colors hover:text-forest ${
                  location.pathname === link.href ? 'text-forest font-bold underline underline-offset-4 decoration-forest' : 'text-forest/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            <InstallPwaButton />
            <Link to="/scan">
              <Button variant="outline" size="sm" icon={<Shield className="w-3.5 h-3.5" />}>
                Live Scanner
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Hub ({user?.username})
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
                    Access Shield
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
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="p-1.5 rounded-sm text-forest border border-grid/20 bg-white hover:bg-paper-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-grid/20 bg-paper px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs font-mono uppercase tracking-wider text-forest hover:font-bold"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-grid/20 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Go to Hub
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
      <footer className="border-t border-grid/20 bg-white py-12 text-forest/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-forest" />
              <span className="font-heading font-bold text-sm text-forest tracking-tight">SignalSafe Campus</span>
            </div>
            <p className="text-xs text-forest/70 leading-relaxed font-sans">
              Technical cybersecurity telemetry designed for university networks and student communications.
            </p>
          </div>
          <div>
            <div className="text-forest text-[11px] font-mono font-bold uppercase tracking-wider mb-3">Threat Engines</div>
            <ul className="space-y-2 font-mono text-xs text-forest/80">
              <li><Link to="/product#url" className="hover:text-forest hover:underline">URL Scanner</Link></li>
              <li><Link to="/product#qr" className="hover:text-forest hover:underline">QR Quishing Defense</Link></li>
              <li><Link to="/product#message" className="hover:text-forest hover:underline">Message Analyzer</Link></li>
              <li><Link to="/product#attachment" className="hover:text-forest hover:underline">Attachment Inspector</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-forest text-[11px] font-mono font-bold uppercase tracking-wider mb-3">Specifications</div>
            <ul className="space-y-2 font-mono text-xs text-forest/80">
              <li><Link to="/about" className="hover:text-forest hover:underline">System Architecture</Link></li>
              <li><Link to="/about#ml" className="hover:text-forest hover:underline">27-Feature ML Model</Link></li>
              <li><Link to="/about#responsible-ai" className="hover:text-forest hover:underline">Responsible AI Spec</Link></li>
              <li><a href="/docs" target="_blank" className="hover:text-forest hover:underline flex items-center gap-1">REST API Docs <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>
          <div>
            <div className="text-forest text-[11px] font-mono font-bold uppercase tracking-wider mb-3">Operations</div>
            <p className="text-xs text-forest/70 leading-relaxed mb-3 font-sans">
              Institutional security protocol v1.0. Zero-depth, deterministic threat scoring.
            </p>
            <div className="text-[11px] font-mono font-semibold px-2 py-1 bg-paper-muted border border-grid/20 rounded-sm text-forest inline-block">
              ENGINE // ACTIVE
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-grid/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-forest/60">
          <p>© 2026 SignalSafe Campus. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Hairline Grid 1px · Paper #F7F7F5 · Forest #1A3C2B</p>
        </div>
      </footer>
    </div>
  );
};
