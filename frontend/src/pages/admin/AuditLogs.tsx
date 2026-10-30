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
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Ledger // Compliance
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Security Audit Trail</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">Immutable administrative action records and compliance audit log.</p>
      </div>

      <Card className="p-0 overflow-hidden border border-grid/20 bg-white rounded-sm shadow-none">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-forest/60 space-y-2">
            <History className="w-6 h-6 mx-auto text-forest/40" />
            <p>No administrative audit logs recorded in active ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-forest/70 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / User ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 text-forest/60 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-forest max-w-xs truncate">
                      {log.user_id}
                    </td>
                    <td className="py-3 px-4 text-forest font-bold uppercase">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-forest/80">
                      {log.resource_type} ({log.resource_id?.slice(0, 8) || 'N/A'})
                    </td>
                    <td className="py-3 px-4 text-forest/60 max-w-xs truncate">
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
