"""URL heuristic analyzer for detecting phishing and malicious URLs.

Uses lexical and structural analysis to identify suspicious URL patterns
without fetching the URL content.
"""

import re
import math
import ipaddress
from typing import Any, Dict, List
from urllib.parse import urlparse, parse_qs

import tldextract

_tld_extractor = tldextract.TLDExtract(suffix_list_urls=())


SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "buzz", "club",
    "work", "date", "racing", "win", "bid", "stream", "download",
    "click", "link", "gdn", "icu", "monster", "cam",
}

URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly",
    "ow.ly", "rebrand.ly", "bl.ink", "shorte.st", "adf.ly", "cutt.ly",
    "rb.gy", "shorturl.at", "tiny.cc", "v.gd",
}

BRAND_PATTERNS = [
    "paypal", "google", "microsoft", "apple", "amazon", "netflix",
    "facebook", "instagram", "twitter", "linkedin", "chase", "wells",
    "citibank", "bankofamerica", "usbank", "dropbox", "icloud",
    "outlook", "office365", "adobe", "spotify", "whatsapp",
]

SUSPICIOUS_PATH_KEYWORDS = {
    "login", "signin", "sign-in", "verify", "secure", "account",
    "update", "confirm", "banking", "password", "credential",
    "authenticate", "wallet", "suspend", "alert", "billing",
    "invoice", "payment", "webscr", "cmd=", "dispatch",
}


