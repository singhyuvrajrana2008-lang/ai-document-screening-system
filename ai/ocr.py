"""Passport OCR adapter and TD3 MRZ extraction."""
from __future__ import annotations

import os
import re
from datetime import date
from pathlib import Path
from typing import Any

MRZ_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<")


def _empty_result(status: str = "failed") -> dict[str, Any]:
    return {
        "status": status,
        "confidence": 0.0,
        "fields": {},
    }


def _clean_line(line: str) -> str:
    text = re.sub(r"[^A-Z0-9<]", "", line.upper())
    return text.replace("«", "<").replace("‹", "<")


def _mrz_score(line: str) -> int:
    score = 0
    if line.startswith("P<"):
        score += 10
    if len(line) >= 40:
        score += 5
    if len(line) >= 44:
        score += 5
    if any(ch.isdigit() for ch in line):
        score += 2
    if "<" in line:
        score += 2
    return score


def _normalize_mrz_line(line: str, second_line: bool = False) -> str:
    line = _clean_line(line)
    if second_line:
        chars = list(line[:44].ljust(44, "<"))
        for i in range(min(9, len(chars))):
            if chars[i] == "O":
                chars[i] = "0"
        for i in range(13, 19):
            if chars[i] == "O":
                chars[i] = "0"
        for i in range(21, 27):
            if chars[i] == "O":
                chars[i] = "0"
        return "".join(chars)
    return line[:44].ljust(44, "<")


def _parse_mrz(lines: list[str]) -> dict[str, str]:
    """Parse a TD3 passport MRZ from noisy OCR lines."""
    cleaned = [_clean_line(line) for line in lines if line.strip()]

    candidates: list[tuple[int, str]] = []
    for line in cleaned:
        if len(line) >= 36 and set(line) <= MRZ_CHARS:
            candidates.append((_mrz_score(line), line))

    pairs: list[tuple[int, str, str]] = []
    for i, first in enumerate(cleaned):
        if not first.startswith("P<"):
            continue
        for second in cleaned[i + 1 : i + 3]:
            if len(second) >= 36 and set(second) <= MRZ_CHARS:
                pairs.append((_mrz_score(first) + _mrz_score(second), first, second))

    if not pairs:
        long_lines = sorted(candidates, reverse=True)
        if len(long_lines) >= 2:
            pairs.append((long_lines[0][0] + long_lines[1][0], long_lines[0][1], long_lines[1][1]))

    if not pairs:
        return {}

    _, first_raw, second_raw = max(pairs, key=lambda item: item[0])
    first = _normalize_mrz_line(first_raw)
    second = _normalize_mrz_line(second_raw, second_line=True)

    name_part = first[5:44].replace("<", " ").strip()
    names = [part for part in name_part.split() if part]
    surname = names[0] if names else ""
    given = " ".join(names[1:])

    passport_number = second[0:9].replace("<", "")
    nationality = second[10:13].replace("<", "")
    dob = second[13:19]
    gender = second[20:21]
    expiry = second[21:27]

    fields = {
        "name": " ".join(part for part in (surname, given) if part),
        "passport_number": passport_number,
        "nationality": nationality,
        "date_of_birth": _mrz_date(dob, past=True),
        "expiry_date": _mrz_date(expiry, past=False),
        "gender": gender if gender in {"M", "F", "<"} else "",
    }
    return {key: value for key, value in fields.items() if value}


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
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RuntimeError(
            "OCR backend unavailable; install pytesseract and Pillow."
        ) from exc

    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    image = Image.open(image_path).convert("RGB")
    gray = ImageOps.grayscale(image)
    scale = 2 if max(gray.size) < 2400 else 1
    if scale > 1:
        gray = gray.resize((gray.width * scale, gray.height * scale))

    outputs: list[str] = []
    confidences: list[float] = []

    for config in ("--psm 6", "--psm 11"):
        data = pytesseract.image_to_data(
            gray,
            config=config,
            output_type=pytesseract.Output.DICT,
        )
        words: list[str] = []
        local_conf: list[float] = []

        for text, raw_conf in zip(data["text"], data["conf"]):
            text = text.strip()
            try:
                conf = float(raw_conf) / 100.0
            except (TypeError, ValueError):
                continue
            if text and conf >= 0:
                words.append(text)
                local_conf.append(conf)

        if words:
            outputs.append("\n".join(words))
            confidences.extend(local_conf)

    raw_text = "\n".join(outputs)
    confidence = sum(confidences) / len(confidences) if confidences else 0.0
    return raw_text, confidence


def extract_passport(image_path: str | Path) -> dict[str, Any]:
    """Extract passport fields using OCR plus TD3 MRZ parsing."""
    try:
        path = Path(image_path)
        if not path.is_file():
            return _empty_result()

        text, confidence = _ocr_text(path)
        fields = _parse_mrz(text.splitlines())

        if not fields:
            return {
                "status": "failed",
                "confidence": round(max(0.0, min(1.0, confidence)), 4),
                "fields": {},
                "raw_text": text,
            }

        return {
            "status": "completed",
            "confidence": round(max(0.0, min(1.0, confidence)), 4),
            "fields": fields,
            "raw_text": text,
        }
    except Exception as exc:
        print(f"OCR ERROR: {exc}", flush=True)
        return _empty_result()
