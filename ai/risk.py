"""Explainable risk aggregation."""
from __future__ import annotations

from typing import Any, Mapping


def calculate_risk(
    ocr: Mapping[str, Any],
    validation: Mapping[str, Any],
    tampering: Mapping[str, Any],
    face: Mapping[str, Any] | None = None,
    registry: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Aggregate pipeline signals into a deterministic 0-100 decision-support score.

    Accepts both the public AI contract names (``status``, ``score``) and the
    backend persistence names (``overall_status``, ``tampering_score``). This
    keeps the risk engine usable directly and through ``backend.ai_adapter``.
    """
    score = 0.0
    factors: list[str] = []

    ocr_conf = float(ocr.get("confidence", 0.0) or 0.0)
    ocr_status = str(ocr.get("status", "failed"))
    if ocr_status != "completed":
        score += 25
        factors.append("OCR did not complete successfully")
    elif ocr_conf < 0.70:
        score += 20
        factors.append("OCR confidence is low")
    elif ocr_conf < 0.85:
        score += 10
        factors.append("OCR confidence is moderate")
    else:
        factors.append("OCR confidence high")

    # Backend adapter uses overall_status; direct callers use status.
    validation_status = str(
        validation.get("status", validation.get("overall_status", "warning"))
    ).lower()
    if validation_status == "fail":
        score += 30
        factors.append("Document validation failed one or more checks")
    elif validation_status == "warning":
        score += 12
        factors.append("Document validation produced warnings")
    elif validation_status == "pass":
        factors.append("Document validation passed")
    else:
        score += 12
        factors.append("Document validation status is unavailable")

    # Backend adapter uses tampering_score; direct callers use score.
    tamper_score = float(
        tampering.get("score", tampering.get("tampering_score", 0.0)) or 0.0
    )
    score += max(0.0, min(1.0, tamper_score)) * 30
    if tampering.get("tampering_detected"):
        factors.append("Potential document manipulation indicators detected")
    else:
        factors.append("No strong tampering indicators")

    if face:
        face_status = str(face.get("status", "uncertain"))
        similarity = float(face.get("similarity_score", 0.0) or 0.0)
        if face_status == "mismatch":
            score += 25
            factors.append("Face comparison indicates a possible mismatch")
        elif face_status in {"face_not_detected", "multiple_faces", "poor_quality", "uncertain"}:
            score += 10
            factors.append("Face verification could not establish a reliable match")
        elif face_status == "match":
            if similarity >= 0.80:
                factors.append("Face similarity acceptable")
            else:
                score += 8
                factors.append("Face match is below the preferred confidence threshold")
        elif face_status == "not_required":
            factors.append("Face verification was not requested")

    if registry:
        registry_status = str(registry.get("status", "unknown")).lower()
        if registry_status in {"revoked", "blacklisted"}:
            score += 40
            factors.append(f"Reference registry status: {registry_status}")
        elif registry_status == "expired":
            score += 20
            factors.append("Reference registry reports the document as expired")
        elif registry_status == "active":
            factors.append("Reference registry status is active")
        else:
            factors.append("Reference registry status is unavailable or unknown")

    score = round(min(100.0, max(0.0, score)), 2)
    level = "low" if score < 35 else ("medium" if score < 65 else "high")
    explanation = "No major indicators detected." if level == "low" else (
        "Some indicators require additional officer review." if level == "medium"
        else "Multiple significant indicators are present; manual review is recommended."
    )
    return {"score": score, "level": level, "factors": factors, "explanation": explanation}
