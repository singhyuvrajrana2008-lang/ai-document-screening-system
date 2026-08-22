from backend import ai_adapter


def test_ocr_adapter_normalizes_ai_result(monkeypatch):
    monkeypatch.setattr(
        ai_adapter,
        "extract_passport",
        lambda path: {"status": "completed", "confidence": 0.91, "fields": {"name": "TEST"}},
    )
    result = ai_adapter.run_ocr(b"fake-image", "image/jpeg", "passport")
    assert result == {
        "status": "completed",
        "extracted_data": {"name": "TEST"},
        "confidence": 0.91,
        "raw_text": "",
    }


def test_validation_adapter_maps_status(monkeypatch):
    monkeypatch.setattr(
        ai_adapter,
        "validate_passport",
        lambda fields: {"status": "warning", "issues": ["x"], "checks": {"expiry": "warning"}},
    )
    result = ai_adapter.run_validation({"extracted_data": {"name": "TEST"}}, "passport")
    assert result["overall_status"] == "warning"
    assert result["issues"] == ["x"]
    assert result["checks"]["expiry"] == "warning"


def test_tampering_adapter_uses_path_based_ai_api(monkeypatch):
    seen = {}

    def fake_analyze(path):
        seen["path"] = path
        return {
            "status": "completed",
            "tampering_detected": True,
            "score": 0.8,
            "indicators": ["editing_software_metadata"],
            "explanation": "review",
        }

    monkeypatch.setattr(ai_adapter, "analyze_document_tampering", fake_analyze)
    result = ai_adapter.run_tampering(b"fake-image", "image/jpeg", "passport")
    assert result["tampering_detected"] is True
    assert result["tampering_score"] == 0.8
    assert seen["path"].exists() is False


def test_face_adapter_without_presented_face_is_not_required(monkeypatch):
    result = ai_adapter.run_face_verification(b"document", None, "image/jpeg", "passport")
    assert result["status"] == "not_required"
    assert result["similarity_score"] is None


def test_risk_adapter_maps_ai_output(monkeypatch):
    monkeypatch.setattr(
        ai_adapter,
        "calculate_risk",
        lambda *args: {"score": 72.5, "level": "high", "factors": ["tampering"], "explanation": "review"},
    )
    result = ai_adapter.run_risk_assessment({}, {}, {}, {})
    assert result == {
        "risk_score": 72.5,
        "risk_level": "high",
        "contributing_factors": ["tampering"],
        "explanation": "review",
        "model_version": "ai/risk.py",
    }
