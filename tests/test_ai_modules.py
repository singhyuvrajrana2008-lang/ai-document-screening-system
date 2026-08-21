from datetime import date, timedelta

from ai.risk import calculate_risk
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
