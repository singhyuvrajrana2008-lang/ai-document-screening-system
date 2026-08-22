import sys
from types import ModuleType, SimpleNamespace

from flask import Flask

fake_config = ModuleType("config")
fake_config.supabase = None
sys.modules.setdefault("config", fake_config)

import backend.auth as auth
import backend.screenings as screenings


class FakeQuery:
    def __init__(self, data=None):
        self.data = data
        self.insert_payload = None

    def select(self, *_args):
        return self

    def insert(self, payload):
        self.insert_payload = payload
        return self

    def delete(self):
        return self

    def eq(self, *_args):
        return self

    def maybe_single(self):
        return self

    def limit(self, *_args):
        return self

    def execute(self):
        if self.insert_payload is not None:
            row = dict(self.insert_payload)
            if "screening_number" not in row and "screening_id" not in row:
                row.setdefault("id", "screening-uuid")
                row.setdefault("screening_number", "VF-2026-000001")
                row.setdefault("status", "processing")
            else:
                row.setdefault("id", "document-uuid")
                row.setdefault("processing_status", "uploaded")
            return SimpleNamespace(data=[row])
        return SimpleNamespace(data=self.data)


class FakeStorageBucket:
    def __init__(self):
        self.uploads = []
        self.removals = []

    def upload(self, path, data, options):
        self.uploads.append((path, data, options))
        return {"path": path}

    def remove(self, paths):
        self.removals.extend(paths)


class FakeSupabase:
    def __init__(self):
        self.storage_bucket = FakeStorageBucket()
        self.auth = SimpleNamespace(get_user=lambda _token: SimpleNamespace(user=SimpleNamespace(id="user-1")))

    def table(self, name):
        if name == "profiles":
            return FakeQuery({"id": "user-1", "role": "officer"})
        if name == "screenings":
            return FakeQuery({
                "id": "screening-uuid",
                "screening_number": "VF-2026-000001",
                "document_type": "passport",
                "status": "processing",
                "created_by": "user-1",
            })
        return FakeQuery()

    def storage(self):
        return self.storage_bucket

    def _storage_from(self, _bucket):
        return self.storage_bucket


class StorageProxy:
    def __init__(self, bucket):
        self.bucket = bucket

    def from_(self, _name):
        return self.bucket


def make_app(monkeypatch):
    fake = FakeSupabase()
    fake.storage = StorageProxy(fake.storage_bucket)
    monkeypatch.setattr(auth, "supabase", fake)
    monkeypatch.setattr(screenings, "supabase", fake)

    app = Flask(__name__)
    app.add_url_rule("/api/screenings", view_func=screenings.create_screening, methods=["POST"])
    app.add_url_rule(
        "/api/screenings/<screening_id>/documents",
        view_func=screenings.upload_document,
        methods=["POST"],
    )
    return app, fake


def test_create_screening_uploads_document(monkeypatch):
    app, fake = make_app(monkeypatch)

    response = app.test_client().post(
        "/api/screenings",
        headers={"Authorization": "Bearer valid-token"},
        data={
            "document_type": "passport",
            "document": (bytes(b"fake-jpeg-data"), "passport.jpg"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["screening_id"] == "VF-2026-000001"
    assert body["data"]["status"] == "processing"
    assert len(fake.storage_bucket.uploads) == 1
    assert fake.storage_bucket.uploads[0][0].startswith("screening-uuid/")


def test_create_screening_rejects_invalid_document_type(monkeypatch):
    app, fake = make_app(monkeypatch)

    response = app.test_client().post(
        "/api/screenings",
        headers={"Authorization": "Bearer valid-token"},
        data={
            "document_type": "identity_card",
            "document": (bytes(b"fake-data"), "document.jpg"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "INVALID_DOCUMENT_TYPE"
    assert fake.storage_bucket.uploads == []


def test_upload_document_rejects_unsupported_file_type(monkeypatch):
    app, _ = make_app(monkeypatch)

    response = app.test_client().post(
        "/api/screenings/screening-uuid/documents",
        headers={"Authorization": "Bearer valid-token"},
        data={
            "document_type": "passport",
            "document": (bytes(b"not-a-document"), "passport.exe"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"
