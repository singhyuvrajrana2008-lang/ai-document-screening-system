"""End-to-end screening pipeline orchestration."""

from datetime import datetime, timezone

try:
    from ai_adapter import (
        run_face_verification,
        run_ocr,
        run_risk_assessment,
        run_tampering,
        run_validation,
    )
    from config import supabase
except ImportError:
    from backend.ai_adapter import (
        run_face_verification,
        run_ocr,
        run_risk_assessment,
        run_tampering,
        run_validation,
    )
    from backend.config import supabase


BUCKET_NAME = "identity-documents"


def _document_for_screening(screening_id):
    response = (
        supabase.table("documents")
        .select(
            "id, screening_id, document_type, original_filename, "
            "storage_path, mime_type, processing_status"
        )
        .eq("screening_id", screening_id)
        .order("uploaded_at", desc=False)
        .limit(1)
        .execute()
    )
    rows = getattr(response, "data", None) or []
    if not rows:
        raise ValueError("No document is attached to this screening.")
    return rows[0]


def _download_document(storage_path):
    return supabase.storage.from_(BUCKET_NAME).download(storage_path)


def _insert(table, payload):
    response = supabase.table(table).insert(payload).execute()
    rows = getattr(response, "data", None) or []
    if not rows:
        raise RuntimeError(f"{table} insert returned no row")
    return rows[0]


def _set_screening_status(screening_id, status):
    payload = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if status == "completed":
        payload["completed_at"] = datetime.now(timezone.utc).isoformat()
    supabase.table("screenings").update(payload).eq("id", screening_id).execute()


def run_screening_pipeline(screening_id, presented_face_bytes=None):
    """Run OCR -> validation -> tampering -> face -> risk and persist results."""
    document = _document_for_screening(screening_id)
    document_bytes = _download_document(document["storage_path"])
    mime_type = document.get("mime_type") or "application/octet-stream"
    document_type = document["document_type"]

    _set_screening_status(screening_id, "processing")

    try:
        ocr = run_ocr(document_bytes, mime_type, document_type)
        _insert(
            "ocr_results",
            {
                "screening_id": screening_id,
                "document_id": document["id"],
                "extracted_data": ocr.get("extracted_data", {}),
                "confidence": ocr.get("confidence"),
                "raw_text": ocr.get("raw_text", ""),
                "processing_status": ocr.get("status", "failed"),
            },
        )

        validation = run_validation(ocr, document_type)
        _insert(
            "validation_results",
            {
                "screening_id": screening_id,
                "document_id": document["id"],
                "overall_status": validation["overall_status"],
                "validation_score": validation.get("validation_score"),
                "checks": validation.get("checks", {}),
                "issues": validation.get("issues", []),
            },
        )

        tampering = run_tampering(document_bytes, mime_type, document_type)
        _insert(
            "tampering_results",
            {
                "screening_id": screening_id,
                "document_id": document["id"],
                "tampering_detected": tampering.get("tampering_detected", False),
                "tampering_score": tampering.get("tampering_score", 0.0),
                "indicators": tampering.get("indicators", []),
                "model_version": tampering.get("model_version"),
            },
        )

        face = run_face_verification(
            document_bytes,
            presented_face_bytes,
            mime_type,
            document_type,
        )
        _insert(
            "face_verifications",
            {
                "screening_id": screening_id,
                "document_id": document["id"],
                "status": face["status"],
                "similarity_score": face.get("similarity_score"),
                "quality_info": face.get("quality_info", {}),
                "failure_reason": face.get("failure_reason"),
            },
        )

        risk = run_risk_assessment(ocr, validation, tampering, face)
        _insert(
            "risk_assessments",
            {
                "screening_id": screening_id,
                "risk_score": risk["risk_score"],
                "risk_level": risk["risk_level"],
                "contributing_factors": risk.get("contributing_factors", []),
                "explanation": risk.get("explanation"),
                "model_version": risk.get("model_version"),
            },
        )

        supabase.table("documents").update(
            {"processing_status": "processed"}
        ).eq("id", document["id"]).execute()

        _set_screening_status(screening_id, "completed")

    except Exception:
        try:
            supabase.table("documents").update(
                {"processing_status": "failed"}
            ).eq("id", document["id"]).execute()
        finally:
            _set_screening_status(screening_id, "failed")
        raise
