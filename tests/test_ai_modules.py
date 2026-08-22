from datetime import date, timedelta

from ai.face import verify_faces
from ai.ocr import _parse_mrz, extract_passport
from ai.risk import calculate_risk
from ai.tampering import analyze_document_tampering
from ai.validation import validate_passport


def test_valid_passport_validation():
    future = date.today() + timedelta(days=365)
    result = validate_passport({
        "name": "ALEX MORGAN",
        "passport_number": "P1234567",
        "nationality": "IND",
        "date_of_birth": "2008-05-12",
        "expiry_date": future.isoformat(),
        "gender": "M",
    })
    assert result["status"] == "pass"
    assert all(value == "pass" for value in result["checks"].values())


def test_invalid_passport_fields_are_explicit():
    result = validate_passport({
        "name": "",
        "passport_number": "bad-number!",
        "nationality": "ZZZ",
        "date_of_birth": "2099-01-01",
        "expiry_date": "2020-01-01",
    })
    assert result["status"] == "fail"
    assert result["issues"]


def test_mrz_parser_extracts_td3_fields():
    result = _parse_mrz([
        "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
        "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    ])
    assert result["name"] == "ERIKSSON ANNA MARIA"
    assert result["passport_number"] == "L898902C3"
    assert result["nationality"] == "UTO"
    assert result["date_of_birth"] == "1974-08-12"
    assert result["expiry_date"] == "2012-04-15"
    assert result["gender"] == "F"


def test_ocr_missing_file_fails_without_fabricating_fields(tmp_path):
    result = extract_passport(tmp_path / "missing.png")
    assert result == {"status": "failed", "confidence": 0.0, "fields": {}}


def test_tampering_missing_file_fails_cleanly(tmp_path):
    result = analyze_document_tampering(tmp_path / "missing.png")
    assert result["status"] == "failed"
    assert result["tampering_detected"] is False
    assert result["score"] == 0.0


def test_face_missing_inputs_are_explicit(tmp_path):
    result = verify_faces(tmp_path / "document.jpg", tmp_path / "presented.jpg")
    assert result["status"] == "face_not_detected"
    assert result["similarity_score"] == 0.0


def test_risk_engine_is_explainable():
    result = calculate_risk(
        {"status": "completed", "confidence": 0.97},
        {"status": "pass", "issues": [], "checks": {}},
        {"status": "completed", "tampering_detected": False, "score": 0.05},
        {"status": "match", "similarity_score": 0.91},
    )
    assert result["level"] == "low"
    assert 0 <= result["score"] <= 100
    assert result["factors"]
    assert result["explanation"]


def test_risk_engine_accepts_backend_adapter_field_names():
    result = calculate_risk(
        {"status": "completed", "confidence": 0.97},
        {"overall_status": "pass", "issues": [], "checks": {}},
        {
            "tampering_detected": False,
            "tampering_score": 0.80,
            "indicators": [],
        },
        {"status": "not_required", "similarity_score": None},
    )
    assert result["level"] == "medium"
    assert result["score"] == 24.0
    assert "Document validation passed" in result["factors"]
