from app.analyzers.message_analyzer import MessageAnalyzer


def test_analyze_safe_message():
    analyzer = MessageAnalyzer()
    res = analyzer.analyze("Hi professor, what time is the lecture on Tuesday?")
    assert res["risk_level"] == "safe"
    assert res["risk_score"] < 20


def test_analyze_phishing_message():
    analyzer = MessageAnalyzer()
    res = analyzer.analyze(
        "URGENT: This is IT department! Your account will be closed immediately unless you verify your password right now."
    )
    assert res["risk_level"] in ("suspicious", "malicious")
    indicator_types = [ind["signal_type"] for ind in res["indicators"]]
    assert "credential_request" in indicator_types or "authority_impersonation" in indicator_types

