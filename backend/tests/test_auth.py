def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newstudent@campus.edu",
            "username": "newstudent",
            "password": "securepassword123",
            "full_name": "New Student",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newstudent@campus.edu"
    assert data["username"] == "newstudent"
    assert "id" in data


def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email


def test_login_invalid_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me(client, user_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "teststudent@campus.edu"

