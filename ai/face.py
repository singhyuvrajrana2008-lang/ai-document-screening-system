"""Face detection/verification adapter.

The public interface is independent of the face-recognition backend. The
prototype uses OpenCV Haar-cascade detection plus an optional embedding
backend when supplied by the deployment environment.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any


def _failed(status: str, message: str) -> dict[str, Any]:
    return {"status": status, "similarity_score": 0.0, "message": message}


def _detect_faces(path: str | Path):
    import cv2
    image = cv2.imread(str(path))
    if image is None:
        return None, []
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    return image, list(faces)


def verify_faces(document_face: str | Path, presented_face: str | Path) -> dict[str, Any]:
    """Detect one face in each image and compare using a replaceable backend.

    If an embedding backend is unavailable, the function returns ``uncertain``
    rather than inventing a similarity score.
    """
    try:
        _, doc_faces = _detect_faces(document_face)
        _, presented_faces = _detect_faces(presented_face)
    except Exception:
        return _failed("poor_quality", "Face detection backend is unavailable.")

    if not doc_faces or not presented_faces:
        return _failed("face_not_detected", "No usable face detected.")
    if len(doc_faces) > 1 or len(presented_faces) > 1:
        return _failed("multiple_faces", "Expected exactly one face in each image.")

    try:
        from deepface import DeepFace
    except ImportError:
        return _failed("uncertain", "Face detected, but no verification backend is installed.")

    try:
        result = DeepFace.verify(
            img1_path=str(document_face),
            img2_path=str(presented_face),
            enforce_detection=True,
        )
        distance = float(result.get("distance", 1.0))
        threshold = float(result.get("threshold", 0.4))
        similarity = max(0.0, min(1.0, 1.0 - (distance / max(threshold * 2.0, 1e-6))))
        verified = bool(result.get("verified", False))
        status = "match" if verified else ("mismatch" if similarity < 0.35 else "uncertain")
        return {
            "status": status,
            "similarity_score": round(similarity, 4),
            "message": "Possible match" if status == "match" else "Face comparison requires review.",
        }
    except Exception:
        return _failed("poor_quality", "Face comparison could not be completed reliably.")
