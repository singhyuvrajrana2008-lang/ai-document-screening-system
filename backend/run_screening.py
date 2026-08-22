"""HTTP endpoint for starting the screening pipeline."""

from threading import Thread

from flask import g, jsonify, request

try:
    from auth import require_auth
    from config import supabase
    from screening_pipeline import run_screening_pipeline
except ImportError:
    from backend.auth import require_auth
    from backend.config import supabase
    from backend.screening_pipeline import run_screening_pipeline


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _run_in_background(screening_id, presented_face_bytes):
    # The pipeline owns failure handling and marks the screening failed if a
    # stage raises. Do not expose internal exceptions to the HTTP client.
    try:
        run_screening_pipeline(screening_id, presented_face_bytes=presented_face_bytes)
    except Exception:
        pass


@require_auth
def run_screening(screening_id):
    try:
        response = (
            supabase.table("screenings")
            .select("id, screening_number, status, created_by")
            .eq("id", screening_id)
            .maybe_single()
            .execute()
        )
        screening = getattr(response, "data", None)
    except Exception:
        return _error("INTERNAL_ERROR", "Screening lookup failed.", 500)

    if not screening:
        return _error("SCREENING_NOT_FOUND", "Screening not found.", 404)

    user_id = getattr(g.current_user, "id", None)
    if screening.get("created_by") != user_id and g.current_role not in {"reviewer", "admin"}:
        return _error("FORBIDDEN", "You are not authorized to run this screening.", 403)

    if screening.get("status") not in {"processing", "failed"}:
        return _error("INVALID_REQUEST", "Screening cannot be run in its current status.", 400)

    # Accept the optional presented face with the run request. Keeping the
    # bytes in the background worker avoids persisting biometric data.
    presented_face = request.files.get("presented_face") or request.files.get("face")
    presented_face_bytes = presented_face.read() if presented_face else None

    # The API is intentionally asynchronous: the client receives processing
    # immediately, while the five pipeline stages execute and persist results.
    supabase.table("screenings").update({"status": "processing"}).eq("id", screening_id).execute()
    Thread(target=_run_in_background, args=(screening_id, presented_face_bytes), daemon=True).start()

    return jsonify({
        "success": True,
        "data": {
            "screening_id": screening["screening_number"],
            "status": "processing",
        },
    })
