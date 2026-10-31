import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_BASE_URL, GuardianResponse, GuardianState, ScanResponse } from "../types";
import { domainFromUrl } from "../utils/url";
import { originFromBaseUrl } from "../storage/storage";

function send(message: object): Promise<GuardianResponse> {
  return chrome.runtime.sendMessage(message);
}

function Mark() {
  return (
    <div className="mark-box">
      <svg className="mark-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}

function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function scoreWidth(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return `${clamped}%`;
}

function signalText(signal: unknown): string {
  if (typeof signal === "string") return signal;
  if (signal && typeof signal === "object") {
    const item = signal as { description?: string; signal_type?: string; severity?: string; name?: string };
    const parts = [
      item.severity ? `[${item.severity.toUpperCase()}]` : null,
      item.signal_type || item.name,
      item.description,
    ].filter(Boolean);
    return parts.join(" · ") || JSON.stringify(signal);
  }
  return String(signal);
}

function phaseChip(phase: GuardianState["phase"]): { label: string; cls: string } {
  switch (phase) {
    case "malicious":
      return { label: "MALICIOUS", cls: "danger" };
    case "suspicious":
      return { label: "SUSPICIOUS", cls: "warn" };
    case "safe":
      return { label: "SAFE", cls: "ok" };
    case "scanning":
      return { label: "SCANNING", cls: "scanning-chip" };
    case "auth_expired":
      return { label: "EXPIRED", cls: "danger" };
    case "backend_unavailable":
      return { label: "OFFLINE", cls: "warn" };
    case "unauthenticated":
      return { label: "SIGN IN", cls: "" };
    case "inconclusive":
      return { label: "INCONCLUSIVE", cls: "warn" };
    case "idle":
    default:
      return { label: "PROTECTED", cls: "ok" };
  }
}

export function Popup() {
  const [state, setState] = useState<GuardianState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  const apply = useCallback((response: GuardianResponse) => {
    setState(response.state);
    if (response.state.baseUrl) setBaseUrl(response.state.baseUrl);
  }, []);

  useEffect(() => {
    void send({ type: "GET_STATE" }).then(apply);
  }, [apply]);

  const requestHostPermission = async (targetUrl: string): Promise<boolean> => {
    try {
      const origin = `${originFromBaseUrl(targetUrl)}/*`;
      const allowed = await chrome.permissions.contains({ origins: [origin] });
      if (allowed) return true;
      return await chrome.permissions.request({ origins: [origin] });
    } catch {
      return false;
    }
  };

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const granted = await requestHostPermission(baseUrl);
      if (!granted) {
        setState((current) =>
          current
            ? {
              ...current,
              error: `Host permission was not granted for ${originFromBaseUrl(baseUrl)}.`,
              phase: "error",
            }
            : current
        );
        return;
      }
      apply(await send({ type: "LOGIN", email, password, baseUrl }));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const onSaveBaseUrl = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const granted = await requestHostPermission(baseUrl);
      if (!granted) {
        setState((current) =>
          current
            ? {
              ...current,
              error: `Host permission was not granted for ${originFromBaseUrl(baseUrl)}.`,
            }
            : current
        );
        return;
      }
      apply(await send({ type: "SET_BASE_URL", baseUrl }));
      setShowConfig(false);
    } finally {
      setBusy(false);
    }
  };

  const onToggleProtection = async (enabled: boolean) => {
    apply(await send({ type: "SET_AUTO_PROTECTION", enabled }));
  };

  const onManualScan = async () => {
    setBusy(true);
    setState((current) => (current ? { ...current, phase: "scanning", error: null } : current));
    try {
      apply(await send({ type: "SCAN_CURRENT_TAB" }));
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    apply(await send({ type: "LOGOUT" }));
  };

  const onReport = async () => {
    if (!state?.scan) return;
    setBusy(true);
    try {
      apply(await send({ type: "REPORT_URL", scanId: String(state.scan.id) }));
    } finally {
      setBusy(false);
    }
  };

  const onClearScan = async () => {
    apply(await send({ type: "CLEAR_SCAN" }));
  };

  const chip = useMemo(() => phaseChip(state?.phase ?? "unauthenticated"), [state?.phase]);
  const scan: ScanResponse | null = state?.scan ?? null;
  const showLogin = !state?.authenticated || state.phase === "auth_expired" || state.phase === "unauthenticated";

  // Heuristic signals list
  const heuristicSignals = useMemo(() => {
    if (!scan) return [];
    if (scan.threat_signals && scan.threat_signals.length > 0) return scan.threat_signals;
    if (scan.signals && scan.signals.length > 0) return scan.signals;
    return [];
  }, [scan]);

  const currentDomain = state?.tab?.url ? domainFromUrl(state.tab.url) : "—";

  return (
    <div className="app">
      {/* Header */}
      <header className="identity">
        <div className="identity-brand">
          <Mark />
          <div>
            <h1 className="brand-title">
              SignalSafe <span className="brand-badge">GUARDIAN</span>
            </h1>
            <p className="brand-sub">Campus Threat Perimeter</p>
          </div>
        </div>
        <span className={`chip ${chip.cls}`}>{chip.label}</span>
      </header>

      <main className="main">
        {showLogin ? (
          <form className="stack" onSubmit={onLogin}>
            <p className="status-line">Sign in with your campus account for automated security protection.</p>
            {state?.phase === "auth_expired" && (
              <div className="banner danger">Your session has expired. Sign in again to continue.</div>
            )}
            {state?.error && state.phase !== "auth_expired" && (
              <div className="banner danger">{state.error}</div>
            )}
            <label className="field">
              <span>Backend API Server</span>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://signalsafe.onrender.com"
                autoComplete="url"
                required
              />
            </label>
            <label className="field">
              <span>Campus Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="student@campus.edu"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Authenticating…" : "Sign In to Guardian"}
            </button>
          </form>
        ) : (
          <>
            {/* Automatic Protection Toggle Switch */}
            <div className="protection-card">
              <div className="protection-info">
                <span className="protection-title">Automatic Protection</span>
                <span className="protection-status-label">
                  {state?.autoProtection ? "Active · Auto-scans every page" : "Disabled · Manual scans only"}
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={state?.autoProtection ?? true}
                  onChange={(e) => void onToggleProtection(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Current Website Destination Card */}
            <div className="sample">
              <div className="sample-header">
                <span className="label">CURRENT DESTINATION</span>
                {scan && (
                  <button className="linkish small" type="button" onClick={() => void onClearScan()}>
                    Clear Verdict
                  </button>
                )}
              </div>
              <p className="url" title={state?.tab?.url || ""}>
                <strong>{currentDomain}</strong>
              </p>
              <p className="hint" style={{ wordBreak: "break-all" }}>
                {state?.tab?.url || "No active webpage tab"}
              </p>
              {state?.tab && !state.tab.scannable && (
                <p className="hint warn-text">{state.tab.reason}</p>
              )}
            </div>

            {/* Verdict Display Banner */}
            {state?.phase === "safe" && (
              <div className="verdict-card safe">
                <div className="verdict-header">
                  <span className="verdict-title">VERIFIED SAFE DESTINATION</span>
                  <span className="chip ok">SCORE {scan?.risk_score ?? 0} / 100</span>
                </div>
                <p className="verdict-desc">
                  Zero threat markers identified. Standard campus TLS encryption verified.
                </p>
              </div>
            )}

            {state?.phase === "suspicious" && (
              <div className="verdict-card suspicious">
                <div className="verdict-header">
                  <span className="verdict-title">CAUTION: SUSPICIOUS DESTINATION</span>
                  <span className="chip warn">SCORE {scan?.risk_score ?? 0} / 100</span>
                </div>
                <p className="verdict-desc">
                  Heuristic analysis flagged unusual domain or structural characteristics. Avoid entering campus credentials.
                </p>
              </div>
            )}

            {state?.phase === "malicious" && (
              <div className="verdict-card malicious">
                <div className="verdict-header">
                  <span className="verdict-title">DANGER: MALICIOUS THREAT DETECTED</span>
                  <span className="chip danger">SCORE {scan?.risk_score ?? 0} / 100</span>
                </div>
                <p className="verdict-desc">
                  Active phishing, credential harvesting, or brand impersonation detected. Navigation blocked.
                </p>
              </div>
            )}

            {state?.phase === "inconclusive" && (
              <div className="banner warn">
                <p>SignalSafe could not confidently determine whether this website is safe.</p>
              </div>
            )}

            {state?.phase === "backend_unavailable" && (
              <div className="banner warn">
                <p>Website security could not be verified because SignalSafe is currently unavailable.</p>
                <button
                  type="button"
                  className="linkish"
                  style={{ marginTop: 4, textDecoration: "underline" }}
                  onClick={() => setShowConfig(!showConfig)}
                >
                  {showConfig ? "Hide server settings" : "Change backend URL"}
                </button>
              </div>
            )}

            {/* Config Box when opened */}
            {showConfig && (
              <form className="stack config-box" onSubmit={onSaveBaseUrl}>
                <label className="field">
                  <span>Backend Base URL</span>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://signalsafe.onrender.com"
                    required
                  />
                </label>
                <div className="row">
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    Save Server URL
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => setShowConfig(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {state?.error && state.phase !== "backend_unavailable" && (
              <div className="banner danger">{state.error}</div>
            )}
            {state?.reportStatus && <div className="banner ok">{state.reportStatus}</div>}

            {/* Manual Scan Action */}
            <div className="actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void onManualScan()}
                disabled={busy || !state?.tab?.scannable}
              >
                {busy && state?.phase === "scanning" ? "Analyzing with SignalSafe…" : "Scan Current Website"}
              </button>
            </div>

            {/* Risk Gauge Bar */}
            {(state?.phase === "scanning" || scan) && (
              <section>
                <div className="gel" data-level={state?.phase === "scanning" ? "scanning" : (scan?.risk_level || "").toLowerCase()}>
                  <div
                    className="gel-fill"
                    style={{ width: state?.phase === "scanning" ? undefined : scoreWidth(scan?.risk_score ?? 0) }}
                  />
                </div>
                <div className="gel-caption">
                  <span>{scan ? `Risk: ${scan.risk_level.toUpperCase()}` : "Contacting SignalSafe..."}</span>
                  <span>{scan ? `Risk Score: ${scan.risk_score} / 100` : "—"}</span>
                </div>
              </section>
            )}

            {/* Student-Friendly Inspection Lanes */}
            {scan && state?.phase !== "scanning" && (
              <div className="scan-details-pane">
                <div className="lanes">
                  <article className="lane">
                    <h2>AI Classifier</h2>
                    <p className="lane-status">{scan.ml_available ? (scan.ml_prediction || "Active").toUpperCase() : "Off"}</p>
                    {scan.ml_available && scan.ml_confidence != null ? (
                      <p className="num">{(scan.ml_confidence * 100).toFixed(0)}% Conf</p>
                    ) : (
                      <p className="num">Autonomous</p>
                    )}
                  </article>
                  <article className="lane">
                    <h2>Threat Intel</h2>
                      <p className="lane-status" style={scan.urlhaus_detected ? { color: "var(--coral-text)", fontWeight: 700 } : undefined}>
                        {scan.urlhaus_detected ? "URLhaus HIT" : scan.vt_available ? "VT Active" : "Standard"}
                      </p>
                    {scan.urlhaus_detected ? (
                      <p className="num" style={{ color: "var(--coral-text)", fontWeight: 700 }}>abuse.ch Malware</p>
                    ) : scan.vt_available ? (
                      <p className="num" title="Malicious / Suspicious / Undetected">
                        <span style={{ color: "var(--coral-text)", fontWeight: 700 }}>{scan.vt_malicious ?? 0}M</span> /{" "}
                        <span style={{ color: "var(--gold-text)", fontWeight: 700 }}>{scan.vt_suspicious ?? 0}S</span>
                      </p>
                    ) : (
                      <p className="num">Heuristic</p>
                    )}
                  </article>
                  <article className="lane">
                    <h2>Indicators</h2>
                    <p className="lane-status">
                      {heuristicSignals.length > 0 ? `${heuristicSignals.length} Flagged` : "Zero Flags"}
                    </p>
                    <p className="num">Score {scan.risk_score}/100</p>
                  </article>
                </div>

                <div className="metadata-bar">
                  <span>Host: <strong>{scan.domain || currentDomain}</strong></span>
                  <span>Scanned: {formatTime(scan.scanned_at)}</span>
                </div>

                {/* Threat Warnings Action Row */}
                {(state.phase === "malicious" || state.phase === "suspicious") && (
                  <div className="row" style={{ marginTop: 2 }}>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => void send({
                        type: "OPEN_WARNING",
                        scanId: String(scan.id),
                        riskLevel: scan.risk_level,
                        url: state.tab?.url || scan.normalized_url || scan.original_input,
                      })}
                    >
                      Open Full Warning
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => void onReport()}
                      disabled={busy}
                    >
                      {busy ? "Reporting…" : "Report Threat"}
                    </button>
                  </div>
                )}

                {/* Accordion: View Technical Details */}
                <button
                  type="button"
                  className="linkish small"
                  style={{ textAlign: "center", padding: "4px 0", color: "var(--muted)" }}
                  onClick={() => setShowTechDetails(!showTechDetails)}
                >
                  {showTechDetails ? "Hide Technical Details ▲" : "View Technical Details ▼"}
                </button>

                {showTechDetails && (
                  <div className="results-group" style={{ marginTop: 4 }}>
                    <p className="group-title">Analysis Reasons & Signals</p>
                    {scan.explanation && scan.explanation.length > 0 ? (
                      <ul className="list">
                        {scan.explanation.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="hint">No specific threat flags triggered.</p>
                    )}

                    {heuristicSignals.length > 0 && (
                      <>
                        <p className="group-title" style={{ marginTop: 8 }}>Heuristic Signals</p>
                        <ul className="list">
                          {heuristicSignals.map((sig, idx) => (
                            <li key={idx} className="signal-item">{signalText(sig)}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <p className="hint" style={{ fontSize: 10, marginTop: 6 }}>Scan ID: {scan.id}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-identity">
          <span className="footer-user">{state?.user ? state.user.email : "Not signed in"}</span>
          <span className="footer-host">
            Backend: {baseUrl.replace(/^https?:\/\//, "")}
            {!showLogin && (
              <button
                type="button"
                className="linkish small-btn"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure Backend Base URL"
              >
                ⚙
              </button>
            )}
          </span>
        </div>
        {state?.authenticated && (
          <button className="linkish signout-btn" type="button" onClick={() => void onLogout()}>
            Sign Out
          </button>
        )}
      </footer>
    </div>
  );
}
