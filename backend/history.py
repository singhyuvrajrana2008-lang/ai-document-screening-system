"""Authenticated screening history and live dashboard statistics."""

from flask import g, jsonify, request

try:
    from auth import require_auth
    from config import supabase
except ImportError:
    from backend.auth import require_auth
    from backend.config import supabase


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _parse_positive_int(value, default, maximum=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    if parsed < 1 or (maximum is not None and parsed > maximum):
        return None
    return parsed


@require_auth
def list_screenings():
    page = _parse_positive_int(request.args.get("page", 1), 1)
    limit = _parse_positive_int(request.args.get("limit", 20), 20, 100)
    risk = request.args.get("risk")
    status = request.args.get("status")
    if page is None or limit is None:
        return _error("INVALID_REQUEST", "page must be >= 1 and limit must be between 1 and 100.", 400)
    if risk and risk not in {"low", "medium", "high"}:
        return _error("INVALID_REQUEST", "risk must be low, medium, or high.", 400)
    if status and status not in {"processing", "completed", "manual_review", "approved", "rejected", "failed"}:
        return _error("INVALID_REQUEST", "Invalid screening status.", 400)

    user_id = g.current_user.id
    start = (page - 1) * limit
    end = start + limit - 1
    try:
        query = (
            supabase.table("screenings")
            .select("screening_number, document_type, risk_level, status, final_action, created_at", count="exact")
            .eq("created_by", user_id)
            .order("created_at", desc=True)
            .range(start, end)
        )
        if risk:
            query = query.eq("risk_level", risk)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        items = getattr(response, "data", None) or []
        total = getattr(response, "count", None)
        if total is None:
            total = len(items)

        return jsonify({
            "success": True,
            "data": {
                "items": [
                    {
                        "screening_id": row["screening_number"],
                        "document_type": row["document_type"],
                        "risk_level": row.get("risk_level"),
                        "status": row["status"],
                        "action": row.get("final_action"),
                        "created_at": row["created_at"],
                    }
                    for row in items
                ],
                "page": page,
                "limit": limit,
                "total": total,
            },
        })
    except Exception:
        return _error("INTERNAL_ERROR", "Unable to retrieve screening history.", 500)


@require_auth
def dashboard_stats():
    user_id = g.current_user.id
    try:
        screening_counts = {}
        for level in ("low", "medium", "high"):
            response = (
                supabase.table("screenings")
                .select("id", count="exact")
                .eq("created_by", user_id)
                .eq("risk_level", level)
                .execute()
            )
            screening_counts[level] = getattr(response, "count", None) or 0

        total_response = (
            supabase.table("screenings")
            .select("id", count="exact")
            .eq("created_by", user_id)
            .execute()
        )
        tampering_response = (
            supabase.table("tampering_results")
            .select("id", count="exact")
            .eq("tampering_detected", True)
            .in_("screening_id", _owned_screening_ids(user_id))
            .execute()
        )

        return jsonify({
            "success": True,
            "data": {
                "documents_screened": getattr(total_response, "count", None) or 0,
                "low_risk": screening_counts["low"],
                "medium_risk": screening_counts["medium"],
                "high_risk": screening_counts["high"],
                "tampering_flags": getattr(tampering_response, "count", None) or 0,
            },
        })
    except Exception:
        return _error("INTERNAL_ERROR", "Unable to calculate dashboard statistics.", 500)


def _owned_screening_ids(user_id):
    response = (
        supabase.table("screenings")
        .select("id")
        .eq("created_by", user_id)
        .execute()
    )
    return [row["id"] for row in (getattr(response, "data", None) or [])]
