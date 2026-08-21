"""Rule-based passport validation."""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Mapping

SUPPORTED_NATIONALITIES = {"IND", "USA", "GBR", "CAN", "AUS", "DEU", "FRA", "JPN", "SGP", "ARE"}


def _parse_date(value: str) -> date | None:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def validate_passport(fields: Mapping[str, Any]) -> dict[str, Any]:
    """Validate extracted passport fields without making a fraud determination."""
    checks = {
        "document_format": "pass",
        "date_validity": "pass",
        "expiry": "pass",
        "nationality": "pass",
        "cross_field_consistency": "pass",
    }
    issues: list[str] = []

    number = str(fields.get("passport_number", "")).strip().upper()
    if not re.fullmatch(r"[A-Z0-9]{6,9}", number):
        checks["document_format"] = "fail"
        issues.append("Passport number has an invalid format.")

    nationality = str(fields.get("nationality", "")).strip().upper()
    if not re.fullmatch(r"[A-Z]{3}", nationality) or nationality not in SUPPORTED_NATIONALITIES:
        checks["nationality"] = "warning"
        issues.append("Nationality code is missing or not in the configured reference list.")

    dob = _parse_date(str(fields.get("date_of_birth", "")))
    expiry = _parse_date(str(fields.get("expiry_date", "")))
    today = date.today()
    if dob is None or expiry is None:
        checks["date_validity"] = "fail"
        issues.append("Date of birth or expiry date is missing/invalid.")
    else:
        if dob > today:
            checks["date_validity"] = "fail"
            issues.append("Date of birth is in the future.")
        if expiry < dob:
            checks["cross_field_consistency"] = "fail"
            issues.append("Expiry date precedes date of birth.")
        if expiry < today:
            checks["expiry"] = "fail"
            issues.append("Document is expired.")

    if not str(fields.get("name", "")).strip():
        checks["cross_field_consistency"] = "warning"
        issues.append("Name is missing from OCR output.")

    if any(value == "fail" for value in checks.values()):
        status = "fail"
    elif issues:
        status = "warning"
    else:
        status = "pass"

    return {"status": status, "issues": issues, "checks": checks}
