from types import SimpleNamespace

from flask import Flask

import backend.history as history


class FakeQuery:
    def __init__(self, data=None, count=None):
        self.data = data or []
        self.count = count

    def select(self, *_args, **_kwargs): return self
    def eq(self, *_args): return self
    def order(self, *_args, **_kwargs): return self
    def range(self, *_args): return self
    def in_(self, *_args): return self
    def execute(self): return SimpleNamespace(data=self.data, count=self.count)


class FakeSupabase:
    def __init__(self):
        self.calls = []

    def table(self, name):
        self.calls.append(name)
        if name == "screenings":
            return FakeQuery([
                {"screening_number":"VF-1","document_type":"passport","risk_level":"low","status":"completed","final_action":"approved","created_at":"2026-08-22T00:00:00Z"}
            ], 1)
        if name == "tampering_results":
            return FakeQuery([], 0)
        raise AssertionError(name)


def call(fn, query_string=""):
    app = Flask(__name__)
    with app.test_request_context("/api/screenings" + query_string):
        from flask import g
        g.current_user = SimpleNamespace(id="user-1")
        g.current_role = "officer"
        return fn.__wrapped__()


def test_history_returns_contract_shape(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(history, "supabase", fake)
    response = call(history.list_screenings, "?page=1&limit=20&risk=low&status=completed")
    body = response.get_json()
    assert response.status_code == 200
    assert body["data"]["items"][0]["screening_id"] == "VF-1"
    assert body["data"]["total"] == 1


def test_history_rejects_invalid_limit(monkeypatch):
    monkeypatch.setattr(history, "supabase", FakeSupabase())
    response = call(history.list_screenings, "?limit=0")
    assert response[1] == 400
    assert response[0].get_json()["error"]["code"] == "INVALID_REQUEST"


def test_dashboard_counts_live_rows(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(history, "supabase", fake)
    response = call(history.dashboard_stats)
    body = response.get_json()
    assert response.status_code == 200
    assert body["data"]["documents_screened"] == 1
    assert body["data"]["low_risk"] == 1
    assert body["data"]["medium_risk"] == 1
    assert body["data"]["high_risk"] == 1
    assert body["data"]["tampering_flags"] == 0
