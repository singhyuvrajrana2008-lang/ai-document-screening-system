"""HTTP endpoint for starting the screening pipeline."""

from threading import Thread

from flask import g, jsonify

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


def _lookup(screening_id):
    response = (
        supabase.table("screenings")
        .select("id, screening_number, status, created_by")
        .eq("id", screening_id)
        .maybe_single()
        .execute()
    )
    screening = getattr(response, "data", None)
    if screening:
        return screening
    response = (
        supabase.table("screenings")
        .select("id, screening_number, status, created_by")
        .eq("screening_number", screening_id)
        .maybe_single()
        .execute()
    )
    return getattr(response, "data", None)


def _run_in_background(screening_id):
    try:
        run_screening_pipeline(screening_id)
    except Exception:
        pass


@require_auth
def run_screening(screening_id):
    try:
        screening = _lookup(screening_id)
    except Exception:
        return _error("INTERNAL_ERROR", "Screening lookup failed.", 500)

    if not screening:
        return _error("SCREENING_NOT_FOUND", "Screening not found.", 404)
    if screening.get("created_by") != g.current_user_id and g.current_role not in {"reviewer", "admin"}:
        return _error("FORBIDDEN", "You are not authorized to run this screening.", 403)
    if screening.get("status") not in {"processing", "failed"}:
        return _error("INVALID_REQUEST", "Screening cannot be run in its current status.", 400)

    supabase.table("screenings").update({"status": "processing"}).eq("id", screening["id"]).execute()
    Thread(target=_run_in_background, args=(screening["id"],), daemon=True).start()
    return jsonify({"success": True, "data": {"screening_id": screening["screening_number"], "status": "processing"}})