class URLAnalyzer:
    """Heuristic URL analyzer that detects phishing indicators.

    Examines URL structure, domain, path, and other lexical features
    to produce a list of threat signals without fetching the URL.
    """

    def analyze(self, url: str) -> List[Dict[str, Any]]:
        """Analyze a URL and return detected threat signals.

        Args:
            url: The normalized URL to analyze.

        Returns:
            List of signal dicts with keys: signal_type, description, severity, source.
        """
        signals: List[Dict[str, Any]] = []
        parsed = urlparse(url)
        ext = _tld_extractor(url)
        domain = parsed.netloc.lower().split(":")[0]

        self._check_url_length(url, signals)
        self._check_ip_address(domain, signals)
        self._check_https(parsed, signals)
        self._check_suspicious_tld(ext, signals)
        self._check_excessive_subdomains(ext, signals)
        self._check_at_symbol(url, signals)
        self._check_brand_impersonation(domain, ext, signals)
        self._check_suspicious_path(parsed, signals)
        self._check_url_shortener(ext, signals)
        self._check_punycode(domain, signals)
        self._check_port(parsed, signals)
        self._check_data_uri(url, signals)
        self._check_excessive_query_params(parsed, signals)
        self._check_double_slash_redirect(parsed, signals)
        self._check_suspicious_chars(url, signals)
        self._check_digit_ratio(url, signals)
        self._check_entropy(url, signals)

        return signals

    def _check_url_length(self, url: str, signals: List[Dict]) -> None:
        if len(url) > 75:
            severity = "medium" if len(url) <= 150 else "high"
            signals.append({
                "signal_type": "long_url",
                "description": f"URL is unusually long ({len(url)} characters). Phishing URLs often use length to obscure the true destination.",
                "severity": severity,
                "source": "heuristic",
            })

    def _check_ip_address(self, domain: str, signals: List[Dict]) -> None:
        clean = domain.strip("[]")
        try:
            ipaddress.ip_address(clean)
            signals.append({
                "signal_type": "ip_address_url",
                "description": "URL uses an IP address instead of a domain name — a common phishing technique.",
                "severity": "high",
                "source": "heuristic",
            })
        except ValueError:
            pass

    def _check_https(self, parsed, signals: List[Dict]) -> None:
        if parsed.scheme == "http":
            signals.append({
                "signal_type": "no_https",
                "description": "URL does not use HTTPS. Sensitive data may be transmitted in the clear.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_suspicious_tld(self, ext, signals: List[Dict]) -> None:
        if ext.suffix and ext.suffix.lower() in SUSPICIOUS_TLDS:
            signals.append({
                "signal_type": "suspicious_tld",
                "description": f"Domain uses the '.{ext.suffix}' TLD, which is frequently associated with phishing campaigns.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_excessive_subdomains(self, ext, signals: List[Dict]) -> None:
        if ext.subdomain:
            parts = ext.subdomain.split(".")
            if len(parts) >= 3:
                signals.append({
                    "signal_type": "excessive_subdomains",
                    "description": f"URL has {len(parts)} subdomain levels, which may be used to impersonate a legitimate site.",
                    "severity": "medium",
                    "source": "heuristic",
                })

    def _check_at_symbol(self, url: str, signals: List[Dict]) -> None:
        parsed = urlparse(url)
        if "@" in (parsed.netloc or ""):
            signals.append({
                "signal_type": "at_symbol",
                "description": "URL contains an '@' symbol in the authority, which can redirect to an unexpected destination.",
                "severity": "high",
                "source": "heuristic",
            })

    def _check_brand_impersonation(self, domain: str, ext, signals: List[Dict]) -> None:
        registered = ext.domain.lower() if ext.domain else ""
        subdomain = ext.subdomain.lower() if ext.subdomain else ""
        full = f"{subdomain}.{registered}" if subdomain else registered

        for brand in BRAND_PATTERNS:
            if brand in full and brand != registered:
                signals.append({
                    "signal_type": "brand_impersonation",
                    "description": f"URL contains the brand name '{brand}' but the registered domain is '{registered}.{ext.suffix}' — possible impersonation.",
                    "severity": "high",
                    "source": "heuristic",
                })
                break

    def _check_suspicious_path(self, parsed, signals: List[Dict]) -> None:
        path_lower = (parsed.path or "").lower()
        found = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in path_lower]
        if len(found) >= 2:
            signals.append({
                "signal_type": "suspicious_path_keywords",
                "description": f"URL path contains multiple suspicious keywords: {', '.join(found[:4])}.",
                "severity": "medium",
                "source": "heuristic",
            })
        elif len(found) == 1:
            signals.append({
                "signal_type": "suspicious_path_keyword",
                "description": f"URL path contains the keyword '{found[0]}', commonly seen in phishing pages.",
                "severity": "low",
                "source": "heuristic",
            })

    def _check_url_shortener(self, ext, signals: List[Dict]) -> None:
        fqdn = f"{ext.domain}.{ext.suffix}".lower()
        if fqdn in URL_SHORTENERS:
            signals.append({
                "signal_type": "url_shortener",
                "description": f"URL uses a URL shortener ({fqdn}). The true destination is hidden.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_punycode(self, domain: str, signals: List[Dict]) -> None:
        if "xn--" in domain:
            signals.append({
                "signal_type": "punycode_domain",
                "description": "Domain uses Punycode (internationalized domain name), which can disguise look-alike characters.",
                "severity": "high",
                "source": "heuristic",
            })

    def _check_port(self, parsed, signals: List[Dict]) -> None:
        if parsed.port and parsed.port not in (80, 443):
            signals.append({
                "signal_type": "unusual_port",
                "description": f"URL specifies an unusual port ({parsed.port}). Legitimate sites typically use standard ports.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_data_uri(self, url: str, signals: List[Dict]) -> None:
        if url.lower().startswith("data:"):
            signals.append({
                "signal_type": "data_uri",
                "description": "This is a data URI, not a standard URL. It may contain embedded malicious content.",
                "severity": "critical",
                "source": "heuristic",
            })

    def _check_excessive_query_params(self, parsed, signals: List[Dict]) -> None:
        params = parse_qs(parsed.query or "")
        if len(params) > 5:
            signals.append({
                "signal_type": "excessive_query_params",
                "description": f"URL contains {len(params)} query parameters, which may be used to track or obfuscate.",
                "severity": "low",
                "source": "heuristic",
            })

    def _check_double_slash_redirect(self, parsed, signals: List[Dict]) -> None:
        path = parsed.path or ""
        if "//" in path:
            signals.append({
                "signal_type": "double_slash_redirect",
                "description": "URL path contains a double-slash, which could indicate an open redirect.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_suspicious_chars(self, url: str, signals: List[Dict]) -> None:
        suspicious = set("-_.~:/?#[]@!$&'()*+,;=%")
        count = sum(1 for c in url if c in suspicious)
        ratio = count / max(len(url), 1)
        if ratio > 0.3:
            signals.append({
                "signal_type": "high_special_char_ratio",
                "description": "URL has an unusually high ratio of special characters, suggesting obfuscation.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_digit_ratio(self, url: str, signals: List[Dict]) -> None:
        digits = sum(1 for c in url if c.isdigit())
        ratio = digits / max(len(url), 1)
        if ratio > 0.3:
            signals.append({
                "signal_type": "high_digit_ratio",
                "description": "URL contains an unusually high proportion of digits, which is common in auto-generated phishing URLs.",
                "severity": "medium",
                "source": "heuristic",
            })

    def _check_entropy(self, url: str, signals: List[Dict]) -> None:
        entropy = self._shannon_entropy(url)
        if entropy > 4.5:
            signals.append({
                "signal_type": "high_entropy",
                "description": f"URL has high Shannon entropy ({entropy:.2f}), indicating randomness typical of malicious URLs.",
                "severity": "low",
                "source": "heuristic",
            })

    @staticmethod
    def _shannon_entropy(text: str) -> float:
        if not text:
            return 0.0
        freq: Dict[str, int] = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        length = len(text)
        entropy = 0.0
        for count in freq.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy

