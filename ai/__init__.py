"""VERIFAI AI processing modules.

The package contains framework-independent processing functions. Flask/backend
orchestration belongs outside this package.
"""

from .ocr import extract_passport
from .validation import validate_passport
from .tampering import analyze_document_tampering
from .face import verify_faces
from .risk import calculate_risk

__all__ = [
    "extract_passport",
    "validate_passport",
    "analyze_document_tampering",
    "verify_faces",
    "calculate_risk",
]
