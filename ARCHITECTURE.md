# System Architecture

## 1. Architecture Overview

The prototype uses a simple layered architecture.

Frontend
    ↓
Backend API
    ↓
Screening Orchestrator
    ↓
AI / Validation Modules
    ↓
Database + File Storage

## 2. Components

### Frontend

Responsible for:

- authentication UI
- document upload
- screening interface
- result display
- screening history
- officer review

The frontend communicates with the backend through the API contract.

### Backend API

Responsible for:

- authentication
- authorization
- request validation
- screening workflow
- database operations
- AI module orchestration
- audit logging

### OCR Module

Input:

Document image

Output:

Structured extracted fields + confidence

### Validation Module

Input:

Extracted document fields

Output:

Validation checks + issues

### Registry Module

Input:

Document identifier

Output:

Simulated registry status

### Tampering Module

Input:

Document image

Output:

Tampering score + indicators

### Face Verification Module

Input:

Document face + presented face

Output:

Match status + similarity/confidence

### Risk Engine

Input:

OCR confidence
Validation results
Registry status
Tampering results
Face verification

Output:

Risk level + score + reasons

### Database

Stores:

- users
- screenings
- documents
- extracted fields
- validation results
- tampering results
- face verification results
- risk assessments
- audit logs

## 3. Golden Path

Frontend
    ↓
POST /api/v1/screenings
    ↓
Backend creates screening
    ↓
Document processing
    ↓
OCR
    ↓
Validation
    ↓
Registry check
    ↓
Tampering detection
    ↓
Face verification
    ↓
Risk engine
    ↓
Screening result
    ↓
Frontend displays result
    ↓
Officer records final action

## 4. Module Independence

AI modules must have clear input/output boundaries.

Do not build one giant AI script containing the entire system.

## 5. External Integrations

External government systems are represented by mock/reference services during the prototype.

The architecture must allow them to be replaced later.

## 6. Security Boundary

Frontend:
- public/client-side code only

Backend:
- secrets
- database credentials
- protected APIs
- AI processing

Never expose backend secrets to the frontend.

## 7. Human-in-the-Loop

AI signals are decision-support information.

AI
→ Evidence
→ Risk
→ Human Review
→ Final Action