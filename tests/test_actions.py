from types import SimpleNamespace

from flask import Flask

import backend.actions as actions


class FakeQuery:
    def __init__(self, data, fail=False):
        self.data = data
        self.fail = fail

    def select(self, *_args): return self
    def eq(self, *_args): return self
    def update(self, data): self.update_data = data; return self
    def insert(self, data): self.insert_data = data; return self
    def maybe_single(self): return self
    def execute(self):
        if self.fail:
            raise RuntimeError("db failure")
        return SimpleNamespace(data=self.data)


class FakeSupabase:
    def __init__(self, screening, update_data=None, audit_data=None, audit_fail=False):
        self.screening = screening
        self.update_data = update_data
        self.audit_data = audit_data
        self.audit_fail = audit_fail

    def table(self, name):
        if name == "screenings":
            return FakeQuery(self.screening if self.update_data is None else self.update_data)
        if name == "audit_logs":
            return FakeQuery(self.audit_data, fail=self.audit_fail)
        raise AssertionError(name)


def invoke(monkeypatch, payload, screening, update_data=None, audit_data=None, audit_fail=False):
    monkeypatch.setattr(actions, "supabase", FakeSupabase(screening, update_data, audit_data, audit_fail))
    app = Flask(__name__)
    with app.test_request_context(json=payload):
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        return actions.officer_action.__wrapped__("s1")


def test_allowed_action_creates_audit(monkeypatch):
    response = invoke(
        monkeypatch,
        {"action": "approved"},
        {"id": "s1", "screening_number": "VF-1", "created_by": "user-1", "status": "manual_review"},
        update_data=[{"id": "s1"}],
        audit_data=[{"id": "audit-1"}],
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["data"]["action"] == "approved"
    assert body["data"]["status"] == "completed"


def test_invalid_action_returns_400(monkeypatch):
    response = invoke(monkeypatch, {"action": "fraud"}, {"id": "s1", "created_by": "user-1", "status": "completed"})
    assert response[1] == 400
    assert response[0].get_json()["error"]["code"] == "VALIDATION_ERROR"


def test_forbidden_action_returns_403(monkeypatch):
    response = invoke(monkeypatch, {"action": "rejected"}, {"id": "s1", "created_by": "other", "status": "completed"})
    assert response[1] == 403
    assert response[0].get_json()["error"]["code"] == "FORBIDDEN"


def test_audit_failure_does_not_report_success(monkeypatch):
    response = invoke(
        monkeypatch,
        {"action": "manual_review"},
        {"id": "s1", "screening_number": "VF-1", "created_by": "user-1", "status": "processing"},
        update_data=[{"id": "s1"}],
        audit_data=None,
        audit_fail=True,
    )
    assert response[1] == 500
    assert response[0].get_json()["error"]["code"] == "AUDIT_LOG_FAILED"
