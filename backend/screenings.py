"""Screening creation and document upload operations."""

import hashlib
import os
import uuid

from flask import g, jsonify, request
from werkzeug.utils import secure_filename

from auth import require_auth
from config import supabase

BUCKET_NAME = "identity-documents"
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_DOCUMENT_SIZE_BYTES", 10 * 1024 * 1024))
ALLOWED_DOCUMENT_TYPES = {"passport", "visa", "national_id", "driving_license", "permit"}
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


def _error(code, message, status):
    return jsonify({"success": False, "error": {"code": code, "message": message}}), status


def _file_size(file_storage):
    current = file_storage.stream.tell()
    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(current)
    return size


def _read_file(file_storage):
    file_storage.stream.seek(0)
    data = file_storage.stream.read()
    file_storage.stream.seek(0)
    return data


def _validate_document(document, document_type):
    if document is None or not document.filename:
        return "INVALID_REQUEST", "document file is required.", 400

    if document_type not in ALLOWED_DOCUMENT_TYPES:
        return "INVALID_DOCUMENT_TYPE", "Unsupported document_type.", 400

    filename = secure_filename(document.filename)
    extension = os.path.splitext(filename)[1].lower()
    mime_type = (document.mimetype or "").lower()

    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        return "UNSUPPORTED_FILE_TYPE", "Only JPEG, PNG, and PDF documents are supported.", 400

    expected_extension = ALLOWED_MIME_TYPES[mime_type]
    if extension == ".jpeg":
        extension = ".jpg"
    if extension != expected_extension:
        return "UNSUPPORTED_FILE_TYPE", "File extension does not match its MIME type.", 400

    size = _file_size(document)
    if size > MAX_FILE_SIZE_BYTES:
        return "FILE_TOO_LARGE", "Document exceeds the configured maximum file size.", 400

    return None


def _upload(path, data, mime_type):
    return supabase.storage.from_(BUCKET_NAME).upload(
        path,
        data,
        {"content-type": mime_type, "upsert": False},
    )


def _remove(path):
    try:
        supabase.storage.from_(BUCKET_NAME).remove([path])
    except Exception:
        # Cleanup is best effort; never mask the original database/storage error.
        pass


def _create_document(screening_id, document, document_type):
    validation_error = _validate_document(document, document_type)
    if validation_error:
        return None, validation_error

    filename = secure_filename(document.filename)
    file_data = _read_file(document)
    document_id = str(uuid.uuid4())
    storage_path = f"{screening_id}/{document_id}-{filename}"
    checksum = hashlib.sha256(file_data).hexdigest()

    try:
        _upload(storage_path, file_data, document.mimetype.lower())
    except Exception:
        return None, ("INTERNAL_ERROR", "Document storage upload failed.", 500)

    try:
        response = (
            supabase.table("documents")
            .insert(
                {
                    "id": document_id,
                    "screening_id": screening_id,
                    "document_type": document_type,
                    "original_filename": filename,
                    "storage_path": storage_path,
                    "mime_type": document.mimetype.lower(),
                    "file_size_bytes": len(file_data),
                    "checksum_sha256": checksum,
                    "processing_status": "uploaded",
                }
            )
            .execute()
        )
        rows = getattr(response, "data", None) or []
        if not rows:
            raise RuntimeError("document insert returned no row")
        return rows[0], None
    except Exception:
        _remove(storage_path)
        return None, ("INTERNAL_ERROR", "Document metadata could not be saved.", 500)


def _screening_response(screening, document):
    return jsonify(
        {
            "success": True,
            "data": {
                "screening_id": screening["screening_number"],
                "status": screening["status"],
                "document_id": document["id"],
            },
        }
    )


@require_auth
def create_screening():
    document = request.files.get("document")
    document_type = request.form.get("document_type", "").strip()
    presented_face = request.files.get("presented_face")

    validation_error = _validate_document(document, document_type)
    if validation_error:
        return _error(*validation_error)

    user_id = getattr(g.current_user, "id", None)
    if not user_id:
        return _error("UNAUTHORIZED", "Authenticated user is unavailable.", 401)

    try:
        screening_response = (
            supabase.table("screenings")
            .insert(
                {
                    "created_by": user_id,
                    "document_type": document_type,
                    "status": "processing",
                }
            )
            .execute()
        )
        screening_rows = getattr(screening_response, "data", None) or []
        if not screening_rows:
            raise RuntimeError("screening insert returned no row")
        screening = screening_rows[0]
    except Exception:
        return _error("INTERNAL_ERROR", "Screening could not be created.", 500)

    document_row, error = _create_document(screening["id"], document, document_type)
    if error:
        try:
            supabase.table("screenings").delete().eq("id", screening["id"]).execute()
        except Exception:
            pass
        return _error(*error)

    # presented_face has no persistence column in the authoritative schema.
    # Accepting it here preserves the API contract; face processing will be added
    # in the orchestration stage when its AI input interface is defined.
    _ = presented_face

    return _screening_response(screening, document_row), 201


@require_auth
def upload_document(screening_id):
    document = request.files.get("document")
    document_type = request.form.get("document_type", "").strip()

    try:
        response = (
            supabase.table("screenings")
            .select("id, screening_number, document_type, status, created_by")
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
        return _error("FORBIDDEN", "You are not authorized to modify this screening.", 403)

    if screening.get("status") != "processing":
        return _error("INVALID_REQUEST", "Documents can only be uploaded while screening is processing.", 400)

    document_row, error = _create_document(screening_id, document, document_type)
    if error:
        return _error(*error)

    return jsonify(
        {
            "success": True,
            "data": {
                "document_id": document_row["id"],
                "screening_id": screening["screening_number"],
                "document_type": document_row["document_type"],
                "filename": document_row["original_filename"],
                "status": document_row["processing_status"],
            },
        }
    )
