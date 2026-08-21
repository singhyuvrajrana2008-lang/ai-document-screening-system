"""Officer final-action endpoint and append-only audit logging."""

from datetime import datetime, timezone

from flask import g, jsonify, request

try:
    from auth import require_auth
    from config import supabase
except ImportError:
    from backend.auth import require_auth
    from backend.config import supabase

ALLOWED_ACTIONS = {"approved", "manual_review", "rejected", "escalated"}


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _lookup(screening_id):
    response = (
        supabase.table("screenings")
        .select("id, screening_number, created_by, status")
        .eq("id", screening_id)
        .maybe_single()
        .execute()
    )
    screening = getattr(response, "data", None)
    if screening:
        return screening
    response = (
        supabase.table("screenings")
        .select("id, screening_number, created_by, status")
        .eq("screening_number", screening_id)
        .maybe_single()
        .execute()
    )
    return getattr(response, "data", None)


@require_auth
def officer_action(screening_id):
    payload = request.get_json(silent=True) or {}
    action = payload.get("action")
    if action not in ALLOWED_ACTIONS:
        return _error("INVALID_REQUEST", "action must be approved, manual_review, rejected, or escalated.", 400)

    user_id = g.current_user_id
    try:
        screening = _lookup(screening_id)
        if not screening:
            return _error("SCREENING_NOT_FOUND", "Screening not found.", 404)
        if screening["created_by"] != user_id and g.current_role not in {"reviewer", "admin"}:
            return _error("FORBIDDEN", "You are not authorized to act on this screening.", 403)

        previous_status = screening["status"]
        status = (
            "completed" if action == "approved"
            else "manual_review" if action in {"manual_review", "escalated"}
            else "rejected"
        )
        now = datetime.now(timezone.utc).isoformat()
        final_action = "manual_review" if action == "escalated" else action

        update_response = (
            supabase.table("screenings")
            .update(
                {
                    "final_action": final_action,
                    "status": status,
                    "reviewed_by": user_id,
                    "reviewed_at": now,
                }
            )
            .eq("id", screening["id"])
            .execute()
        )
        if not getattr(update_response, "data", None):
            return _error("UPDATE_FAILED", "Unable to update screening action.", 500)

        audit_response = (
            supabase.table("audit_logs")
            .insert(
                {
                    "screening_id": screening["id"],
                    "actor_id": user_id,
                    "action": action,
                    "previous_status": previous_status,
                    "new_status": status,
                    "metadata": {"source": "officer_action"},
                }
            )
            .execute()
        )
        if not getattr(audit_response, "data", None):
            return _error("AUDIT_LOG_FAILED", "Action could not be recorded in the audit log.", 500)

        return jsonify({"success": True, "data": {"screening_id": screening["screening_number"], "action": action, "status": status}})
    except Exception:
        return _error("INTERNAL_ERROR", "Unable to record officer action.", 500)
