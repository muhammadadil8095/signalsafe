import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { scanService } from '@/services/scan.service';
import { ScanResult } from '@/types';

export const QRScanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [scanningUrl, setScanningUrl] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-container';

  const startCamera = async () => {
    setCameraError(null);
    setDecodedText(null);
    setScanResult(null);

    try {
      if (!qrReaderRef.current) {
        qrReaderRef.current = new Html5Qrcode(readerElementId);
      }

      await qrReaderRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decoded) => {
          handleQrSuccess(decoded);
        },
        () => {
          // Frame scan error is normal when no QR code is in frame
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraActive(false);
      setCameraError(
        'Unable to access camera hardware. Verify browser permissions. Mobile browsers require HTTPS context.'
      );
    }
  };

  const stopCamera = async () => {
    if (qrReaderRef.current && cameraActive) {
      try {
        await qrReaderRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  };

  const handleQrSuccess = async (decoded: string) => {
    stopCamera();
    setDecodedText(decoded);

    // If decoded text is a URL, pipe to URL scanning pipeline
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      setScanningUrl(true);
      try {
        const result = await scanService.scanURL(decoded);
        setScanResult(result);
      } catch (err) {
        console.error('Automated URL scan failed:', err);
      } finally {
        setScanningUrl(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setDecodedText(null);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-upload-target');
      const decoded = await html5QrCode.scanFile(file, true);
      handleQrSuccess(decoded);
    } catch (err) {
      setCameraError('No valid QR matrix detected in this image. Ensure high contrast and good lighting.');
    }
  };

  useEffect(() => {
    return () => {
      if (qrReaderRef.current && cameraActive) {
        qrReaderRef.current.stop().catch(() => {});
      }
    };
  }, [cameraActive]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Engine // 02
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">QR Quishing Shield</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Decodes QR matrices client-side. Inspects targets inside an isolated sandbox without automatic redirects.
        </p>
      </div>

      {cameraError && <Alert type="warning" message={cameraError} />}

      {/* Tabs */}
      <div className="flex border-b border-grid/20 gap-4">
        <button
          onClick={() => {
            stopCamera();
            setActiveTab('camera');
          }}
          className={`pb-2 text-xs font-mono tracking-wider uppercase flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'camera'
              ? 'text-forest border-forest font-bold'
              : 'text-forest/60 border-transparent hover:text-forest'
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Camera Ingestion
        </button>
        <button
          onClick={() => {
            stopCamera();
            setActiveTab('upload');
          }}
          className={`pb-2 text-xs font-mono tracking-wider uppercase flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'upload'
              ? 'text-forest border-forest font-bold'
              : 'text-forest/60 border-transparent hover:text-forest'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Image / Screenshot
        </button>
      </div>

      {/* Scanner Workspace */}
      <Card className="p-6 bg-white border border-grid/20 rounded-sm text-center shadow-none">
        {activeTab === 'camera' ? (
          <div className="space-y-4">
            <div
              id={readerElementId}
              className="w-full max-w-sm mx-auto aspect-square rounded-sm bg-paper border border-dashed border-grid/30 overflow-hidden flex items-center justify-center relative"
            >
              {!cameraActive && (
                <div className="p-6 text-center space-y-2">
                  <QrCode className="w-10 h-10 text-forest/40 mx-auto" />
                  <p className="text-xs font-mono text-forest/60">Initialize camera hardware.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {!cameraActive ? (
                <Button variant="primary" size="md" onClick={startCamera} icon={<Camera className="w-3.5 h-3.5" />}>
                  Activate Camera
                </Button>
              ) : (
                <Button variant="secondary" size="md" onClick={stopCamera}>
                  Deactivate Camera
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto py-6">
            <div id="qr-upload-target" className="hidden" />
            <div className="w-12 h-12 rounded-sm bg-paper border border-grid/20 flex items-center justify-center text-forest mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-forest">Select Image File</h3>
              <p className="text-xs font-mono text-forest/60 mt-1">Accepts PNG, JPG, or screenshot format</p>
            </div>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-forest text-paper font-mono uppercase tracking-wider text-xs border border-forest hover:bg-forest-light transition-colors">
                Browse System Files
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Decoded QR Details & Scan Results */}
      {decodedText && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Card className="p-5 bg-white border border-grid/20 rounded-sm space-y-3 shadow-none">
            <div className="flex items-center justify-between pb-2 border-b border-grid/10">
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">
                Decoded Matrix Payload
              </span>
              <span className="text-[10px] font-mono font-bold text-forest bg-mint px-1.5 py-0.5 rounded-sm border border-forest/20">
                ISOLATED SANDBOX
              </span>
            </div>

            <div className="p-3 rounded-sm bg-paper border border-grid/20 font-mono text-xs text-forest break-all">
              {decodedText}
            </div>

            <div className="p-2.5 rounded-sm bg-gold/20 border border-forest/20 text-xs font-mono text-forest flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Browser auto-redirect was intercepted to prevent drive-by malicious script execution.
              </span>
            </div>

            {scanningUrl && (
              <div className="py-4 text-center space-y-1">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-forest" />
                <p className="text-[11px] font-mono text-forest/60">Executing multi-signal analysis...</p>
              </div>
            )}
          </Card>

          {/* Render Full Threat Assessment if URL was parsed */}
          {scanResult && (
            <Card className="p-5 space-y-4 bg-white border border-grid/20 rounded-sm shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-bold text-forest">Quishing Threat Assessment</h3>
                  <p className="text-[11px] font-mono text-forest/60">Domain: {scanResult.domain || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="risk" value={scanResult.risk_level} />
                  <span className="text-xs font-mono text-forest font-bold">{Math.round(scanResult.risk_score)} / 100</span>
                </div>
              </div>

              {scanResult.signals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-forest/60">Detected Threat Indicators:</div>
                  {scanResult.signals.map((sig, idx) => (
                    <div key={idx} className="p-2.5 rounded-sm bg-paper border border-grid/20 text-xs font-mono text-forest flex items-start justify-between">
                      <span>{sig.description}</span>
                      <Badge variant="severity" value={sig.severity} />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1 font-mono text-xs text-forest/80">
                <div className="font-bold text-forest">Recommendations:</div>
                <ul className="space-y-1 list-disc pl-4 text-[11px]">
                  {scanResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
