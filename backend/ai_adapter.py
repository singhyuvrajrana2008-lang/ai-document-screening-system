"""Backend adapter between Supabase document bytes and shared AI modules."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any, Optional

from ai.face import verify_faces
from ai.ocr import extract_passport
from ai.risk import calculate_risk
from ai.tampering import analyze_document_tampering
from ai.validation import validate_passport


def _write_temp(data: bytes, suffix: str) -> Path:
    fd, name = tempfile.mkstemp(prefix="verifai_", suffix=suffix or ".bin")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
    except Exception:
        try:
            os.close(fd)
        except OSError:
            pass
        raise
    return Path(name)


def _suffix(mime_type: str, document_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }.get(mime_type, ".jpg" if document_type == "passport" else ".bin")


def run_ocr(document_bytes: bytes, mime_type: str, document_type: str) -> dict[str, Any]:
    if document_type != "passport":
        return {
            "status": "failed",
            "extracted_data": {},
            "confidence": 0.0,
            "raw_text": "",
            "error": "AI OCR currently supports passport documents only.",
        }

    path = _write_temp(document_bytes, _suffix(mime_type, document_type))
    try:
        result = extract_passport(path)
        return {
            "status": result.get("status", "failed"),
            "extracted_data": result.get("fields", {}),
            "confidence": result.get("confidence", 0.0),
            "raw_text": result.get("raw_text", ""),
        }
    finally:
        path.unlink(missing_ok=True)


def run_validation(ocr_result: dict[str, Any], document_type: str) -> dict[str, Any]:
    if document_type != "passport":
        return {
            "status": "fail",
            "overall_status": "fail",
            "validation_score": 0.0,
            "checks": {"document_type": "unsupported"},
            "issues": ["AI validation currently supports passport documents only."],
        }

    result = validate_passport(ocr_result.get("extracted_data", {}))
    status = result.get("status", "warning")
    return {
        "status": status,
        "overall_status": status,
        "validation_score": result.get("validation_score"),
        "checks": result.get("checks", {}),
        "issues": result.get("issues", []),
    }


def run_tampering(document_bytes: bytes, mime_type: str, document_type: str) -> dict[str, Any]:
    path = _write_temp(document_bytes, _suffix(mime_type, document_type))
    try:
        result = analyze_document_tampering(path)
        return {
            "tampering_detected": result.get("tampering_detected", False),
            "tampering_score": result.get("score", 0.0),
            "indicators": result.get("indicators", []),
            "explanation": result.get("explanation", ""),
            "model_version": "ai/tampering.py",
        }
    finally:
        path.unlink(missing_ok=True)


def run_face_verification(
    document_bytes: bytes,
    presented_face_bytes: Optional[bytes],
    mime_type: str,
    document_type: str,
) -> dict[str, Any]:
    if not presented_face_bytes:
        return {
            "status": "not_required",
            "similarity_score": None,
            "quality_info": {"reason": "No presented face supplied."},
            "failure_reason": None,
        }

    document_path = _write_temp(document_bytes, _suffix(mime_type, document_type))
    face_path = _write_temp(presented_face_bytes, ".jpg")
    try:
        result = verify_faces(document_path, face_path)
        return {
            "status": result.get("status", "uncertain"),
            "similarity_score": result.get("similarity_score"),
            "quality_info": {"message": result.get("message", "")},
            "failure_reason": (
                None
                if result.get("status") == "match"
                else result.get("message")
            ),
        }
    finally:
        document_path.unlink(missing_ok=True)
        face_path.unlink(missing_ok=True)


def run_risk_assessment(
    ocr_result: dict[str, Any],
    validation_result: dict[str, Any],
    tampering_result: dict[str, Any],
    face_result: dict[str, Any],
) -> dict[str, Any]:
    result = calculate_risk(
        ocr_result,
        validation_result,
        tampering_result,
        face_result,
    )
    return {
        "risk_score": result.get("score", 0.0),
        "risk_level": result.get("level", "medium"),
        "contributing_factors": result.get("factors", []),
        "explanation": result.get("explanation", ""),
        "model_version": "ai/risk.py",
    }
