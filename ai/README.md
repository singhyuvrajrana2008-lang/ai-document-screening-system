# VERIFAI AI modules

These modules are framework-independent processing components for the Flask
screening orchestrator. They do not create HTTP endpoints or write to the
Supabase database.

## Modules

- `ocr.py` — passport OCR adapter + TD3 MRZ parsing.
- `validation.py` — configurable rule-based passport validation.
- `tampering.py` — lightweight, explainable image-forensics indicators.
- `face.py` — face detection and optional verification backend adapter.
- `risk.py` — deterministic, explainable risk aggregation.

## Contract

The functions return dictionaries aligned with `API_CONTRACT.md`:

- OCR: `status`, `confidence`, `fields`
- Validation: `status`, `issues`, `checks`
- Tampering: `status`, `tampering_detected`, `score`, `indicators`, `explanation`
- Face: `status`, `similarity_score`, `message`
- Risk: `score`, `level`, `factors`, `explanation`

No module should claim that an AI signal is definitive proof of fraud.

## Local setup

Install the baseline dependencies from `ai/requirements.txt` and ensure the
Tesseract executable is installed separately on the host. Face verification
can use an optional backend; when it is unavailable the module returns
`uncertain` instead of fabricating a similarity score.

The test suite covers validation, risk aggregation, TD3 MRZ parsing, and
explicit failure behavior for missing OCR, tampering, and face inputs.

GitHub Actions runs the AI test suite on changes to the AI/test paths.
