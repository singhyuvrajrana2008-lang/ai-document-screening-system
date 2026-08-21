from types import SimpleNamespace

import pytest
from flask import Flask

import backend.results as results


class FakeQuery:
    def __init__(self, data):
        self.data = data

    def select(self, _columns):
        return self

    def eq(self, _column, _value):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, _value):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data=self.data)


class FakeSupabase:
    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        return FakeQuery(self.tables.get(name))


def make_app(monkeypatch, tables, user_id="user-1", role="officer"):
    monkeypatch.setattr(results, "supabase", FakeSupabase(tables))
    app = Flask(__name__)

    def fake_require_auth(view):
        def wrapped(*args, **kwargs):
            from flask import g
            g.current_user = SimpleNamespace(id=user_id)
            g.current_role = role
            return view(*args, **kwargs)
        return wrapped

    monkeypatch.setattr(results, "require_auth", fake_require_auth)
    # Decorators are applied at import time, so use the endpoint functions
    # directly with request context for focused serializer/authorization tests.
    return app


def context_call(app, fn, screening_id):
    with app.test_request_context():
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        return fn.__wrapped__(screening_id) if hasattr(fn, "__wrapped__") else fn(screening_id)


def complete_tables(owner="user-1"):
    return {
        "screenings": {"id": "s1", "screening_number": "VF-2026-000001", "created_by": owner, "document_type": "passport", "status": "completed"},
        "documents": [{"id": "d1", "document_type": "passport", "original_filename": "passport.jpg"}],
        "ocr_results": {"processing_status": "completed", "confidence": 0.97, "extracted_data": {"name": "ALEX"}},
        "validation_results": {"overall_status": "pass", "issues": [], "checks": {"format": "pass"}},
        "tampering_results": {"tampering_detected": False, "tampering_score": 0.42, "indicators": [], "explanation": "No strong manipulation indicators detected."},
        "face_verifications": {"status": "match", "similarity_score": 0.91, "failure_reason": None},
        "risk_assessments": {"risk_score": 28, "risk_level": "low", "contributing_factors": ["No major document anomalies detected"]},
    }


def test_complete_result_matches_contract(monkeypatch):
    tables = complete_tables()
    monkeypatch.setattr(results, "supabase", FakeSupabase(tables))
    app = Flask(__name__)
    with app.test_request_context():
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        response = results.get_screening_result.__wrapped__("s1")

    body = response.get_json()
    assert response.status_code == 200
    assert body["success"] is True
    assert body["data"]["screening_id"] == "VF-2026-000001"
    assert body["data"]["ocr"]["fields"]["name"] == "ALEX"
    assert body["data"]["validation"]["checks"]["format"] == "pass"
    assert body["data"]["tampering"]["score"] == 0.42
    assert body["data"]["risk"]["level"] == "low"


def test_missing_screening_returns_404(monkeypatch):
    monkeypatch.setattr(results, "supabase", FakeSupabase({"screenings": None}))
    app = Flask(__name__)
    with app.test_request_context():
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        response = results.get_screening_result.__wrapped__("missing")

    assert response[1] == 404
    assert response[0].get_json()["error"]["code"] == "SCREENING_NOT_FOUND"


def test_forbidden_screening_returns_403(monkeypatch):
    monkeypatch.setattr(results, "supabase", FakeSupabase({"screenings": {"id": "s1", "screening_number": "VF-1", "created_by": "other", "status": "completed"}}))
    app = Flask(__name__)
    with app.test_request_context():
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        response = results.get_screening_result.__wrapped__("s1")

    assert response[1] == 403
    assert response[0].get_json()["error"]["code"] == "FORBIDDEN"


def test_missing_stage_result_returns_404(monkeypatch):
    tables = complete_tables()
    tables["risk_assessments"] = None
    monkeypatch.setattr(results, "supabase", FakeSupabase(tables))
    app = Flask(__name__)
    with app.test_request_context():
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        response = results.get_risk_result.__wrapped__("s1")

    assert response[1] == 404
    assert response[0].get_json()["error"]["code"] == "RESULT_NOT_FOUND"
