import React, { useEffect, useState } from 'react';
import { History, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { adminService } from '@/services/admin.service';
import { AuditLogItem } from '@/types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs(1, 100);
      setLogs(data.items || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">Immutable administrative action records and compliance audit log.</p>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 bg-navy-900/60">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <p>No administrative audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / User ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {log.user_id}
                    </td>
                    <td className="py-3 px-4 text-cyber-cyan font-semibold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {log.resource_type} ({log.resource_id?.slice(0, 8) || 'N/A'})
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : 'N/A'}
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

