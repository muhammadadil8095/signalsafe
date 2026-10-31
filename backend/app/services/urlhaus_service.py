"""URLhaus threat intelligence integration service.

Provides instant local signature lookup across 170,000+ verified URLhaus malware URLs
and 43,000+ malicious domains/hosts, combined with optional real-time abuse.ch API queries.
"""

import gzip
import json
import logging
import os
import threading
import time
from typing import Any, Dict, Optional, Set
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

URLHAUS_API_URL = "https://urlhaus-api.abuse.ch/v1"
CACHE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "urlhaus_signatures.json.gz")
)


class URLhausService:
    """Service for checking URLs against abuse.ch URLhaus threat database."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """Singleton pattern so signature database is loaded into memory only once."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(URLhausService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return

        self._enabled = getattr(settings, "URLHAUS_ENABLED", True)
        self._auth_key = getattr(settings, "URLHAUS_AUTH_KEY", None)
        self._timeout = getattr(settings, "URLHAUS_TIMEOUT", 5)

        self._urls: Set[str] = set()
        self._domains: Set[str] = set()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._last_updated = ""

        self._load_signatures()
        self._initialized = True

    def _normalize_url(self, u: str) -> str:
        """Strip and normalize URL for matching."""
        if not u:
            return ""
        norm = u.strip().lower()
        if norm.endswith("/"):
            norm = norm[:-1]
        return norm

    def _extract_domain(self, u: str) -> str:
        try:
            p = urlparse(u if "://" in u else f"http://{u}")
            return p.netloc.split(":")[0].strip().lower()
        except Exception:
            return ""

    def _load_signatures(self) -> None:
        """Load pre-compiled URLhaus signatures from compressed cache."""
        if not os.path.exists(CACHE_PATH):
            logger.info("URLhaus signature cache not found at %s", CACHE_PATH)
            return

        try:
            t0 = time.time()
            with gzip.open(CACHE_PATH, "rb") as f:
                data = json.loads(f.read().decode("utf-8"))
                self._urls = set(data.get("urls", []))
                self._domains = set(data.get("domains", []))
                self._last_updated = data.get("updated_at", "")
            t1 = time.time()
            logger.info(
                "Loaded %d URLhaus URLs and %d domains in %.3fs",
                len(self._urls),
                len(self._domains),
                t1 - t0,
            )
        except Exception as e:
            logger.error("Failed to load URLhaus signatures: %s", e)

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    @property
    def total_urls(self) -> int:
        return len(self._urls)

    @property
    def total_domains(self) -> int:
        return len(self._domains)

    def lookup_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Check if a URL or its host is flagged in the URLhaus threat intelligence database.

        Checks:
        1. In-memory exact and normalized URL set (0ms lookup).
        2. In-memory domain and host threat set.
        3. Real-time abuse.ch URLhaus API (if Auth-Key configured).

        Returns:
            Dict containing detection details if flagged, or None if clean.
        """
        if not self._enabled or not url:
            return None

        norm_url = self._normalize_url(url)
        if not norm_url:
            return None

        # Check local query cache first
        if norm_url in self._cache:
            return self._cache[norm_url]

        domain = self._extract_domain(url)

        # 1. Exact URL Match in URLhaus database
        # Also test with/without scheme and trailing slash
        url_variants = [
            norm_url,
            norm_url + "/",
            norm_url.split("://", 1)[-1] if "://" in norm_url else norm_url,
            "http://" + (norm_url.split("://", 1)[-1] if "://" in norm_url else norm_url),
            "https://" + (norm_url.split("://", 1)[-1] if "://" in norm_url else norm_url),
        ]

        for variant in url_variants:
            if variant in self._urls:
                result = {
                    "detected": True,
                    "threat": "malware_url",
                    "source": "urlhaus",
                    "match_type": "exact_url",
                    "reference": f"https://urlhaus.abuse.ch/browse/?search={domain}",
                    "confidence": 1.0,
                    "details": "Flagged as active malware or phishing payload in abuse.ch URLhaus",
                }
                self._cache[norm_url] = result
                return result

        # 2. Domain / Host Match in URLhaus active malware host list
        if domain and domain in self._domains:
            result = {
                "detected": True,
                "threat": "malicious_host",
                "source": "urlhaus",
                "match_type": "domain_blocklist",
                "reference": f"https://urlhaus.abuse.ch/host/{domain}/",
                "confidence": 0.98,
                "details": f"Host '{domain}' is listed in abuse.ch URLhaus as a malware distribution origin",
            }
            self._cache[norm_url] = result
            return result

        # 3. Query abuse.ch URLhaus API if Auth-Key is present
        if self._auth_key:
            api_result = self._query_api(url, domain)
            if api_result:
                self._cache[norm_url] = api_result
                return api_result

        # Clean / Not found
        self._cache[norm_url] = None
        return None

    def _query_api(self, url: str, domain: str) -> Optional[Dict[str, Any]]:
        """Query official abuse.ch URLhaus API endpoint."""
        try:
            headers = {
                "Auth-Key": self._auth_key,
                "User-Agent": "SignalSafe-Campus/1.0",
            }
            with httpx.Client(timeout=self._timeout) as client:
                # 1. Query URL endpoint
                resp = client.post(
                    f"{URLHAUS_API_URL}/url/",
                    headers=headers,
                    data={"url": url},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("query_status") == "ok":
                        return {
                            "detected": True,
                            "threat": data.get("threat", "malware_download"),
                            "source": "urlhaus_api",
                            "match_type": "api_lookup",
                            "reference": data.get("urlhaus_reference")
                            or f"https://urlhaus.abuse.ch/browse/?search={domain}",
                            "confidence": 1.0,
                            "url_status": data.get("url_status", "online"),
                            "tags": data.get("tags", []),
                            "details": f"URLhaus API verified malware payload ({data.get('threat', 'malware')})",
                        }

                # 2. Query host endpoint if domain exists
                if domain:
                    h_resp = client.post(
                        f"{URLHAUS_API_URL}/host/",
                        headers=headers,
                        data={"host": domain},
                    )
                    if h_resp.status_code == 200:
                        h_data = h_resp.json()
                        if h_data.get("query_status") == "ok":
                            return {
                                "detected": True,
                                "threat": "malicious_host",
                                "source": "urlhaus_api",
                                "match_type": "host_api_lookup",
                                "reference": f"https://urlhaus.abuse.ch/host/{domain}/",
                                "confidence": 0.95,
                                "details": f"URLhaus API confirmed malicious host: {domain}",
                            }
        except Exception as e:
            logger.warning("URLhaus API query non-critical error: %s", e)

        return None

