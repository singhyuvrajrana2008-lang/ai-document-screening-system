# VERIFAI API CONTRACT

## 1. Purpose

VERIFAI is an AI-assisted identity and document screening platform.

The API connects:

Frontend
↓
Flask Backend
↓
AI Processing Modules
↓
Supabase Database / Storage

Core pipeline:

Document Upload
→ OCR
→ Validation
→ Tampering Detection
→ Face Verification
→ Risk Assessment
→ Human Review
→ Audit Trail

The API contract is the shared interface between frontend, backend, AI modules, and database.

---

# 2. Base URL

Development:

http://localhost:5000/api

Production URL will be defined later.

---

# 3. Authentication

Authentication is handled using Supabase Auth.

Frontend sends the authenticated user's access token:

Authorization: Bearer <SUPABASE_ACCESS_TOKEN>

The backend verifies the token before allowing protected operations.

The frontend must NEVER receive or use:

SUPABASE_SERVICE_ROLE_KEY

---

# 4. Common Response Format

Successful response:

{
  "success": true,
  "data": {}
}

Error response:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}

---

# 5. Create Screening

## POST /screenings

Creates a new screening session.

### Request

Content-Type:

multipart/form-data

Fields:

document
document_type
presented_face (optional)

Example:

document = passport.jpg
document_type = passport
presented_face = face.jpg

Supported document types:

passport
visa
national_id
driving_license
permit

### Response

HTTP 201

{
  "success": true,
  "data": {
    "screening_id": "SCR-00001",
    "status": "processing",
    "document_id": "DOC-00001"
  }
}

---

# 6. Upload Document

## POST /screenings/{screening_id}/documents

Uploads a document belonging to an existing screening.

### Request

Content-Type:

multipart/form-data

Fields:

document
document_type

### Response

{
  "success": true,
  "data": {
    "document_id": "DOC-00001",
    "screening_id": "SCR-00001",
    "document_type": "passport",
    "filename": "passport.jpg",
    "status": "uploaded"
  }
}

---

# 7. Run Screening

## POST /screenings/{screening_id}/run

Starts the AI screening pipeline.

Pipeline:

Document
→ OCR
→ Validation
→ Tampering
→ Face Verification
→ Risk Assessment

### Request

No body required.

### Response

{
  "success": true,
  "data": {
    "screening_id": "SCR-00001",
    "status": "processing"
  }
}

The frontend should then request the screening result.

---

# 8. Get Screening Result

## GET /screenings/{screening_id}

Returns the complete screening result.

### Response

{
  "success": true,
  "data": {
    "screening_id": "SCR-00001",

    "document": {
      "document_id": "DOC-00001",
      "document_type": "passport",
      "filename": "passport.jpg"
    },

    "ocr": {
      "status": "completed",
      "confidence": 0.97,
      "fields": {
        "name": "ALEX MORGAN",
        "passport_number": "P1234567",
        "nationality": "IND",
        "date_of_birth": "2008-05-12",
        "expiry_date": "2030-05-11",
        "gender": "M"
      }
    },

    "validation": {
      "status": "pass",
      "issues": [],
      "checks": {
        "document_number": "pass",
        "dates": "pass",
        "nationality": "pass",
        "format": "pass"
      }
    },

    "tampering": {
      "status": "completed",
      "tampering_detected": false,
      "score": 0.42,
      "indicators": []
    },

    "face_verification": {
      "status": "match",
      "similarity_score": 0.91,
      "message": "Possible match"
    },

    "risk": {
      "score": 28,
      "level": "low",
      "factors": [
        "No major document anomalies detected"
      ]
    },

    "status": "completed"
  }
}

---

# 9. OCR Result

## GET /screenings/{screening_id}/ocr

Returns OCR extraction results.

### Response

{
  "success": true,
  "data": {
    "status": "completed",
    "confidence": 0.97,
    "fields": {
      "name": "ALEX MORGAN",
      "passport_number": "P1234567",
      "nationality": "IND",
      "date_of_birth": "2008-05-12",
      "expiry_date": "2030-05-11"
    }
  }
}

Important:

OCR fields are returned as structured JSON.

Do NOT create separate API endpoints for every document field.

---

# 10. Validation Result

## GET /screenings/{screening_id}/validation

### Response

{
  "success": true,
  "data": {
    "status": "pass",
    "issues": [],
    "checks": {
      "document_format": "pass",
      "date_validity": "pass",
      "expiry": "pass",
      "nationality": "pass",
      "cross_field_consistency": "pass"
    }
  }
}

---

# 11. Tampering Result

## GET /screenings/{screening_id}/tampering

### Response

{
  "success": true,
  "data": {
    "status": "completed",
    "tampering_detected": false,
    "score": 0.42,
    "indicators": [],
    "explanation": "No strong manipulation indicators detected."
  }
}

Possible indicators:

photo_region_anomaly
text_region_inconsistency
stamp_anomaly
metadata_anomaly
compression_anomaly

