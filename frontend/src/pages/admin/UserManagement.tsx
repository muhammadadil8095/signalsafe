import React, { useEffect, useState } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { adminService } from '@/services/admin.service';
import { User } from '@/types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(1, 50, search);
      setUsers(data.items || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      setNotification(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Role update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      setNotification(`User account ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grid/20 pb-3">
        <div>
          <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
            Directory // Governance
          </div>
          <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Institutional User Directory</h1>
          <p className="text-xs text-forest/70 font-sans mt-0.5">Manage user credentials, assign role-based permissions, and toggle access states.</p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-forest/50" />}
          />
        </div>
      </div>

      {notification && <Alert type="success" message={notification} />}

      <Card className="p-0 overflow-hidden border border-grid/20 bg-white rounded-sm shadow-none">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-forest/60">
            No institutional users match the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-forest/70 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Identity</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-forest font-sans">{u.full_name || u.username}</div>
                      <div className="text-[10px] text-forest/60">@{u.username}</div>
                    </td>
                    <td className="py-3 px-4 text-forest/80">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-sm bg-white border border-grid/20 px-2 py-1 text-[11px] font-mono text-forest focus:outline-none focus:border-forest shadow-none"
                      >
                        <option value="student">STUDENT</option>
                        <option value="faculty">FACULTY</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold uppercase border ${
                        u.is_active ? 'text-forest bg-mint border-forest/20' : 'text-forest-dark bg-coral border-coral'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-forest/60">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={u.is_active ? 'danger' : 'secondary'}
                        size="sm"
                        disabled={updatingId === u.id}
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
