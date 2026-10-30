import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_BASE_URL, GuardianResponse, GuardianState } from "../types";
import { originFromBaseUrl } from "../storage/storage";

function send(message: object): Promise<GuardianResponse> {
  return chrome.runtime.sendMessage(message);
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 36 36" aria-hidden="true">
      <rect x="3" y="6" width="30" height="24" rx="2" fill="#0c1218" stroke="#1e2d42" />
      <path d="M18 10L27 14V20C27 24.5 23 27.5 18 29C13 27.5 9 24.5 9 20V14L18 10Z" fill="#10241c" stroke="#3dff9a" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="2.5" fill="#3dff9a" />
    </svg>
  );
}

function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function scoreWidth(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return `${clamped}%`;
}

function signalText(signal: unknown): string {
  if (typeof signal === "string") return signal;
  if (signal && typeof signal === "object") {
    const item = signal as { description?: string; signal_type?: string; severity?: string; name?: string; source?: string };
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
      return { label: "READY", cls: "ok" };
  }
}

export function Popup() {
  const [state, setState] = useState<GuardianState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [showConfig, setShowConfig] = useState(false);
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

  const onScan = async () => {
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
  const scan = state?.scan;
  const showLogin = !state?.authenticated || state.phase === "auth_expired" || state.phase === "unauthenticated";

  // Combine heuristic signals
  const heuristicSignals = useMemo(() => {
    if (!scan) return [];
    if (scan.threat_signals && scan.threat_signals.length > 0) return scan.threat_signals;
    if (scan.signals && scan.signals.length > 0) return scan.signals;
    return [];
  }, [scan]);

  return (
    <div className="app">
      <header className="identity">
        <Mark />
        <div>
          <h1>SignalSafe Guardian</h1>
          <p className="sub">Campus Threat Scanner</p>
        </div>
        <span className={`chip ${chip.cls}`}>{chip.label}</span>
      </header>

      <main className="main">
        {showLogin ? (
          <form className="stack" onSubmit={onLogin}>
            <p className="status-line">Sign in with your campus account. Tokens stay strictly inside the extension.</p>
            {state?.phase === "auth_expired" && (
              <div className="banner danger">Your session has expired. Sign in again to scan.</div>
            )}
            {state?.error && state.phase !== "auth_expired" && (
              <div className="banner danger">{state.error}</div>
            )}
            <label className="field">
              <span>Backend Base URL</span>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                autoComplete="url"
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
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
              {busy ? "Authenticating…" : "Sign In"}
            </button>
          </form>
        ) : (
          <>
            {/* Current Tab Details */}
            <div className="sample">
              <div className="sample-header">
                <span className="label">CURRENT TAB URL</span>
                {scan && (
                  <button className="linkish small" type="button" onClick={() => void onClearScan()}>
                    Reset
                  </button>
                )}
              </div>
              <p className="url" title={state?.tab?.url || ""}>{state?.tab?.url || "No active URL in current tab"}</p>
              {state?.tab && !state.tab.scannable && (
                <p className="hint warn-text">{state.tab.reason}</p>
              )}
            </div>

            {/* Error & Offline Banners */}
            {state?.phase === "backend_unavailable" && (
              <div className="banner warn">
                <p>{state.error || "SignalSafe backend is unreachable at " + baseUrl + "."}</p>
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

            {showConfig && (
              <form className="stack config-box" onSubmit={onSaveBaseUrl}>
                <label className="field">
                  <span>Update Backend Base URL</span>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8000"
                    required
                  />
                </label>
                <div className="row">
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    Save URL
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

            {/* Scan Action */}
            <div className="actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void onScan()}
                disabled={busy || !state?.tab?.scannable}
              >
                {busy && state?.phase === "scanning" ? "Analyzing with SignalSafe…" : "Scan Current Website"}
              </button>
            </div>

            {/* Status indicator line */}
            <p
              className={`status-line ${
                state?.phase === "malicious" ? "danger" : state?.phase === "suspicious" ? "warn" : ""
              }`}
            >
              {statusCopy(state)}
            </p>

            {/* Risk Gauge */}
            {(state?.phase === "scanning" || scan) && (
              <section>
                <div className="gel" data-level={state?.phase === "scanning" ? "scanning" : (scan?.risk_level || "").toLowerCase()}>
                  <div
                    className="gel-fill"
                    style={{ width: state?.phase === "scanning" ? undefined : scoreWidth(scan?.risk_score ?? 0) }}
                  />
                </div>
                <div className="gel-caption">
                  <span>{scan ? `Risk Level: ${scan.risk_level.toUpperCase()}` : "Contacting API…"}</span>
                  <span>{scan ? `Score: ${scan.risk_score} / 100` : "—"}</span>
                </div>
              </section>
            )}

            {/* Detailed Backend Scan Results */}
            {scan && state?.phase !== "scanning" && (
              <div className="scan-details-pane">
                {/* Technical Metric Lanes */}
                <div className="lanes">
                  <article className="lane">
                    <h2>ML MODEL</h2>
                    <p className="lane-status">{scan.ml_available ? scan.ml_prediction || "Active" : "Unavailable"}</p>
                    {scan.ml_available && scan.ml_confidence != null && (
                      <p className="num">Conf: {(scan.ml_confidence * 100).toFixed(0)}%</p>
                    )}
                  </article>
                  <article className="lane">
                    <h2>VIRUSTOTAL</h2>
                    <p className="lane-status">{scan.vt_available ? "Enabled" : "Disabled"}</p>
                    {scan.vt_available && (
                      <p className="num" title="Malicious / Suspicious / Undetected">
                        <span style={{ color: "var(--crimson)" }}>{scan.vt_malicious ?? 0}M</span> /{" "}
                        <span style={{ color: "var(--amber)" }}>{scan.vt_suspicious ?? 0}S</span> /{" "}
                        <span>{scan.vt_undetected ?? 0}U</span>
                      </p>
                    )}
                  </article>
                  <article className="lane">
                    <h2>HEURISTICS</h2>
                    <p className="lane-status">{heuristicSignals.length > 0 ? `${heuristicSignals.length} signals` : "Clean"}</p>
                    <p className="num">Score {scan.risk_score}</p>
                  </article>
                </div>

                {/* Scanned metadata info */}
                <div className="metadata-bar">
                  <span><strong>Domain:</strong> {scan.domain || "—"}</span>
                  <span><strong>Scanned:</strong> {formatTime(scan.scanned_at)}</span>
                </div>

                {/* Heuristic Signals List */}
                {heuristicSignals.length > 0 && (
                  <div className="results-group">
                    <p className="group-title">Heuristic Signals ({heuristicSignals.length})</p>
                    <ul className="list">
                      {heuristicSignals.map((sig, idx) => (
                        <li key={idx} className="signal-item">
                          {signalText(sig)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Explanations */}
                {!!scan.explanation?.length && (
                  <div className="results-group">
                    <p className="group-title">Threat Explanation</p>
                    <ul className="list">
                      {scan.explanation.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {!!scan.recommendations?.length && (
                  <div className="results-group">
                    <p className="group-title">Actionable Recommendations</p>
                    <ul className="list">
                      {scan.recommendations.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Threat Warnings Actions */}
                {(state.phase === "malicious" || state.phase === "suspicious") && (
                  <div className="row warning-actions">
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => void send({ type: "OPEN_WARNING", scanId: String(scan.id) })}
                    >
                      Open Warning Page
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => void onReport()}
                      disabled={busy}
                    >
                      {busy ? "Reporting…" : "Report to Campus Security"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-identity">
          <span className="footer-user">{state?.user ? state.user.email : "Not signed in"}</span>
          <span className="footer-host">
            API: {baseUrl.replace(/^https?:\/\//, "")}
            {!showLogin && (
              <button
                type="button"
                className="linkish small-btn"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure backend base URL"
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

function statusCopy(state: GuardianState | null): string {
  if (!state) return "Initializing…";
  switch (state.phase) {
    case "scanning":
      return "Submitting URL to SignalSafe Campus analysis pipeline…";
    case "safe":
      return "Scan complete: No active threats detected.";
    case "suspicious":
      return "Warning: High risk or suspicious indicators identified.";
    case "malicious":
      return "CRITICAL ALERT: URL classified as malicious!";
    case "inconclusive":
      return "Scan complete: Inconclusive threat evidence.";
    case "backend_unavailable":
      return "SignalSafe backend service unavailable.";
    case "idle":
      return "Ready to scan the active tab URL.";
    default:
      return "";
  }
}
