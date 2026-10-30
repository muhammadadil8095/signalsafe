import React, { useEffect, useState } from 'react';
import { History, Filter, Search, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { scanService } from '@/services/scan.service';
import { ScanResult } from '@/types';

export const ScanHistory: React.FC = () => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  const fetchScans = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await scanService.getHistory(pageNum, 20);
      setScans(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans(1);
  }, []);

  const filteredScans = scans.filter((s) => {
    if (filterType === 'all') return true;
    return s.risk_level === filterType || s.scan_type === filterType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scan History & Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all URL, QR, message, and file scans executed by your account.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg bg-navy-900 border border-white/10 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyber-cyan"
          >
            <option value="all">All Scans</option>
            <option value="safe">Safe Only</option>
            <option value="malicious">Malicious Only</option>
            <option value="suspicious">Suspicious Only</option>
            <option value="url">URL Scans</option>
            <option value="qr">QR Scans</option>
            <option value="message">Message Scans</option>
            <option value="attachment">Attachment Scans</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 bg-navy-900/60">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <p>No scans found matching your selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-white/10 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Input / Destination</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Risk Rating</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-white truncate max-w-sm">
                      {s.original_input}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-mono text-slate-400">
                      {s.scan_type}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="risk" value={s.risk_level} />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {Math.round(s.risk_score)}/100
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.scanned_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedScan(s)}
                        className="text-cyber-cyan hover:underline font-medium text-xs inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedScan && (
        <Modal
          isOpen={!!selectedScan}
          onClose={() => setSelectedScan(null)}
          title={`Scan Telemetry: ${selectedScan.id}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-mono text-[10px]">Submitted Input</div>
              <div className="p-2.5 rounded bg-navy-950 font-mono text-white break-all mt-1 border border-white/5">
                {selectedScan.original_input}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400">Assessed Risk:</span>{' '}
                <Badge variant="risk" value={selectedScan.risk_level} />
              </div>
              <div>
                <span className="text-slate-400">Threat Score:</span>{' '}
                <strong className="text-white font-mono">{selectedScan.risk_score}/100</strong>
              </div>
            </div>

            {selectedScan.signals && selectedScan.signals.length > 0 && (
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold">Evidence Signals:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedScan.signals.map((sig, i) => (
                    <div key={i} className="p-2 rounded bg-navy-950 border border-white/5 space-y-0.5">
                      <div className="font-mono text-cyber-cyan text-[11px]">{sig.signal_type}</div>
                      <p className="text-slate-300">{sig.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedScan.recommendations && (
              <div className="space-y-1">
                <div className="text-slate-300 font-semibold">Security Advice:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {selectedScan.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

