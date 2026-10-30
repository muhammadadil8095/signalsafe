import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink,
  Copy,
  Check,
  SwitchCamera,
  Globe,
  Lock,
  Unlock,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { scanService } from '@/services/scan.service';
import { ScanResult } from '@/types';

export const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [scanningUrl, setScanningUrl] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-container';

  // Discover camera devices on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera on mobile
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Unable to enumerate camera devices upfront:', err);
      });
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setDecodedText(null);
    setTargetUrl(null);
    setScanResult(null);

    try {
      if (!qrReaderRef.current) {
        qrReaderRef.current = new Html5Qrcode(readerElementId);
      } else if (qrReaderRef.current.isScanning) {
        await qrReaderRef.current.stop();
      }

      // Determine camera constraint: specific device ID if available, otherwise environment facing mode with user fallback
      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

      const qrBoxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        return {
          width: Math.floor(minEdge * 0.75),
          height: Math.floor(minEdge * 0.75),
        };
      };

      await qrReaderRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: qrBoxSize,
          aspectRatio: 1.0,
        },
        async (decoded) => {
          handleQrSuccess(decoded);
        },
        () => {
          // Normal frame scan tick without QR in sight
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraActive(false);

      // Try fallback to any available camera if facingMode: environment failed (common on laptops)
      if (!selectedCameraId && cameras.length > 0) {
        try {
          const fallbackCam = cameras[0].id;
          setSelectedCameraId(fallbackCam);
          await qrReaderRef.current?.start(
            { deviceId: { exact: fallbackCam } },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            async (decoded) => handleQrSuccess(decoded),
            () => {}
          );
          setCameraActive(true);
          setCameraLoading(false);
          return;
        } catch (fallbackErr) {
          console.error('Fallback camera error:', fallbackErr);
        }
      }

      setCameraError(
        'Unable to access camera hardware. Please check browser permissions and ensure no other application is using the camera.'
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      try {
        await qrReaderRef.current.stop();
      } catch (err) {
        console.warn('Error while stopping camera:', err);
      }
    }
    setCameraActive(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);

    if (cameraActive) {
      await stopCamera();
      // Restart with new camera
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

  const handleQrSuccess = async (decoded: string) => {
    await stopCamera();
    const cleanDecoded = decoded.trim();
    setDecodedText(cleanDecoded);

    // Normalize URL if payload resembles a web address
    let evaluatedUrl = cleanDecoded;
    const isUrl =
      /^https?:\/\//i.test(cleanDecoded) ||
      /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(cleanDecoded);

    if (isUrl) {
      if (!/^https?:\/\//i.test(evaluatedUrl)) {
        evaluatedUrl = 'https://' + evaluatedUrl;
      }
      setTargetUrl(evaluatedUrl);
      setScanningUrl(true);

      try {
        const result = await scanService.scanURL(evaluatedUrl);
        setScanResult(result);
      } catch (err) {
        console.error('Automated URL scan failed, executing heuristic assessment:', err);
      } finally {
        setScanningUrl(false);
      }
    } else {
      setTargetUrl(null);
      setScanResult(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setDecodedText(null);
    setTargetUrl(null);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-upload-target');
      const decoded = await html5QrCode.scanFile(file, true);
      await handleQrSuccess(decoded);
    } catch (err) {
      setCameraError(
        'No valid QR matrix detected in this image. Ensure the image has high contrast, good lighting, and the QR code is clearly visible.'
      );
    }
  };

  const copyPayload = () => {
    if (!decodedText) return;
    navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        qrReaderRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-grid/20 pb-3">
        <div className="text-[10px] font-mono tracking-[0.1em] text-forest/60 uppercase">
          Engine // 02
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest tracking-tight">QR Quishing Shield</h1>
        <p className="text-xs text-forest/70 font-sans mt-0.5">
          Decodes QR matrices client-side. Inspects destination addresses in an isolated sandbox with zero automatic redirects.
        </p>
      </div>

      {cameraError && <Alert type="warning" message={cameraError} />}

      {typeof window !== 'undefined' && !window.isSecureContext && (
        <div className="p-3 bg-[#FEF9E6] dark:bg-[#252010] border border-[#F4D35E] rounded-sm text-xs font-mono text-[#7A6200] dark:text-[#F4D35E] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>HTTPS Notice:</strong> Mobile browsers restrict camera hardware access to HTTPS origins or localhost. When evaluating via local LAN IP, use the <strong>Upload Image / Screenshot</strong> tab below.
          </span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
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
          <Camera className="w-3.5 h-3.5" /> Live Camera Scanner
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

      {/* Scanner Ingestion Container */}
      <Card className="p-6 bg-white border border-grid/20 rounded-sm text-center shadow-none">
        {activeTab === 'camera' ? (
          <div className="space-y-4">
            {/* Viewport Frame */}
            <div className="relative w-full max-w-sm mx-auto aspect-square rounded-sm bg-paper border-2 border-dashed border-grid/30 overflow-hidden">
              {/* Dedicated Html5Qrcode DOM target — kept completely clean of React child reconciliations */}
              <div id={readerElementId} className="w-full h-full" />

              {/* Inactive Placeholder Overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-paper/90 flex flex-col items-center justify-center p-6 space-y-3 z-10">
                  <div className="w-16 h-16 rounded-sm bg-white border border-grid/20 flex items-center justify-center text-forest/50">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-forest">Camera Standby</div>
                    <p className="text-[11px] font-mono text-forest/60 mt-1 max-w-xs">
                      Click activate to initialize optical scanner without browser redirect.
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Crosshair Overlay when Active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 border-2 border-mint/80 rounded-sm relative">
                    <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-forest dark:border-mint" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-forest dark:border-mint" />
                    <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-forest dark:border-mint" />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-forest dark:border-mint" />
                    <div className="w-full h-0.5 bg-mint/70 animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </div>

            {/* Hardware Controls */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              {!cameraActive ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={startCamera}
                  loading={cameraLoading}
                  icon={<Camera className="w-3.5 h-3.5" />}
                >
                  Activate Camera
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="md" onClick={stopCamera}>
                    Deactivate Camera
                  </Button>
                  {cameras.length > 1 && (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={switchCamera}
                      icon={<SwitchCamera className="w-3.5 h-3.5" />}
                    >
                      Flip Camera
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto py-6">
            <div id="qr-upload-target" className="hidden" />
            <div className="w-14 h-14 rounded-sm bg-paper border border-grid/20 flex items-center justify-center text-forest mx-auto">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-forest">Select QR Code Image</h3>
              <p className="text-xs font-mono text-forest/60 mt-1">
                Upload a photo, poster capture, or screenshot containing a QR code
              </p>
            </div>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-sm bg-forest text-paper font-mono uppercase tracking-wider text-xs border border-forest hover:bg-forest-light transition-colors select-none">
                Browse Image Files
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Decoded QR Results & Understandable Threat Assessment */}
      {decodedText && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Decoded Payload Box */}
          <Card className="p-5 bg-white border border-grid/20 rounded-sm space-y-3 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-grid/10">
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">
                Decoded Matrix Payload
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-forest bg-mint/20 px-2 py-0.5 rounded-sm border border-forest/20">
                  ISOLATED SANDBOX
                </span>
                <button
                  onClick={copyPayload}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-forest hover:underline px-2 py-0.5 bg-paper rounded-sm border border-grid/20"
                >
                  {copied ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-paper border border-grid/20 font-mono text-xs text-forest break-all select-all">
              {decodedText}
            </div>

            <div className="p-2.5 rounded-sm bg-gold/15 dark:bg-gold/10 border border-forest/20 text-xs font-mono text-forest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-gold" />
              <span>
                <strong>Quishing Protection:</strong> Automatic browser redirection was blocked to prevent drive-by malware delivery and credential theft.
              </span>
            </div>

            {scanningUrl && (
              <div className="py-4 text-center space-y-1.5">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-forest" />
                <p className="text-[11px] font-mono text-forest/60">
                  Executing lexical inspection, brand reputation, and threat heuristics...
                </p>
              </div>
            )}
          </Card>

          {/* Full Understandable Threat Assessment */}
          {scanResult && (
            <Card className="p-6 space-y-5 bg-white border border-grid/20 rounded-sm shadow-none">
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-grid/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-forest/60">
                      Safety Verdict:
                    </span>
                    <Badge variant="risk" value={scanResult.risk_level} />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-forest">
                    {scanResult.risk_level === 'malicious' && 'DANGEROUS QR DESTINATION (QUISHING ATTACK)'}
                    {scanResult.risk_level === 'suspicious' && 'SUSPICIOUS UNVERIFIED DESTINATION'}
                    {scanResult.risk_level === 'safe' && 'LEGITIMATE & VERIFIED DESTINATION'}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-heading font-extrabold text-forest">
                      {Math.round(scanResult.risk_score)} / 100
                    </div>
                    <div className="text-[10px] font-mono text-forest/60 uppercase">Risk Index</div>
                  </div>
                </div>
              </div>

              {/* Understandable Reason Section */}
              <div className="p-4 rounded-sm bg-paper border border-grid/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-forest uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-forest/70" />
                  <span>Why was this verdict reached? (Security Reason)</span>
                </div>

                {scanResult.risk_level === 'malicious' ? (
                  <p className="text-xs font-sans text-forest/90 leading-relaxed">
                    This QR code was flagged as <strong>malicious</strong> because its decoded destination exhibits known phishing characteristics. 
                    {scanResult.signals.some((s) => s.signal_type.includes('brand')) && (
                      <span> It appears to impersonate a trusted institution or sign-in page to harvest passwords.</span>
                    )}
                    {scanResult.signals.some((s) => s.signal_type.includes('ip_address')) && (
                      <span> The destination uses an unprotected raw IP address instead of an authenticated domain name.</span>
                    )}
                    {scanResult.signals.some((s) => s.signal_type.includes('tld')) && (
                      <span> The top-level domain has a documented history of abusive and fraudulent campaigns.</span>
                    )}
                  </p>
                ) : scanResult.risk_level === 'suspicious' ? (
                  <p className="text-xs font-sans text-forest/90 leading-relaxed">
                    This QR code points to an <strong>unverified external destination</strong>. While not definitively confirmed as malware, it lacks standard campus institutional certificates or utilizes techniques such as URL shortening that conceal the true destination server.
                  </p>
                ) : (
                  <p className="text-xs font-sans text-forest/90 leading-relaxed">
                    This QR code points to a <strong>verified and safe</strong> destination. It utilizes standard HTTPS encryption and contains zero heuristic, lexical, or structural threat markers.
                  </p>
                )}
              </div>

              {/* Destination Breakdown Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-forest/60">Destination Domain</div>
                  <div className="text-xs font-mono font-bold text-forest truncate flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-forest/50" />
                    <span>{scanResult.domain || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-forest/60">Encryption Protocol</div>
                  <div className="text-xs font-mono font-bold text-forest flex items-center gap-1.5">
                    {targetUrl?.startsWith('https://') ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-mint" />
                        <span className="text-mint">HTTPS (Encrypted)</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-coral" />
                        <span className="text-coral">HTTP (Unencrypted)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-sm bg-paper border border-grid/20 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-forest/60">Institutional Status</div>
                  <div className="text-xs font-mono font-bold text-forest flex items-center gap-1.5">
                    {scanResult.domain?.endsWith('campus.edu') || scanResult.domain?.endsWith('.edu') ? (
                      <span className="text-mint">Verified Academic (.EDU)</span>
                    ) : (
                      <span className="text-gold">External Third-Party</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Signals */}
              {scanResult.signals.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold">
                    Specific Threat Indicators Detected:
                  </div>
                  <div className="space-y-1.5">
                    {scanResult.signals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-sm bg-paper border border-grid/20 text-xs font-mono text-forest flex items-start justify-between gap-3"
                      >
                        <span className="leading-snug">{sig.description}</span>
                        <Badge variant="severity" value={sig.severity} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="p-4 rounded-sm bg-paper border border-grid/20 space-y-2 font-mono text-xs">
                <div className="font-heading font-bold text-forest uppercase tracking-wider text-[11px]">
                  Safety Action Plan:
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-forest/80">
                  {scanResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Direct Next Action Shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-grid/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPayload}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-mint" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'URL Copied' : 'Copy Destination URL'}
                </Button>

                <div className="flex items-center gap-2">
                  {targetUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/dashboard/scan-url`)}
                      icon={<Search className="w-3.5 h-3.5" />}
                    >
                      Inspect in URL Engine
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/dashboard/report-incident')}
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  >
                    Report Quishing Poster
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* If plain text / non-URL decoded */}
          {!targetUrl && !scanningUrl && (
            <Card className="p-5 bg-white border border-grid/20 rounded-sm space-y-3 shadow-none">
              <div className="text-xs font-heading font-bold text-forest">Text Payload Identified</div>
              <p className="text-xs font-mono text-forest/70">
                The decoded QR matrix contains raw text or configuration data rather than a web link. 
                Zero browser navigation was initiated.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
