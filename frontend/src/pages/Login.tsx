import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: 'student' | 'admin' | 'faculty') => {
    if (role === 'admin') {
      setEmail('admin@signalsafe.edu');
      setPassword('admin123');
    } else if (role === 'faculty') {
      setEmail('faculty@campus.edu');
      setPassword('faculty123');
    } else {
      setEmail('student@campus.edu');
      setPassword('student123');
    }
  };

  return (
    <Card className="p-8 border-white/10 bg-navy-900/90 shadow-2xl">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Campus Radar</h2>
        <p className="text-xs text-slate-400">Enter your university credentials to access threat tools</p>
      </div>

      {error && <Alert type="error" message={error} className="mb-5" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="student@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading} icon={<ArrowRight className="w-4 h-4" />}>
          Sign In
        </Button>
      </form>

      {/* Quick Demo Logins for Judges / Evaluators */}
      <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
        <div className="text-[11px] font-mono uppercase text-slate-400 text-center">
          Judge / Demo One-Click Sign In
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('student')}
            className="px-2 py-1.5 rounded-lg bg-navy-950 border border-white/10 text-[11px] font-medium text-cyber-green hover:bg-white/5 transition-colors"
          >
            Student Demo
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('faculty')}
            className="px-2 py-1.5 rounded-lg bg-navy-950 border border-white/10 text-[11px] font-medium text-cyber-cyan hover:bg-white/5 transition-colors"
          >
            Faculty Demo
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="px-2 py-1.5 rounded-lg bg-navy-950 border border-white/10 text-[11px] font-medium text-purple-400 hover:bg-white/5 transition-colors"
          >
            Admin Demo
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-cyber-green hover:underline font-medium">
          Create an account
        </Link>
      </div>
    </Card>
  );
};

