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
        'Unable to access camera. Please ensure camera permissions are granted. Modern browsers require HTTPS or localhost to enable camera hardware.'
      );
    }
  };

  const stopCamera = async () => {
    if (qrReaderRef.current && cameraActive) {
      try {
        await qrReaderRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        qrReaderRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleQrSuccess = async (text: string) => {
    stopCamera();
    setDecodedText(text);

    // Validate if it is a URL
    if (text.startsWith('http://') || text.startsWith('https://') || text.includes('.')) {
      setScanningUrl(true);
      try {
        const result = await scanService.scanURL(text);
        setScanResult(result);
      } catch (err: any) {
        console.error('Failed to analyze decoded QR URL:', err);
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
    } catch (err: any) {
      setCameraError('No valid QR code detected in the uploaded image. Please try a clearer screenshot.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">QR Code Quishing Shield</h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan campus bulletin board posters, parking flyers, and stickers safely without auto-redirecting.
        </p>
      </div>

      {cameraError && <Alert type="warning" message={cameraError} />}

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-4">
        <button
          onClick={() => {
            stopCamera();
            setActiveTab('camera');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'camera'
              ? 'text-cyber-green border-cyber-green'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> Live Camera Scanner
        </button>
        <button
          onClick={() => {
            stopCamera();
            setActiveTab('upload');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'upload'
              ? 'text-cyber-green border-cyber-green'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload QR Image / Screenshot
        </button>
      </div>

      {/* Scanner Workspace */}
      <Card className="p-6 bg-navy-900/80 border-white/10 text-center">
        {activeTab === 'camera' ? (
          <div className="space-y-4">
            <div
              id={readerElementId}
              className="w-full max-w-sm mx-auto aspect-square rounded-xl bg-navy-950 border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center relative"
            >
              {!cameraActive && (
                <div className="p-6 text-center space-y-3">
                  <QrCode className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Click below to activate device camera.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {!cameraActive ? (
                <Button variant="primary" size="md" onClick={startCamera} icon={<Camera className="w-4 h-4" />}>
                  Start Camera
                </Button>
              ) : (
                <Button variant="secondary" size="md" onClick={stopCamera}>
                  Stop Camera
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto py-8">
            <div id="qr-upload-target" className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-white/10 flex items-center justify-center text-cyber-cyan mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select a QR Code Image</h3>
              <p className="text-xs text-slate-400 mt-1">Upload JPG, PNG, or screenshot from your device</p>
            </div>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white font-medium text-sm border border-white/10 transition-colors">
                Browse Files
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Decoded QR Details & Scan Results */}
      {decodedText && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-6 bg-navy-900 border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Decoded QR Code Destination
              </span>
              <span className="text-xs font-mono text-cyber-cyan">ISOLATED SANDBOX</span>
            </div>

            <div className="p-4 rounded-xl bg-navy-950 border border-white/10 font-mono text-sm text-white break-all">
              {decodedText}
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Safety First: Destination link was <strong>NOT</strong> opened in your browser to protect against drive-by exploits.
              </span>
            </div>

            {scanningUrl && (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyber-green" />
                <p className="text-xs font-mono text-slate-400">Running multi-tier threat classification...</p>
              </div>
            )}
          </Card>

          {/* Render Full Threat Assessment if URL was parsed */}
          {scanResult && (
            <Card className="p-6 space-y-5 bg-navy-900/90 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Quishing Risk Assessment</h3>
                  <p className="text-xs text-slate-400">Registered Domain: {scanResult.domain || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="risk" value={scanResult.risk_level} />
                  <span className="text-xs font-mono text-white font-bold">{Math.round(scanResult.risk_score)}/100</span>
                </div>
              </div>

              {scanResult.signals.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Detected Red Flags:</div>
                  {scanResult.signals.map((sig, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-navy-950 border border-white/5 text-xs text-slate-300 flex items-start justify-between">
                      <span>{sig.description}</span>
                      <Badge variant="severity" value={sig.severity} />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-lg bg-navy-950 border border-white/5 space-y-2">
                <div className="text-xs font-semibold text-white">Recommendations:</div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
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

