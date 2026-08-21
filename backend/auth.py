"""Supabase access-token verification and request authentication helpers."""

from functools import wraps

from flask import g, jsonify, request

try:
    from config import supabase
except ImportError:
    from backend.config import supabase


def _error_response(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _get_user_from_response(response):
    data = getattr(response, "data", None)
    user = getattr(response, "user", None)
    if user is not None:
        return user
    if isinstance(data, dict):
        return data.get("user")
    return getattr(data, "user", None)


def _user_id(user):
    if isinstance(user, dict):
        return user.get("id")
    return getattr(user, "id", None)


def _load_profile(user_id):
    response = (
        supabase.table("profiles")
        .select("id, officer_id, display_name, role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return getattr(response, "data", None)


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")
        scheme, separator, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not separator or not token.strip():
            return _error_response("UNAUTHORIZED", "Authorization Bearer token is required.", 401)

        try:
            response = supabase.auth.get_user(token.strip())
            user = _get_user_from_response(response)
            user_id = _user_id(user)
            if not user_id:
                return _error_response("UNAUTHORIZED", "Invalid or expired access token.", 401)

            profile = _load_profile(user_id)
            if not profile:
                return _error_response("FORBIDDEN", "Authenticated user profile not found.", 403)

            role = profile.get("role") if isinstance(profile, dict) else getattr(profile, "role", None)
            if role not in {"officer", "reviewer", "admin"}:
                return _error_response("FORBIDDEN", "Authenticated user has an invalid role.", 403)

            g.current_user = user
            g.current_user_id = user_id
            g.current_profile = profile
            g.current_role = role
            return view(*args, **kwargs)
        except Exception:
            return _error_response("UNAUTHORIZED", "Invalid or expired access token.", 401)

    return wrapped
