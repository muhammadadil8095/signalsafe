import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email,
        username,
        full_name: fullName,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email or username might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 border-white/10 bg-navy-900/90 shadow-2xl">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Create Campus Account</h2>
        <p className="text-xs text-slate-400">Join the SignalSafe institutional security ecosystem</p>
      </div>

      {error && <Alert type="error" message={error} className="mb-5" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<UserIcon className="w-4 h-4" />}
        />

        <Input
          label="University Email"
          type="email"
          placeholder="student@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Username"
          type="text"
          placeholder="janedoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<UserIcon className="w-4 h-4" />}
          required
        />

        <Input
          label="Password (min. 8 characters)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading} icon={<ArrowRight className="w-4 h-4" />}>
          Register Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-cyber-green hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </Card>
  );
};

