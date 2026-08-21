"""Supabase access-token verification and request authentication helpers."""

from functools import wraps

from flask import g, jsonify, request

from config import supabase


def _error_response(code, message, status):
    """Return the API contract's standard error envelope."""
    return jsonify(
        {
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        }
    ), status


def _get_user_from_response(response):
    """Extract the verified user from the Supabase Python response."""
    user = getattr(response, "user", None)
    if user is not None:
        return user

    data = getattr(response, "data", None)
    if data is not None:
        user = getattr(data, "user", None)
        if user is not None:
            return user
        if isinstance(data, dict):
            return data.get("user")

    if isinstance(response, dict):
        return response.get("user")

    return None


def _user_id(user):
    """Read a Supabase user id from either an object or mapping response."""
    if isinstance(user, dict):
        return user.get("id")
    return getattr(user, "id", None)


def _load_profile(user_id):
    """Load the application's profile row for a verified Auth user."""
    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return getattr(response, "data", None)


def require_auth(view):
    """Require a valid Supabase Bearer token and attach user/profile/role to ``g``.

    Protected routes should use this decorator. The Supabase Auth server validates
    the access token; the service-role database client is then used only to load
    the application's ``profiles`` row.
    """

    @wraps(view)
    def wrapped(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")
        scheme, separator, token = authorization.partition(" ")

        if scheme.lower() != "bearer" or not separator or not token.strip():
            return _error_response(
                "UNAUTHORIZED",
                "Authorization Bearer token is required.",
                401,
            )

        token = token.strip()

        try:
            response = supabase.auth.get_user(token)
            user = _get_user_from_response(response)
            user_id = _user_id(user)

            if not user or not user_id:
                return _error_response(
                    "UNAUTHORIZED",
                    "Invalid or expired access token.",
                    401,
                )

            profile = _load_profile(user_id)
            if not profile:
                return _error_response(
                    "FORBIDDEN",
                    "Authenticated user profile not found.",
                    403,
                )

            role = profile.get("role") if isinstance(profile, dict) else getattr(profile, "role", None)
            if not role:
                return _error_response(
                    "FORBIDDEN",
                    "Authenticated user profile has no role.",
                    403,
                )

            g.current_user = user
            g.current_profile = profile
            g.current_role = role
            return view(*args, **kwargs)

        except Exception:
            # Do not expose Supabase/Auth exception details or token material.
            return _error_response(
                "UNAUTHORIZED",
                "Invalid or expired access token.",
                401,
            )

    return wrapped
