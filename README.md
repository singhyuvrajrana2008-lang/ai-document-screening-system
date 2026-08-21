# VERIFAI — AI Identity & Document Screening System

AI-assisted identity and document screening platform for detecting possible document forgery, tampering, invalid information, and identity mismatch.

> Prototype developed for Smart India Hackathon (SIH).

## 1. Problem

Border checkpoints process large numbers of identity and travel documents. Manual verification can be slow and inconsistent and may fail to identify sophisticated document manipulation.

VERIFAI provides a unified screening workflow:

Document
→ OCR
→ Validation
→ Tampering Detection
→ Face Verification
→ Risk Assessment
→ Human Review

The system assists authorized personnel. It does not make autonomous legal or security decisions.

---

## 2. Core Features

### Document Screening

- Upload passport, visa, ID, licence, or permit
- Process document images through the screening pipeline
- Track screening status

### OCR Extraction

- Extract structured information from documents
- Store OCR confidence
- Support different document types through JSON data

### Document Validation

- Validate document formats
- Validate dates
- Check field consistency
- Check document status against reference data

### Tampering Detection

Analyze documents for possible:

- Photo replacement
- Text manipulation
- Image manipulation
- Stamp anomalies
- Metadata anomalies

The system produces indicators and a tampering score rather than declaring a document definitively fake.

### Face Verification

Where applicable:

- Detect face
- Compare presented face with document photograph
- Produce similarity score
- Flag uncertain or possible mismatches

### Risk Assessment

Combine screening signals into an explainable risk score.

Risk levels:

- LOW
- MEDIUM
- HIGH

### Human Review

Authorized officers can:

- Review screening results
- Approve a case
- Request manual review
- Escalate suspicious cases

### Audit History

Every screening creates an auditable record containing:

- Screening ID
- Officer
- Document
- Risk result
- Review action
- Timestamp

---

## 3. Technology Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Python
- Flask
- REST API

### Database

- Supabase PostgreSQL

### Authentication

- Supabase Auth

### Storage

- Supabase Storage
- Private `identity-documents` bucket

### AI / Computer Vision

AI libraries/models will be selected according to:

- Accuracy
- Available training/sample data
- Hardware requirements
- Runtime performance
- Licensing
- Hackathon implementation time

Do not introduce major frameworks without Team Lead approval.

---

## 4. Repository Structure

```text
ai-document-screening-system/
│
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── .gitignore
├── .env.example
│
├── backend/
│   ├── app.py
│   ├── config.py
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── screenings.py
│   │   └── audit.py
│   │
│   ├── services/
│   │   ├── ocr_service.py
│   │   ├── validation_service.py
│   │   ├── tampering_service.py
│   │   ├── face_service.py
│   │   └── risk_service.py
│   │
│   └── utils/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
│
├── database/
│   └── schema.sql
│
├── tests/
│   ├── test_api.py
│   ├── test_validation.py
│   └── test_risk.py
│
└── docs/