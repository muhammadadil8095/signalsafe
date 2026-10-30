"""Message analyzer for detecting suspicious communication patterns.

Uses rule-based analysis to identify phishing, social engineering,
impersonation, threats, and financial fraud in messages.
"""

import re
from typing import Any, Dict, List


URGENCY_MARKERS = [
    "immediately", "urgent", "asap", "right now", "within 24 hours",
    "within the hour", "act now", "time-sensitive", "don't delay",
    "last chance", "final warning", "expires today", "deadline",
]

PAYMENT_KEYWORDS = [
    "wire transfer", "gift card", "bitcoin", "cryptocurrency",
    "western union", "moneygram", "venmo", "zelle", "cash app",
    "itunes card", "google play card", "steam card", "prepaid card",
]

CREDENTIAL_KEYWORDS = [
    "password", "ssn", "social security", "credit card number",
    "bank account", "pin number", "security code", "cvv",
    "mother's maiden", "date of birth", "routing number",
]

IMPERSONATION_PATTERNS = [
    r"(?:this is|from:?|i am|contacting from|on behalf of)\s+(?:the\s+)?(?:IT|tech support|helpdesk|system admin|registrar|financial aid|campus security|professor\b)",
    r"(?:official|mandatory)\s+(?:campus|university|security|IT)\s+notice",
    r"\bIT\s+department\b",
    r"\bIT\s+support\b",
    r"\bhelp\s*desk\s+alert\b",
    r"\bsystem\s+admin(?:istrator)?\b",
]

THREAT_KEYWORDS = [
    "suspend your account", "account will be closed",
    "legal action", "law enforcement", "arrest",
    "terminate your", "expel", "disciplinary action",
    "reported to authorities", "locked out",
    "lose access", "permanently delete",
]


