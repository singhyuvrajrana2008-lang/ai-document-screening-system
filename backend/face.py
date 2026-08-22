"""HTTP endpoint for explicit face verification."""

try:
    from auth import require_auth
    from config import supabase
    from ai_adapter import run_face_verification
except ImportError:
    from backend.auth import require_auth
    from backend.config import supabase
    from backend.ai_adapter import run_face_verification

from flask import g, jsonify, request


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _authorized(screening):
    user_id = getattr(g.current_user, "id", None)
    return screening.get("created_by") == user_id or g.current_role in {"reviewer", "admin"}


@require_auth
def verify_screening_face(screening_id):
    presented = request.files.get("presented_face") or request.files.get("face")
    if presented is None or not presented.filename:
        return _error("INVALID_REQUEST", "presented_face file is required.", 400)

    try:
        screening_response = (
            supabase.table("screenings")
            .select("id, screening_number, created_by, document_type")
            .eq("id", screening_id)
            .maybe_single()
            .execute()
        )
        screening = getattr(screening_response, "data", None)
        if not screening:
            return _error("SCREENING_NOT_FOUND", "Screening not found.", 404)
        if not _authorized(screening):
            return _error("FORBIDDEN", "You are not authorized to verify this screening.", 403)

        document_response = (
            supabase.table("documents")
            .select("id, storage_path, mime_type, document_type")
            .eq("screening_id", screening_id)
            .order("uploaded_at", desc=False)
            .limit(1)
            .execute()
        )
        documents = getattr(document_response, "data", None) or []
        if not documents:
            return _error("DOCUMENT_NOT_FOUND", "Screening document is not available.", 404)
        document = documents[0]

        document_bytes = supabase.storage.from_("identity-documents").download(document["storage_path"])
        presented_bytes = presented.read()
        if not presented_bytes:
            return _error("INVALID_REQUEST", "Presented face file is empty.", 400)

        face = run_face_verification(
            document_bytes,
            presented_bytes,
            document.get("mime_type") or "image/jpeg",
            document.get("document_type") or screening.get("document_type") or "passport",
        )

        existing = (
            supabase.table("face_verifications")
            .select("id")
            .eq("screening_id", screening_id)
            .maybe_single()
            .execute()
        )
        existing_row = getattr(existing, "data", None)
        payload = {
            "screening_id": screening_id,
            "document_id": document["id"],
            "status": face["status"],
            "similarity_score": face.get("similarity_score"),
            "quality_info": face.get("quality_info", {}),
            "failure_reason": face.get("failure_reason"),
        }
        if existing_row:
            supabase.table("face_verifications").update(payload).eq("id", existing_row["id"]).execute()
        else:
            supabase.table("face_verifications").insert(payload).execute()

        return jsonify({
            "success": True,
            "data": {
                "status": face["status"],
                "similarity_score": face.get("similarity_score"),
                "message": face.get("failure_reason") or ("Possible match" if face["status"] == "match" else ""),
            },
        })
    except Exception:
        return _error("INTERNAL_ERROR", "Face verification could not be completed.", 500)
