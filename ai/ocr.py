"""Passport OCR adapter and MRZ extraction.

OCR itself is intentionally an adapter: the module does not fabricate fields
when a recognition backend is unavailable. The default implementation uses
pytesseract when installed and then extracts/normalizes the passport MRZ.
"""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from typing import Any


MRZ_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<")


def _empty_result(status: str = "failed") -> dict[str, Any]:
    return {"status": status, "confidence": 0.0, "fields": {}}


def _clean_line(line: str) -> str:
    return re.sub(r"[^A-Z0-9<]", "", line.upper())


def _parse_mrz(lines: list[str]) -> dict[str, str]:
    """Parse a TD3 passport MRZ (two 44-character lines)."""
    candidates = [_clean_line(x) for x in lines]
    candidates = [x for x in candidates if len(x) >= 40 and set(x) <= MRZ_CHARS]
    if len(candidates) < 2:
        return {}
    # Prefer a P<... first line and a numeric/angle-bracket second line.
    for i in range(len(candidates) - 1):
        first, second = candidates[i], candidates[i + 1]
        if first.startswith("P<") and len(second) >= 38:
            first, second = first[:44].ljust(44, "<"), second[:44].ljust(44, "<")
            name_part = first[5:44].replace("<", " ").strip()
            names = [x for x in name_part.split() if x]
            surname = names[0] if names else ""
            given = " ".join(names[1:])
            passport_number = second[0:9].replace("<", "")
            nationality = second[10:13].replace("<", "")
            dob = second[13:19]
            gender = second[20:21]
            expiry = second[21:27]
            fields = {
                "name": " ".join(x for x in (surname, given) if x),
                "passport_number": passport_number,
                "nationality": nationality,
                "date_of_birth": _mrz_date(dob, past=True),
                "expiry_date": _mrz_date(expiry, past=False),
                "gender": gender if gender in {"M", "F", "<"} else "",
            }
            return {k: v for k, v in fields.items() if v}
    return {}


def _mrz_date(value: str, past: bool) -> str:
    if not re.fullmatch(r"\d{6}", value):
        return ""
    yy, mm, dd = int(value[:2]), int(value[2:4]), int(value[4:6])
    current_yy = date.today().year % 100
    year = 2000 + yy
    if past and yy > current_yy:
        year -= 100
    if not past and yy < current_yy - 20:
        year += 100
    try:
        return date(year, mm, dd).isoformat()
    except ValueError:
        return ""


def _ocr_text(image_path: str | Path) -> tuple[str, float]:
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("OCR backend unavailable; install pytesseract and Pillow") from exc

    image = Image.open(image_path)
    data = pytesseract.image_to_data(image, config="--psm 6", output_type=pytesseract.Output.DICT)
    words: list[str] = []
    confidences: list[float] = []
    for text, raw_conf in zip(data["text"], data["conf"]):
        text = text.strip()
        try:
            conf = float(raw_conf) / 100.0
        except (TypeError, ValueError):
            continue
        if text and conf >= 0:
            words.append(text)
            confidences.append(conf)
    return "\n".join(words), (sum(confidences) / len(confidences) if confidences else 0.0)


def extract_passport(image_path: str | Path) -> dict[str, Any]:
    """Extract passport fields from an image using OCR + MRZ parsing."""
    try:
        path = Path(image_path)
        if not path.is_file():
            return _empty_result()
        text, confidence = _ocr_text(path)
        fields = _parse_mrz(text.splitlines())
        if not fields:
            return {"status": "failed", "confidence": round(max(0.0, confidence), 4), "fields": {}}
        return {
            "status": "completed",
            "confidence": round(max(0.0, min(1.0, confidence)), 4),
            "fields": fields,
        }
    except Exception:
        return _empty_result()
