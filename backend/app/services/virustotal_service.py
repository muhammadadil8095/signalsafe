"""VirusTotal API v3 integration service.

Provides URL submission, analysis retrieval, and report lookup
with proper rate limiting, timeouts, and error handling.
"""

import base64
import logging
import time
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

VT_BASE_URL = "https://www.virustotal.com/api/v3"


class VirusTotalService:
    """Service for interacting with the VirusTotal API v3."""

    def __init__(self) -> None:
        self._api_key = settings.VT_API_KEY
        self._enabled = settings.VT_ENABLED and bool(self._api_key)
        self._timeout = settings.VT_TIMEOUT
        self._rate_limit = settings.VT_RATE_LIMIT
        self._last_request_time: float = 0
        self._cache: Dict[str, Dict] = {}

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    def _headers(self) -> Dict[str, str]:
        return {"x-apikey": self._api_key, "Accept": "application/json"}

    def _rate_limit_wait(self) -> None:
        """Enforce rate limiting between API requests."""
        if self._rate_limit <= 0:
            return
        min_interval = 60.0 / self._rate_limit
        elapsed = time.time() - self._last_request_time
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        self._last_request_time = time.time()

    def _url_id(self, url: str) -> str:
        """Generate the VT URL identifier (base64 of URL without padding)."""
        return base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")

    def submit_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Submit a URL for scanning.

        Args:
            url: The URL to submit for analysis.

        Returns:
            Analysis response dict or None on failure.
        """
        if not self._enabled:
            return None

        self._rate_limit_wait()

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(
                    f"{VT_BASE_URL}/urls",
                    headers=self._headers(),
                    data={"url": url},
                )

                if response.status_code == 429:
                    logger.warning("VirusTotal rate limit exceeded")
                    return None

                response.raise_for_status()
                data = response.json()
                analysis_id = data.get("data", {}).get("id")
                if analysis_id:
                    return self.get_analysis(analysis_id)
                return None

        except httpx.TimeoutException:
            logger.warning(f"VirusTotal request timed out after {self._timeout}s")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"VirusTotal HTTP error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"VirusTotal request failed: {e}")
            return None

    def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve analysis results.

        Args:
            analysis_id: The VT analysis ID to look up.

        Returns:
            Normalized results dict or None on failure.
        """
        if not self._enabled:
            return None

        self._rate_limit_wait()

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(
                    f"{VT_BASE_URL}/analyses/{analysis_id}",
                    headers=self._headers(),
                )

                if response.status_code == 429:
                    logger.warning("VirusTotal rate limit exceeded")
                    return None

                response.raise_for_status()
                return self._normalize_analysis(response.json())

        except httpx.TimeoutException:
            logger.warning("VirusTotal analysis retrieval timed out")
            return None
        except Exception as e:
            logger.error(f"VirusTotal analysis retrieval failed: {e}")
            return None

    def lookup_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Look up an existing URL report or submit for new analysis.

        Args:
            url: The URL to look up.

        Returns:
            Normalized results dict or None on failure.
        """
        if not self._enabled:
            return None

        cache_key = url.lower().strip()
        if cache_key in self._cache:
            return self._cache[cache_key]

        url_id = self._url_id(url)
        self._rate_limit_wait()

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(
                    f"{VT_BASE_URL}/urls/{url_id}",
                    headers=self._headers(),
                )

                if response.status_code == 404:
                    return self.submit_url(url)

                if response.status_code == 429:
                    logger.warning("VirusTotal rate limit exceeded")
                    return None

                response.raise_for_status()
                result = self._normalize_url_report(response.json())
                self._cache[cache_key] = result
                return result

        except httpx.TimeoutException:
            logger.warning("VirusTotal URL lookup timed out")
            return None
        except Exception as e:
            logger.error(f"VirusTotal URL lookup failed: {e}")
            return None

    def _normalize_analysis(self, data: Dict) -> Dict[str, Any]:
        """Extract normalized detection counts from an analysis response."""
        stats = (
            data.get("data", {})
            .get("attributes", {})
            .get("stats", {})
        )
        return {
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "harmless": stats.get("harmless", 0),
            "timeout": stats.get("timeout", 0),
        }

    def _normalize_url_report(self, data: Dict) -> Dict[str, Any]:
        """Extract normalized detection counts from a URL report response."""
        stats = (
            data.get("data", {})
            .get("attributes", {})
            .get("last_analysis_stats", {})
        )
        return {
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "harmless": stats.get("harmless", 0),
            "timeout": stats.get("timeout", 0),
        }

