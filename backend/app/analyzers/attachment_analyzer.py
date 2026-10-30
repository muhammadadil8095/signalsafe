"""Static file analyzer for PDF and HTML attachments.

Extracts structural indicators without executing any content.
"""

import io
import os
import re
import logging
import tempfile
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class AttachmentAnalyzer:
    """Static analyzer for PDF and HTML file attachments."""

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    def analyze(
        self, file_content: bytes, file_name: str, mime_type: str
    ) -> Dict[str, Any]:
        """Analyze a file attachment for suspicious indicators.

        Args:
            file_content: Raw file bytes.
            file_name: Original file name.
            mime_type: MIME type of the file.

        Returns:
            Dict with risk_level, risk_score, indicators, explanation,
            and recommendations.
        """
        signals: List[Dict[str, Any]] = []

        if len(file_content) > self.MAX_FILE_SIZE:
            return {
                "risk_level": "inconclusive",
                "risk_score": 0,
                "indicators": [],
                "explanation": ["File exceeds maximum allowed size (10 MB)."],
                "recommendations": ["Upload a smaller file."],
                "file_name": file_name,
                "file_type": mime_type,
                "file_size": len(file_content),
            }

        ext = os.path.splitext(file_name)[1].lower()

        if ext == ".pdf" or mime_type == "application/pdf":
            self._analyze_pdf(file_content, signals)
        elif ext in (".html", ".htm") or mime_type in (
            "text/html",
            "application/xhtml+xml",
        ):
            self._analyze_html(file_content, signals)
        else:
            return {
                "risk_level": "inconclusive",
                "risk_score": 0,
                "indicators": [],
                "explanation": [f"Unsupported file type: {ext}"],
                "recommendations": ["Only PDF and HTML files are supported."],
                "file_name": file_name,
                "file_type": mime_type,
                "file_size": len(file_content),
            }

        risk_score = self._compute_risk_score(signals)
        risk_level = self._compute_risk_level(risk_score)

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "indicators": signals,
            "explanation": self._generate_explanations(signals),
            "recommendations": self._generate_recommendations(risk_level),
            "file_name": file_name,
            "file_type": mime_type,
            "file_size": len(file_content),
        }

    def _analyze_pdf(
        self, content: bytes, signals: List[Dict[str, Any]]
    ) -> None:
        """Extract suspicious indicators from a PDF file."""
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(io.BytesIO(content))
        except Exception as e:
            logger.warning(f"Failed to parse PDF: {e}")
            signals.append({
                "signal_type": "parse_error",
                "description": "PDF could not be parsed — the file may be corrupted or intentionally malformed.",
                "severity": "medium",
                "source": "static_analysis",
            })
            return

        raw = content.decode("latin-1", errors="ignore")

        if "/JavaScript" in raw or "/JS" in raw:
            signals.append({
                "signal_type": "pdf_javascript",
                "description": "PDF contains JavaScript references, which can be used to execute malicious code.",
                "severity": "critical",
                "source": "static_analysis",
            })

        if "/OpenAction" in raw:
            signals.append({
                "signal_type": "pdf_open_action",
                "description": "PDF has an OpenAction that executes automatically when opened.",
                "severity": "high",
                "source": "static_analysis",
            })

        if "/AA" in raw:
            signals.append({
                "signal_type": "pdf_additional_actions",
                "description": "PDF contains Additional Actions (AA) that trigger on specific events.",
                "severity": "high",
                "source": "static_analysis",
            })

        if "/Launch" in raw:
            signals.append({
                "signal_type": "pdf_launch_action",
                "description": "PDF contains a Launch action that can execute external programs.",
                "severity": "critical",
                "source": "static_analysis",
            })

        if "/EmbeddedFile" in raw or "/EmbeddedFiles" in raw:
            signals.append({
                "signal_type": "pdf_embedded_files",
                "description": "PDF contains embedded files, which may include malware.",
                "severity": "high",
                "source": "static_analysis",
            })

        urls = re.findall(r'/URI\s*\((https?://[^)]+)\)', raw)
        if urls:
            signals.append({
                "signal_type": "pdf_external_links",
                "description": f"PDF contains {len(urls)} external link(s). Verify destinations before clicking.",
                "severity": "medium",
                "source": "static_analysis",
            })

        suspicious_meta = []
        if reader.metadata:
            for key in ["/Producer", "/Creator", "/Author"]:
                val = reader.metadata.get(key, "")
                if val and any(s in str(val).lower() for s in ["phish", "hack", "exploit"]):
                    suspicious_meta.append(key)
        if suspicious_meta:
            signals.append({
                "signal_type": "pdf_suspicious_metadata",
                "description": f"PDF metadata contains suspicious values in: {', '.join(suspicious_meta)}.",
                "severity": "medium",
                "source": "static_analysis",
            })

    def _analyze_html(
        self, content: bytes, signals: List[Dict[str, Any]]
    ) -> None:
        """Extract suspicious indicators from an HTML file."""
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            text = content.decode("latin-1", errors="ignore")

        soup = BeautifulSoup(text, "html.parser")

        forms = soup.find_all("form")
        for form in forms:
            action = form.get("action", "")
            if action and action.startswith("http"):
                signals.append({
                    "signal_type": "html_external_form",
                    "description": f"HTML contains a form posting to external URL: {action[:80]}",
                    "severity": "high",
                    "source": "static_analysis",
                })

        password_inputs = soup.find_all("input", attrs={"type": "password"})
        if password_inputs:
            signals.append({
                "signal_type": "html_password_field",
                "description": "HTML contains password input field(s) — may be a credential-harvesting page.",
                "severity": "high",
                "source": "static_analysis",
            })

        scripts = soup.find_all("script")
        for script in scripts:
            src = script.get("src", "")
            text_content = script.string or ""
            if src and src.startswith("http"):
                signals.append({
                    "signal_type": "html_external_script",
                    "description": f"HTML loads an external script from: {src[:80]}",
                    "severity": "medium",
                    "source": "static_analysis",
                })
            if "eval(" in text_content or "unescape(" in text_content:
                signals.append({
                    "signal_type": "html_obfuscated_script",
                    "description": "HTML contains obfuscated JavaScript (eval/unescape), a common evasion technique.",
                    "severity": "critical",
                    "source": "static_analysis",
                })
            if "document.cookie" in text_content:
                signals.append({
                    "signal_type": "html_cookie_access",
                    "description": "HTML script accesses document.cookie — potential cookie theft.",
                    "severity": "high",
                    "source": "static_analysis",
                })

        iframes = soup.find_all("iframe")
        for iframe in iframes:
            style = iframe.get("style", "")
            width = iframe.get("width", "")
            height = iframe.get("height", "")
            if "display:none" in style or "visibility:hidden" in style or width == "0" or height == "0":
                signals.append({
                    "signal_type": "html_hidden_iframe",
                    "description": "HTML contains a hidden iframe, often used for drive-by downloads.",
                    "severity": "critical",
                    "source": "static_analysis",
                })

        meta_refresh = soup.find_all("meta", attrs={"http-equiv": re.compile(r"refresh", re.I)})
        for meta in meta_refresh:
            content_attr = meta.get("content", "")
            if "url=" in content_attr.lower():
                signals.append({
                    "signal_type": "html_meta_redirect",
                    "description": "HTML uses meta refresh redirect, which can send users to a malicious site.",
                    "severity": "high",
                    "source": "static_analysis",
                })

    def _compute_risk_score(self, signals: List[Dict]) -> float:
        weights = {"low": 8.0, "medium": 20.0, "high": 40.0, "critical": 65.0}
        score = sum(weights.get(s.get("severity", "low"), 8.0) for s in signals)
        return min(round(score, 2), 100.0)

    def _compute_risk_level(self, score: float) -> str:
        if score < 20:
            return "safe"
        elif score <= 50:
            return "suspicious"
        else:
            return "malicious"

    def _generate_explanations(self, signals: List[Dict]) -> List[str]:
        if not signals:
            return ["No suspicious indicators detected in this file."]
        return [f"[{s['severity'].upper()}] {s['description']}" for s in signals]

    def _generate_recommendations(self, risk_level: str) -> List[str]:
        if risk_level == "safe":
            return ["File appears safe. Standard caution still applies."]
        elif risk_level == "suspicious":
            return [
                "Exercise caution with this file.",
                "Do not enable macros or allow scripts to run.",
                "Verify the file source before opening.",
            ]
        else:
            return [
                "WARNING: This file contains potentially dangerous content.",
                "Do NOT open this file on your personal device.",
                "Report this file to campus IT security.",
                "If opened, run a full malware scan on your device.",
            ]

