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
    <Card className="p-6 sm:p-8 border border-grid/20 bg-white rounded-sm shadow-none">
      <div className="space-y-1 mb-6 pb-3 border-b border-grid/20">
        <h2 className="text-xl font-heading font-bold text-forest tracking-tight">Register Student Account</h2>
        <p className="text-xs text-forest/70 font-sans">Initialize institutional safety telemetry profile</p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name (Optional)"
          type="text"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<UserIcon className="w-4 h-4 text-forest/50" />}
        />

        <Input
          label="Campus Username"
          type="text"
          placeholder="janedoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<UserIcon className="w-4 h-4 text-forest/50" />}
          required
        />

        <Input
          label="Institutional Email"
          type="email"
          placeholder="j.doe@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 text-forest/50" />}
          required
        />

        <Input
          label="Security Key / Password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-forest/50" />}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-forest/50" />}
          required
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading} icon={<ArrowRight className="w-3.5 h-3.5" />}>
          Create Profile
        </Button>
      </form>

      <div className="mt-5 text-center text-xs font-sans text-forest/70">
        Already registered?{' '}
        <Link to="/login" className="text-forest font-semibold underline underline-offset-2 hover:text-forest-light">
          Sign in
        </Link>
      </div>
    </Card>
  );
};
