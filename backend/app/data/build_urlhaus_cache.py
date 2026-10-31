"""Build high-speed URLhaus signature database for SignalSafe Campus.

Extracts known URLhaus malware and phishing URLs from the local dataset and
syndicated threat feeds into a fast, compressed SQLite / JSON database.
"""

import gzip
import json
import os
import ssl
import sys
import time
import urllib.request
from urllib.parse import urlparse

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "backend", "app", "data")
CACHE_FILE = os.path.join(DATA_DIR, "urlhaus_signatures.json.gz")
DATASET_PATH = os.path.join(BASE_DIR, "ml", "datasets", "legitphish_mendeley.csv")

os.makedirs(DATA_DIR, exist_ok=True)


def normalize_url(u: str) -> str:
    """Normalize URL for consistent lookup."""
    u = u.strip().lower()
    if u.endswith("/"):
        u = u[:-1]
    return u


def build_cache():
    print("=" * 60)
    print(" SignalSafe Campus - URLhaus Threat Intel Ingestion ")
    print("=" * 60)

    urls = set()
    domains = set()

    # 1. Ingest from local verified dataset (Mendeley LegitPhish URLhaus entries)
    if os.path.exists(DATASET_PATH):
        print(f"[*] Ingesting from local dataset: {DATASET_PATH}")
        try:
            import pandas as pd
            df = pd.read_csv(DATASET_PATH, low_memory=False)
            if "ClassLabel" in df.columns and "URL" in df.columns:
                phish = df[df["ClassLabel"] == 0]["URL"].dropna()
                for raw_u in phish:
                    u = normalize_url(str(raw_u))
                    if u:
                        urls.add(u)
                        try:
                            p = urlparse(u)
                            if p.netloc:
                                domains.add(p.netloc.split(":")[0].lower())
                        except Exception:
                            pass
            print(f"[+] Loaded {len(urls)} URLs and {len(domains)} domains from local dataset.")
        except Exception as e:
            print(f"[!] Warning reading local dataset: {e}")

    # 2. Ingest from live URLhaus daily syndication feeds (optional / network available)
    live_feeds = [
        "https://malware-filter.gitlab.io/urlhaus-filter/urlhaus-filter-online.txt",
        "https://malware-filter.gitlab.io/urlhaus-filter/urlhaus-filter-domains.txt",
    ]

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for feed_url in live_feeds:
        print(f"[*] Fetching live URLhaus feed: {feed_url}")
        try:
            req = urllib.request.Request(feed_url, headers={"User-Agent": "SignalSafe-Campus/1.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                content = resp.read().decode("utf-8", errors="ignore")
                added_count = 0
                for line in content.splitlines():
                    line = line.strip().lower()
                    if not line or line.startswith("!") or line.startswith("#"):
                        continue
                    # Could be domain or IP or URL
                    if "/" in line:
                        norm = normalize_url(line)
                        if norm not in urls:
                            urls.add(norm)
                            added_count += 1
                    else:
                        clean_dom = line.split(":")[0].strip()
                        if clean_dom not in domains:
                            domains.add(clean_dom)
                            added_count += 1
                print(f"[+] Added {added_count} active indicators from {feed_url}.")
        except Exception as e:
            print(f"[!] Live feed fetch note: {e}")

    # 3. Save compressed signature database
    cache_payload = {
        "version": 1,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "url_count": len(urls),
        "domain_count": len(domains),
        "urls": list(urls),
        "domains": list(domains),
    }

    print(f"[*] Compacting {len(urls)} URLs and {len(domains)} domains to {CACHE_FILE}...")
    json_bytes = json.dumps(cache_payload).encode("utf-8")
    with gzip.open(CACHE_FILE, "wb", compresslevel=6) as f:
        f.write(json_bytes)

    size_mb = os.path.getsize(CACHE_FILE) / (1024 * 1024)
    print(f"[+] Successfully exported URLhaus signatures ({size_mb:.2f} MB compressed).")


if __name__ == "__main__":
    build_cache()

