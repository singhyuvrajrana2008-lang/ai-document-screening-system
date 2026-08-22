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


def _first_row(response):
    rows = getattr(response, "data", None) or []
    return rows[0] if rows else None


def _lookup(screening_id):
    # The frontend uses the public number (VF-YYYY-NNNNNN), while internal
    # callers/tests may use the UUID. Use limit(1) so a missing row never
    # raises the PGRST116 error that maybe_single() can produce.
    response = (
        supabase.table("screenings")
        .select("id, screening_number, status, created_by")
        .eq("screening_number", screening_id)
        .limit(1)
        .execute()
    )
    screening = _first_row(response)
    if screening:
        return screening

    response = (
        supabase.table("screenings")
        .select("id, screening_number, status, created_by")
        .eq("id", screening_id)
        .limit(1)
        .execute()
    )
    return _first_row(response)


def _run_in_background(screening_id, presented_face_bytes=None):
    try:
        run_screening_pipeline(
            screening_id,
            presented_face_bytes=presented_face_bytes,
        )
    except Exception as exc:
        print(
            f"SCREENING PIPELINE ERROR [{screening_id}]: {exc}",
            flush=True,
        )


@require_auth
def run_screening(screening_id):
    try:
        screening = _lookup(screening_id)
    except Exception as exc:
        print(f"SCREENING LOOKUP ERROR [{screening_id}]: {exc}", flush=True)
        return _error("INTERNAL_ERROR", str(exc), 500)

    if not screening:
        return _error("SCREENING_NOT_FOUND", "Screening not found.", 404)

    if (
        screening.get("created_by") != g.current_user_id
        and g.current_role not in {"reviewer", "admin"}
    ):
        return _error(
            "FORBIDDEN",
            "You are not authorized to run this screening.",
            403,
        )

    if screening.get("status") not in {"processing", "failed"}:
        return _error(
            "INVALID_REQUEST",
            f"Screening cannot be run in its current status: {screening.get('status')}",
            400,
        )

    presented_face = getattr(__import__("flask"), "request").files.get("presented_face")
    if presented_face is None:
        presented_face = getattr(__import__("flask"), "request").files.get("face")
    presented_face_bytes = presented_face.read() if presented_face else None

    try:
        (
            supabase.table("screenings")
            .update({"status": "processing"})
            .eq("id", screening["id"])
            .execute()
        )
    except Exception as exc:
        print(
            f"SCREENING STATUS UPDATE ERROR [{screening_id}]: {exc}",
            flush=True,
        )
        return _error("INTERNAL_ERROR", str(exc), 500)

    Thread(
        target=_run_in_background,
        args=(screening["id"], presented_face_bytes),
        daemon=True,
    ).start()

    return jsonify(
        {
            "success": True,
            "data": {
                "screening_id": screening["screening_number"],
                "status": "processing",
            },
        }
    )
