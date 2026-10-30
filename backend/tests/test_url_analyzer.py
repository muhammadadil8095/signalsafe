from app.analyzers.url_analyzer import URLAnalyzer


def test_analyze_legitimate_url():
    analyzer = URLAnalyzer()
    signals = analyzer.analyze("https://www.google.com")
    signal_types = [s["signal_type"] for s in signals]
    assert "ip_address_url" not in signal_types
    assert "suspicious_tld" not in signal_types


def test_analyze_suspicious_ip_url():
    analyzer = URLAnalyzer()
    signals = analyzer.analyze("http://192.168.1.1/login.php")
    signal_types = [s["signal_type"] for s in signals]
    assert "ip_address_url" in signal_types
    assert "no_https" in signal_types


def test_analyze_suspicious_tld():
    analyzer = URLAnalyzer()
    signals = analyzer.analyze("http://account-update.tk/verify")
    signal_types = [s["signal_type"] for s in signals]
    assert "suspicious_tld" in signal_types


def test_analyze_brand_impersonation():
    analyzer = URLAnalyzer()
    signals = analyzer.analyze("https://paypal.com.phishingsite.com/login")
    signal_types = [s["signal_type"] for s in signals]
    assert "brand_impersonation" in signal_types