These are indicators, NOT definitive proof of fraud.

---

# 12. Face Verification

## POST /screenings/{screening_id}/face

Used when the document type requires face verification.

### Request

Content-Type:

multipart/form-data

Field:

presented_face

Example:

presented_face = face.jpg

### Response

{
  "success": true,
  "data": {
    "status": "match",
    "similarity_score": 0.91,
    "message": "Possible match"
  }
}

Possible statuses:

not_required
face_not_detected
multiple_faces
poor_quality
match
uncertain
mismatch

---

# 13. Risk Assessment

## GET /screenings/{screening_id}/risk

Returns the combined risk assessment.

### Response

{
  "success": true,
  "data": {
    "score": 28,
    "level": "low",
    "factors": [
      "OCR confidence high",
      "Document validation passed",
      "No strong tampering indicators",
      "Face similarity acceptable"
    ],
    "explanation": "No major indicators detected."
  }
}

Risk levels:

low
medium
high

The risk score is decision support.

It is NOT a definitive legal determination that a document or person is fraudulent.

---

# 14. Officer Action

## POST /screenings/{screening_id}/action

Records the authorized officer's final action.

### Request

{
  "action": "approved"
}

Allowed actions:

approved
manual_review
rejected
escalated

### Response

{
  "success": true,
  "data": {
    "screening_id": "SCR-00001",
    "action": "approved",
    "status": "completed"
  }
}

Every action must create an audit log entry.

---

# 15. Audit History

## GET /screenings

Returns screening history for the authenticated user.

### Query parameters

?page=1
&limit=20
&risk=high
&status=manual_review

### Response

{
  "success": true,
  "data": {
    "items": [
      {
        "screening_id": "SCR-00001",
        "document_type": "passport",
        "risk_level": "low",
        "status": "completed",
        "action": "approved",
        "created_at": "2026-08-21T14:28:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

---

# 16. Dashboard Statistics

## GET /dashboard/stats

Returns live dashboard statistics.

### Response

{
  "success": true,
  "data": {
    "documents_screened": 12846,
    "low_risk": 10421,
    "medium_risk": 1824,
    "high_risk": 601,
    "tampering_flags": 318
  }
}

These values must be calculated from database records.

Do NOT create separate dashboard statistics tables.

---

# 17. Health Check

## GET /health

Used to verify that the backend is running.

### Response

{
  "success": true,
  "data": {
    "status": "operational"
  }
}

---

# 18. Error Codes

Possible error codes:

INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
SCREENING_NOT_FOUND
DOCUMENT_NOT_FOUND
INVALID_DOCUMENT_TYPE
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
OCR_FAILED
VALIDATION_FAILED
TAMPERING_ANALYSIS_FAILED
FACE_VERIFICATION_FAILED
RISK_ASSESSMENT_FAILED
PROCESSING_FAILED
INTERNAL_ERROR

---

# 19. File Restrictions

Supported prototype formats:

JPEG
PNG
PDF

Maximum file size should be configured by the backend.

The frontend should display a useful error if the upload is rejected.

---

# 20. Frontend Mapping

The existing VERIFAI frontend maps to the API as follows:

START SCREENING
→ POST /screenings

SELECT FILE
→ multipart document upload

RUN AI SCREENING
→ POST /screenings/{id}/run

OCR EXTRACTION
→ GET /screenings/{id}/ocr

VALIDATION
→ GET /screenings/{id}/validation

TAMPERING ANALYSIS
→ GET /screenings/{id}/tampering

FACE VERIFICATION
→ POST /screenings/{id}/face

RISK ENGINE
→ GET /screenings/{id}/risk

APPROVE & SAVE
→ POST /screenings/{id}/action

AUDIT HISTORY
→ GET /screenings

LIVE DASHBOARD
→ GET /dashboard/stats

---

# 21. Module Ownership

Frontend:

- UI
- file selection
- upload interface
- result visualization
- dashboard
- audit history

Backend:

- authentication verification
- API endpoints
- screening orchestration
- database operations
- storage operations
- risk calculation
- audit logging

OCR module:

Input:
document image

Output:
structured fields + confidence

Validation module:

Input:
OCR fields

Output:
validation status + issues

Tampering module:

Input:
document image

Output:
tampering score + indicators

Face module:

Input:
document face + presented face

Output:
similarity score + status

Risk engine:

Input:
OCR confidence
validation results
tampering results
face verification

Output:
risk score + risk level + explanations

---

# 22. Important Contract Rules

1. Do not rename API fields without Team Lead approval.

2. Do not change endpoint names casually.

3. Do not change database field names to solve frontend problems.

4. Internal variable names may differ between modules.

5. API JSON field names are shared contracts.

6. Backend owns database access.

7. Frontend must not use the Supabase service-role key.

8. AI modules must return structured results.

9. Mock government registries must be clearly identified as mock integrations.

10. Risk scores must be explainable.

11. AI results assist authorized personnel and do not independently determine fraud.

12. All completed screening actions must be auditable.