class MessageAnalyzer:
    """Rule-based message analyzer for detecting social engineering attacks."""

    def analyze(self, message: str) -> Dict[str, Any]:
        """Analyze a message and return threat assessment.

        Args:
            message: The message text to analyze.

        Returns:
            Dictionary with risk_level, risk_score, indicators, explanation,
            and recommendations.
        """
        signals: List[Dict[str, Any]] = []
        message_lower = message.lower()

        self._check_urgency(message_lower, signals)
        self._check_payment_requests(message_lower, signals)
        self._check_credential_requests(message_lower, signals)
        self._check_impersonation(message, signals)
        self._check_threats(message_lower, signals)
        self._check_suspicious_links(message, signals)
        self._check_too_good(message_lower, signals)
        self._check_grammar_urgency_combo(message_lower, signals)
        self._check_verification_phishing(message_lower, signals)

        risk_score = self._compute_risk_score(signals)
        risk_level = self._compute_risk_level(risk_score)

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "indicators": signals,
            "explanation": self._generate_explanations(signals),
            "recommendations": self._generate_recommendations(risk_level, signals),
        }

    def _check_urgency(self, text: str, signals: List[Dict]) -> None:
        found = [m for m in URGENCY_MARKERS if m in text]
        if len(found) >= 2:
            signals.append({
                "signal_type": "high_urgency",
                "description": f"Message uses multiple urgency markers: {', '.join(found[:3])}. Attackers create artificial urgency to bypass critical thinking.",
                "severity": "high",
                "source": "rule_engine",
            })
        elif found:
            signals.append({
                "signal_type": "urgency_marker",
                "description": f"Message contains urgency language ('{found[0]}'). Legitimate organizations rarely pressure immediate action.",
                "severity": "medium",
                "source": "rule_engine",
            })

    def _check_payment_requests(self, text: str, signals: List[Dict]) -> None:
        found = [kw for kw in PAYMENT_KEYWORDS if kw in text]
        if found:
            signals.append({
                "signal_type": "payment_request",
                "description": f"Message mentions unconventional payment methods: {', '.join(found[:3])}. Legitimate organizations use standard billing.",
                "severity": "high",
                "source": "rule_engine",
            })

    def _check_credential_requests(self, text: str, signals: List[Dict]) -> None:
        found = [kw for kw in CREDENTIAL_KEYWORDS if kw in text]
        if found:
            signals.append({
                "signal_type": "credential_request",
                "description": f"Message asks for sensitive information: {', '.join(found[:3])}. Legitimate services never request these via message.",
                "severity": "critical",
                "source": "rule_engine",
            })

    def _check_impersonation(self, text: str, signals: List[Dict]) -> None:
        for pattern in IMPERSONATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                signals.append({
                    "signal_type": "authority_impersonation",
                    "description": f"Message appears to claim authority from '{re.search(pattern, text, re.IGNORECASE).group()}'. Verify the sender through official channels.",
                    "severity": "high",
                    "source": "rule_engine",
                })
                break

    def _check_threats(self, text: str, signals: List[Dict]) -> None:
        found = [t for t in THREAT_KEYWORDS if t in text]
        if found:
            signals.append({
                "signal_type": "threatening_language",
                "description": f"Message contains threatening language: '{found[0]}'. This is a common pressure tactic in social engineering.",
                "severity": "high",
                "source": "rule_engine",
            })

    def _check_suspicious_links(self, text: str, signals: List[Dict]) -> None:
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text, re.IGNORECASE)
        if urls:
            signals.append({
                "signal_type": "contains_links",
                "description": f"Message contains {len(urls)} URL(s). Verify links before clicking by hovering or using the URL scanner.",
                "severity": "low",
                "source": "rule_engine",
            })

    def _check_too_good(self, text: str, signals: List[Dict]) -> None:
        patterns = [
            "you have won", "congratulations", "selected as a winner",
            "free money", "lottery", "prize", "you've been chosen",
            "inheritance", "unclaimed funds", "million dollar",
        ]
        found = [p for p in patterns if p in text]
        if found:
            signals.append({
                "signal_type": "too_good_to_be_true",
                "description": "Message contains language typical of scams — offers that seem too good to be true usually are.",
                "severity": "high",
                "source": "rule_engine",
            })

    def _check_grammar_urgency_combo(self, text: str, signals: List[Dict]) -> None:
        grammar_issues = 0
        if re.search(r'[A-Z]{5,}', text):
            grammar_issues += 1
        if text.count("!") > 3:
            grammar_issues += 1
        if re.search(r'(\b\w+\b)(\s+\1){2,}', text):
            grammar_issues += 1
        has_urgency = any(m in text for m in URGENCY_MARKERS)
        if grammar_issues >= 2 and has_urgency:
            signals.append({
                "signal_type": "grammar_urgency_combo",
                "description": "Message combines poor grammar/formatting with urgency, a strong indicator of phishing.",
                "severity": "medium",
                "source": "rule_engine",
            })

    def _check_verification_phishing(self, text: str, signals: List[Dict]) -> None:
        patterns = [
            "verify your account", "confirm your identity",
            "update your information", "re-verify your",
            "your account has been", "unusual activity",
            "click here to verify", "click the link below",
        ]
        found = [p for p in patterns if p in text]
        if found:
            signals.append({
                "signal_type": "verification_phishing",
                "description": f"Message uses account verification language ('{found[0]}'). This is a very common phishing technique.",
                "severity": "high",
                "source": "rule_engine",
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
            return ["No suspicious indicators were detected in this message."]
        return [
            f"[{s['severity'].upper()}] {s['description']}" for s in signals
        ]

    def _generate_recommendations(
        self, risk_level: str, signals: List[Dict]
    ) -> List[str]:
        recs: List[str] = []
        if risk_level == "safe":
            recs.append("This message appears safe, but always verify the sender.")
        elif risk_level == "suspicious":
            recs.append("Do not click any links or provide information until you verify the sender.")
            recs.append("Contact the claimed sender through official channels to confirm.")
            recs.append("Report this message to campus IT if you're unsure.")
        else:
            recs.append("WARNING: This message shows strong indicators of a scam or phishing attack.")
            recs.append("Do NOT click links, download attachments, or provide any information.")
            recs.append("Report this message to campus IT security immediately.")
            recs.append("If you've already responded, change your passwords and notify IT.")

        signal_types = {s["signal_type"] for s in signals}
        if "credential_request" in signal_types:
            recs.append("Never share passwords, SSNs, or financial info via message.")
        if "payment_request" in signal_types:
            recs.append("Legitimate organizations never request gift cards or cryptocurrency.")
        return recs

