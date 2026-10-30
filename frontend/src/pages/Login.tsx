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
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (role: 'student' | 'admin' | 'faculty') => {
    let creds = { email: 'student@campus.edu', password: 'student123' };
    if (role === 'admin') creds = { email: 'admin@signalsafe.edu', password: 'admin123' };
    if (role === 'faculty') creds = { email: 'faculty@campus.edu', password: 'faculty123' };

    setLoading(true);
    setError(null);
    try {
      await login(creds);
      navigate(role === 'admin' ? '/admin' : '/dashboard/scan-url');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Quick demo login failed. Please type credentials manually.');
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
    <Card className="p-6 sm:p-8 border border-grid/20 bg-white rounded-sm shadow-none">
      <div className="space-y-1 mb-6 pb-3 border-b border-grid/20">
        <h2 className="text-xl font-heading font-bold text-forest tracking-tight">Identity Authentication</h2>
        <p className="text-xs text-forest/70 font-sans">Submit authorized institutional credentials</p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institutional Email"
          type="email"
          placeholder="student@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 text-forest/50" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-forest/50" />}
          required
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading} icon={<ArrowRight className="w-3.5 h-3.5" />}>
          Authenticate
        </Button>
      </form>

      {/* Quick 1-Click Demo Logins for Judges / Evaluators */}
      <div className="mt-6 pt-4 border-t border-[#1A231E]/40 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest font-bold text-center">
          1-Click Evaluator Access (Immediate Login)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => quickLoginAs('student')}
            loading={loading}
          >
            Student
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => quickLoginAs('faculty')}
            loading={loading}
          >
            Faculty
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => quickLoginAs('admin')}
            loading={loading}
          >
            Admin SOC
          </Button>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/scan"
            className="text-xs font-mono font-bold uppercase tracking-wider text-forest hover:underline inline-flex items-center gap-1.5"
          >
            Or Skip Login & Go Directly to Live Scanner <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-5 text-center text-xs font-sans text-forest/70">
        Unregistered member?{' '}
        <Link to="/register" className="text-forest font-semibold underline underline-offset-2 hover:text-forest-light">
          Create student record
        </Link>
      </div>
    </Card>
  );
};
