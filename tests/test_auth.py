from types import SimpleNamespace

from flask import Flask, jsonify, g

import backend.auth as auth


class FakeTable:
    def __init__(self, profile):
        self.profile = profile

    def select(self, _columns):
        return self

    def eq(self, _column, _value):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data=self.profile)


class FakeAuth:
    def __init__(self, user=None, error=None):
        self.user = user
        self.error = error

    def get_user(self, _token):
        if self.error:
            raise self.error
        return SimpleNamespace(user=self.user)


class FakeSupabase:
    def __init__(self, user=None, profile=None, error=None):
        self.auth = FakeAuth(user=user, error=error)
        self.profile = profile

    def table(self, _name):
        return FakeTable(self.profile)


def make_app(monkeypatch, user=None, profile=None, auth_error=None):
    monkeypatch.setattr(
        auth,
        "supabase",
        FakeSupabase(user=user, profile=profile, error=auth_error),
    )

    app = Flask(__name__)

    @app.get("/protected")
    @auth.require_auth
    def protected():
        return jsonify(
            {
                "success": True,
                "data": {
                    "user_id": g.current_user.id,
                    "role": g.current_role,
                },
            }
        )

    return app


def test_missing_authorization_returns_401(monkeypatch):
    app = make_app(monkeypatch)

    response = app.test_client().get("/protected")

    assert response.status_code == 401
    assert response.get_json() == {
        "success": False,
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Authorization Bearer token is required.",
        },
    }


def test_invalid_token_returns_401(monkeypatch):
    app = make_app(monkeypatch, auth_error=RuntimeError("invalid token"))

    response = app.test_client().get(
        "/protected",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "UNAUTHORIZED"
    assert response.get_json()["error"]["message"] == "Invalid or expired access token."


def test_valid_token_loads_profile_and_role(monkeypatch):
    user = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")
    profile = {
        "id": user.id,
        "officer_id": "OFF-001",
        "display_name": "Demo Officer",
        "role": "officer",
    }
    app = make_app(monkeypatch, user=user, profile=profile)

    response = app.test_client().get(
        "/protected",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "data": {
            "user_id": user.id,
            "role": "officer",
        },
    }


def test_authenticated_user_without_profile_returns_403(monkeypatch):
    user = SimpleNamespace(id="00000000-0000-0000-0000-000000000002")
    app = make_app(monkeypatch, user=user, profile=None)

    response = app.test_client().get(
        "/protected",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 403
    assert response.get_json() == {
        "success": False,
        "error": {
            "code": "FORBIDDEN",
            "message": "Authenticated user profile not found.",
        },
    }
