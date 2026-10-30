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
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grid/20 pb-3">
        <div>
          <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
            Record // Telemetry
          </div>
          <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">Scan History & Telemetry</h1>
          <p className="text-xs text-forest/70 font-sans mt-0.5">Audit log of all URL, QR, message, and file scans executed by your account.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-forest/60" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-sm bg-white border border-grid/20 px-3 py-1.5 text-xs font-mono text-forest focus:outline-none focus:border-forest shadow-none"
          >
            <option value="all">Filter: All Records</option>
            <option value="safe">Safe Only</option>
            <option value="malicious">Malicious Only</option>
            <option value="suspicious">Suspicious Only</option>
            <option value="url">URL Vectors</option>
            <option value="qr">QR Vectors</option>
            <option value="message">Message Payloads</option>
            <option value="attachment">Attachment Files</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-grid/20 bg-white rounded-sm shadow-none">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-forest/60 space-y-2">
            <History className="w-6 h-6 mx-auto text-forest/40" />
            <p>No telemetry records found matching query criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-forest/70 border-b border-grid/20 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Input / Destination</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid/10 text-forest">
                {filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 truncate max-w-sm">
                      {s.original_input}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] text-forest/60">
                      {s.scan_type}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="risk" value={s.risk_level} />
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {Math.round(s.risk_score)} / 100
                    </td>
                    <td className="py-3 px-4 text-forest/60">
                      {new Date(s.scanned_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedScan(s)}
                        className="text-forest hover:underline font-semibold uppercase text-[11px] inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
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
          title={`Telemetry Record: ${selectedScan.id}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="text-forest/60 uppercase text-[10px]">Submitted Input Vector</div>
              <div className="p-2.5 rounded-sm bg-paper font-mono text-forest break-all mt-1 border border-grid/20">
                {selectedScan.original_input}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-forest/60">Rating:</span>{' '}
                <Badge variant="risk" value={selectedScan.risk_level} />
              </div>
              <div>
                <span className="text-forest/60">Score:</span>{' '}
                <strong className="text-forest font-mono">{selectedScan.risk_score} / 100</strong>
              </div>
            </div>

            {selectedScan.signals && selectedScan.signals.length > 0 && (
              <div className="space-y-2">
                <div className="text-forest font-bold uppercase text-[10px]">Evidence Signals:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedScan.signals.map((sig, i) => (
                    <div key={i} className="p-2 rounded-sm bg-paper border border-grid/20 space-y-0.5">
                      <div className="font-bold text-forest text-[11px]">{sig.signal_type}</div>
                      <p className="text-forest/80 text-[11px]">{sig.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedScan.recommendations && (
              <div className="space-y-1">
                <div className="text-forest font-bold uppercase text-[10px]">Security Actions:</div>
                <ul className="list-disc pl-4 space-y-1 text-forest/80 text-[11px]">
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
