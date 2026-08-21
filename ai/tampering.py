"""Explainable image-manipulation indicators for document screening."""
from __future__ import annotations

from pathlib import Path
from typing import Any


def _result(score: float, indicators: list[str], status: str = "completed") -> dict[str, Any]:
    score = round(max(0.0, min(1.0, score)), 4)
    return {
        "status": status,
        "tampering_detected": score >= 0.65,
        "score": score,
        "indicators": indicators,
        "explanation": (
            "Potential manipulation indicators detected; manual review is recommended."
            if indicators else "No strong manipulation indicators detected."
        ),
    }


def analyze_document_tampering(image_path: str | Path) -> dict[str, Any]:
    """Run lightweight forensic signals.

    This is intentionally heuristic. It does not claim to prove tampering and
    should be combined with OCR, validation and human review.
    """
    path = Path(image_path)
    if not path.is_file():
        return _result(0.0, [], "failed")

    indicators: list[str] = []
    score = 0.0
    try:
        from PIL import Image, ImageChops, ImageStat
        image = Image.open(path)
        image.load()

        if image.width < 600 or image.height < 400:
            indicators.append("low_resolution")
            score += 0.10

        # A large EXIF payload can be useful context, but is not itself proof.
        exif = image.getexif()
        if exif:
            software = str(exif.get(305, "")).lower()
            if software and any(x in software for x in ("photoshop", "gimp", "paint.net", "canva")):
                indicators.append("editing_software_metadata")
                score += 0.35

        # JPEG re-saving / inconsistent local noise can create weak evidence.
        if image.format == "JPEG":
            try:
                gray = image.convert("L")
                stat = ImageStat.Stat(gray)
                if stat.stddev[0] < 12:
                    indicators.append("low_texture_variance")
                    score += 0.08
            except Exception:
                pass

        # Avoid treating any single signal as definitive.
        return _result(score, indicators)
    except Exception:
        return _result(0.0, [], "failed")
