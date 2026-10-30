def test_create_and_get_report(client, user_token):
    res = client.post(
        "/api/v1/reports/",
        json={
            "title": "Phishing email received in campus inbox",
            "description": "Email claims I won a scholarship and requests banking details.",
            "incident_type": "phishing",
            "severity": "high",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 201
    report = res.json()
    assert report["title"] == "Phishing email received in campus inbox"
    report_id = report["id"]

    # Get report
    get_res = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id


def test_admin_update_report_status(client, user_token, admin_token):
    # User creates report
    res = client.post(
        "/api/v1/reports/",
        json={
            "title": "Suspicious login attempt reported",
            "description": "Suspicious activity detected from unfamiliar IP address.",
            "incident_type": "phishing",
            "severity": "medium",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    report_id = res.json()["id"]

    # Admin updates status
    update_res = client.put(
        f"/api/v1/reports/{report_id}/status",
        json={
            "status": "investigating",
            "resolution_notes": "Security operations center reviewing logs.",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "investigating"

