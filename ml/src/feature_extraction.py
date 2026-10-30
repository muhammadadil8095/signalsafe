"""Feature extraction for URL phishing detection.

Extracts 27 lexical and structural features from a URL for machine learning inference
and training.
"""

import ipaddress
import math
import re
from typing import Any, Dict, List
from urllib.parse import parse_qs, urlparse

try:
    import tldextract
    _tld_extractor = tldextract.TLDExtract(suffix_list_urls=())
except ImportError:
    tldextract = None
    _tld_extractor = None

SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "buzz", "club",
    "work", "date", "racing", "win", "bid", "stream", "download",
    "click", "link", "gdn", "icu", "monster", "cam",
}

SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly",
    "ow.ly", "rebrand.ly", "bl.ink", "shorte.st", "adf.ly", "cutt.ly",
    "rb.gy", "shorturl.at", "tiny.cc", "v.gd",
}

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "account", "update", "confirm",
    "banking", "password", "credential", "auth", "wallet",
]


class URLFeatureExtractor:
    """Extracts numerical and categorical features from raw URLs."""

    FEATURE_NAMES = [
        "url_length",
        "domain_length",
        "path_length",
        "num_dots",
        "num_hyphens",
        "num_underscores",
        "num_slashes",
        "num_query_params",
        "num_fragments",
        "num_digits",
        "num_special_chars",
        "has_ip_address",
        "has_at_symbol",
        "has_double_slash_redirect",
        "has_https",
        "has_www",
        "subdomain_count",
        "is_shortened",
        "suspicious_tld",
        "has_port",
        "digit_ratio",
        "letter_ratio",
        "special_char_ratio",
        "has_punycode",
        "domain_has_digits",
        "path_has_suspicious_keywords",
        "entropy",
    ]

    def get_feature_names(self) -> List[str]:
        return self.FEATURE_NAMES.copy()

    @staticmethod
    def _calculate_entropy(text: str) -> float:
        if not text:
            return 0.0
        entropy = 0.0
        length = len(text)
        freq: Dict[str, int] = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        for count in freq.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy

    def extract(self, url: str) -> Dict[str, Any]:
        """Extract all 27 features from a single URL."""
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = "http://" + url

        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        path = parsed.path
        query = parsed.query

        # Domain extraction
        domain = netloc.split(":")[0]
        subdomain = ""
        suffix = ""
        if _tld_extractor:
            extracted = _tld_extractor(url)
            domain = extracted.domain
            subdomain = extracted.subdomain
            suffix = extracted.suffix

        # IP address check
        has_ip = 0
        try:
            ipaddress.ip_address(netloc.split(":")[0].strip("[]"))
            has_ip = 1
        except ValueError:
            has_ip = 0

        # Calculations
        url_len = len(url)
        digits = sum(1 for c in url if c.isdigit())
        letters = sum(1 for c in url if c.isalpha())
        special_chars = sum(1 for c in url if not c.isalnum())

        subdomain_parts = [p for p in subdomain.split(".") if p] if subdomain else []
        subdomain_count = len(subdomain_parts)

        query_params = parse_qs(query)
        num_query = len(query_params)

        fqdn = f"{domain}.{suffix}".lower() if suffix else domain.lower()
        is_shortened = 1 if (fqdn in SHORTENERS or netloc in SHORTENERS) else 0
        suspicious_tld = 1 if suffix.lower() in SUSPICIOUS_TLDS else 0

        has_port = 1 if (parsed.port and parsed.port not in (80, 443)) else 0
        has_punycode = 1 if "xn--" in netloc else 0
        domain_has_digits = 1 if any(c.isdigit() for c in domain) else 0

        path_suspicious = 0
        path_lower = path.lower()
        if any(kw in path_lower for kw in SUSPICIOUS_KEYWORDS):
            path_suspicious = 1

        features = {
            "url_length": float(url_len),
            "domain_length": float(len(domain)),
            "path_length": float(len(path)),
            "num_dots": float(url.count(".")),
            "num_hyphens": float(url.count("-")),
            "num_underscores": float(url.count("_")),
            "num_slashes": float(url.count("/")),
            "num_query_params": float(num_query),
            "num_fragments": float(1 if parsed.fragment else 0),
            "num_digits": float(digits),
            "num_special_chars": float(special_chars),
            "has_ip_address": float(has_ip),
            "has_at_symbol": float(1 if "@" in url else 0),
            "has_double_slash_redirect": float(1 if "//" in path else 0),
            "has_https": float(1 if parsed.scheme == "https" else 0),
            "has_www": float(1 if netloc.startswith("www.") else 0),
            "subdomain_count": float(subdomain_count),
            "is_shortened": float(is_shortened),
            "suspicious_tld": float(suspicious_tld),
            "has_port": float(has_port),
            "digit_ratio": float(digits / max(url_len, 1)),
            "letter_ratio": float(letters / max(url_len, 1)),
            "special_char_ratio": float(special_chars / max(url_len, 1)),
            "has_punycode": float(has_punycode),
            "domain_has_digits": float(domain_has_digits),
            "path_has_suspicious_keywords": float(path_suspicious),
            "entropy": float(round(self._calculate_entropy(url), 4)),
        }

        return features

    def extract_batch(self, urls: List[str]):
        """Extract features for multiple URLs into a pandas DataFrame."""
        import pandas as pd
        rows = [self.extract(u) for u in urls]
        return pd.DataFrame(rows)
