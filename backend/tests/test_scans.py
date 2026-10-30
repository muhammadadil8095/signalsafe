def test_scan_url_endpoint(client, user_token):
    response = client.post(
        "/api/v1/scans/url",
        json={"url": "https://example.com"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "scan_id" in data or "id" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "recommendations" in data


def test_scan_history_endpoint(client, user_token):
    # Perform a scan first
    client.post(
        "/api/v1/scans/url",
        json={"url": "https://example.com"},
        headers={"Authorization": f"Bearer {user_token}"},
    )

    response = client.get(
        "/api/v1/scans/history",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1

