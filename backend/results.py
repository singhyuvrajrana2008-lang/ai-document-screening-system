"""Read-only screening result endpoints."""

from flask import g, jsonify

try:
    from auth import require_auth
    from config import supabase
except ImportError:
    from backend.auth import require_auth
    from backend.config import supabase


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _get_screening(screening_id):
    response = (
        supabase.table("screenings")
        .select("id, screening_number, created_by, document_type, status")
        .eq("id", screening_id)
        .maybe_single()
        .execute()
    )
    screening = getattr(response, "data", None)
    if screening:
        return screening

    response = (
        supabase.table("screenings")
        .select("id, screening_number, created_by, document_type, status")
        .eq("screening_number", screening_id)
        .maybe_single()
        .execute()
    )
    return getattr(response, "data", None)


def _authorized(screening):
    return screening.get("created_by") == g.current_user_id or g.current_role in {"reviewer", "admin"}


def _load_single(table, screening_id, columns="*"):
    response = supabase.table(table).select(columns).eq("screening_id", screening_id).maybe_single().execute()
    return getattr(response, "data", None)


def _get_document(screening_id):
    response = (
        supabase.table("documents")
        .select("id, document_type, original_filename")
        .eq("screening_id", screening_id)
        .order("uploaded_at", desc=False)
        .limit(1)
        .execute()
    )
    rows = getattr(response, "data", None) or []
    return rows[0] if rows else None


def _load_context(screening_id):
    try:
        screening = _get_screening(screening_id)
    except Exception:
        return None, None, _error("INTERNAL_ERROR", "Screening lookup failed.", 500)
    if not screening:
        return None, None, _error("SCREENING_NOT_FOUND", "Screening not found.", 404)
    if not _authorized(screening):
        return None, None, _error("FORBIDDEN", "You are not authorized to view this screening.", 403)
    return screening, _get_document(screening["id"]), None


def _result_or_404(table, screening_id, label):
    try:
        result = _load_single(table, screening_id, label == "Risk" and "*" or "*")
    except Exception:
        return None, _error("INTERNAL_ERROR", f"{label} result lookup failed.", 500)
    if not result:
        return None, _error("RESULT_NOT_FOUND", f"{label} result is not available.", 404)
    return result, None


@require_auth
def get_screening_result(screening_id):
    screening, document, error = _load_context(screening_id)
    if error:
        return error
    if not document:
        return _error("RESULT_NOT_FOUND", "Screening document is not available.", 404)

    actual_id = screening["id"]
    try:
        ocr = _load_single("ocr_results", actual_id)
        validation = _load_single("validation_results", actual_id)
        tampering = _load_single("tampering_results", actual_id)
        face = _load_single("face_verifications", actual_id)
        risk = _load_single("risk_assessments", actual_id)
    except Exception:
        return _error("INTERNAL_ERROR", "Screening result lookup failed.", 500)

    if not all((ocr, validation, tampering, face, risk)):
        return _error("RESULT_NOT_FOUND", "Complete screening result is not available.", 404)

    return jsonify(
        {
            "success": True,
            "data": {
                "screening_id": screening["screening_number"],
                "document": {
                    "document_id": document["id"],
                    "document_type": document["document_type"],
                    "filename": document["original_filename"],
                },
                "ocr": {
                    "status": ocr["processing_status"],
                    "confidence": ocr.get("confidence"),
                    "fields": ocr.get("extracted_data") or {},
                },
                "validation": {
                    "status": validation["overall_status"],
                    "issues": validation.get("issues") or [],
                    "checks": validation.get("checks") or {},
                },
                "tampering": {
                    "status": "completed",
                    "tampering_detected": tampering["tampering_detected"],
                    "score": tampering.get("tampering_score"),
                    "indicators": tampering.get("indicators") or [],
                    "explanation": tampering.get("explanation") or "",
                },
                "face_verification": {
                    "status": face["status"],
                    "similarity_score": face.get("similarity_score"),
                    "message": face.get("failure_reason") or ("Possible match" if face["status"] == "match" else ""),
                },
                "risk": {
                    "score": risk["risk_score"],
                    "level": risk["risk_level"],
                    "factors": risk.get("contributing_factors") or [],
                    "explanation": risk.get("explanation") or "",
                },
                "status": screening["status"],
            },
        }
    )


def _stage_result(screening_id, table, label, serializer):
    screening, _document, error = _load_context(screening_id)
    if error:
        return error
    result, error = _result_or_404(table, screening["id"], label)
    if error:
        return error
    return jsonify({"success": True, "data": serializer(result)})


@require_auth
def get_ocr_result(screening_id):
    return _stage_result(screening_id, "ocr_results", "OCR", lambda r: {"status": r["processing_status"], "confidence": r.get("confidence"), "fields": r.get("extracted_data") or {}})


@require_auth
def get_validation_result(screening_id):
    return _stage_result(screening_id, "validation_results", "Validation", lambda r: {"status": r["overall_status"], "issues": r.get("issues") or [], "checks": r.get("checks") or {}})


@require_auth
def get_tampering_result(screening_id):
    return _stage_result(screening_id, "tampering_results", "Tampering", lambda r: {"status": "completed", "tampering_detected": r["tampering_detected"], "score": r.get("tampering_score"), "indicators": r.get("indicators") or [], "explanation": r.get("explanation") or ""})


@require_auth
def get_risk_result(screening_id):
    return _stage_result(screening_id, "risk_assessments", "Risk", lambda r: {"score": r["risk_score"], "level": r["risk_level"], "factors": r.get("contributing_factors") or [], "explanation": r.get("explanation") or ""})
