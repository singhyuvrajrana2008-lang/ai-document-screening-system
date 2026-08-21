from types import SimpleNamespace

import backend.screening_pipeline as pipeline


class FakeQuery:
    def __init__(self, table, store):
        self.table_name = table
        self.store = store
        self.payload = None

    def select(self, _columns):
        return self

    def eq(self, _column, _value):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def insert(self, payload):
        self.payload = payload
        return self

    def update(self, payload):
        self.payload = payload
        return self

    def execute(self):
        if self.table_name == "documents" and self.payload is None:
            return SimpleNamespace(data=[self.store["document"]])
        if self.payload is not None:
            self.store["writes"].append((self.table_name, self.payload))
            if self.table_name == "risk_assessments":
                self.store["risk"] = self.payload
            return SimpleNamespace(data=[self.payload])
        return SimpleNamespace(data=[])


class FakeStorage:
    def download(self, _path):
        return b"document-bytes"


class FakeSupabase:
    def __init__(self):
        self.store = {
            "document": {
                "id": "doc-1",
                "screening_id": "screening-1",
                "document_type": "passport",
                "storage_path": "screening-1/doc-1-passport.jpg",
                "mime_type": "image/jpeg",
            },
            "writes": [],
            "risk": None,
        }
        self.storage = FakeStorage()

    def table(self, name):
        return FakeQuery(name, self.store)

    def storage(self):
        return self.storage


def test_pipeline_runs_all_stages_in_order(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(pipeline, "supabase", fake)

    order = []

    def ocr(*_args):
        order.append("ocr")
        return {"extracted_data": {"name": "DEMO"}, "confidence": 0.9, "raw_text": "DEMO"}

    def validation(*_args):
        order.append("validation")
        return {"overall_status": "pass", "validation_score": 0.9, "checks": {}, "issues": []}

    def tampering(*_args):
        order.append("tampering")
        return {"tampering_detected": False, "tampering_score": 0.1, "indicators": [], "model_version": "test"}

    def face(*_args):
        order.append("face")
        return {"status": "not_required", "similarity_score": None, "quality_info": {}, "failure_reason": None}

    def risk(*_args):
        order.append("risk")
        return {"risk_score": 20, "risk_level": "low", "contributing_factors": {}, "explanation": "test", "model_version": "test"}

    monkeypatch.setattr(pipeline, "run_ocr", ocr)
    monkeypatch.setattr(pipeline, "run_validation", validation)
    monkeypatch.setattr(pipeline, "run_tampering", tampering)
    monkeypatch.setattr(pipeline, "run_face_verification", face)
    monkeypatch.setattr(pipeline, "run_risk_assessment", risk)

    pipeline.run_screening_pipeline("screening-1")

    assert order == ["ocr", "validation", "tampering", "face", "risk"]
    written_tables = [table for table, _payload in fake.store["writes"]]
    assert "ocr_results" in written_tables
    assert "validation_results" in written_tables
    assert "tampering_results" in written_tables
    assert "face_verifications" in written_tables
    assert "risk_assessments" in written_tables
    assert any(table == "screenings" and payload["status"] == "completed" for table, payload in fake.store["writes"])


def test_pipeline_marks_screening_failed_when_stage_raises(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(pipeline, "supabase", fake)

    def failing_ocr(*_args):
        raise RuntimeError("OCR unavailable")

    monkeypatch.setattr(pipeline, "run_ocr", failing_ocr)

    try:
        pipeline.run_screening_pipeline("screening-1")
        assert False, "expected pipeline failure"
    except RuntimeError as exc:
        assert str(exc) == "OCR unavailable"

    assert any(table == "screenings" and payload["status"] == "failed" for table, payload in fake.store["writes"])
