from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure some expected keys exist
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Science Club"
    email = "tester@example.com"

    # Ensure participant not already in activity
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    j = resp.json()
    assert "Signed up" in j.get("message", "")
    assert email in activities[activity]["participants"]

    # Signup again should fail (duplicate)
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200

    assert email not in activities[activity]["participants"]


def test_unregister_not_found():
    activity = "Drama Club"
    email = "notfound@example.com"
    # Ensure email not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
