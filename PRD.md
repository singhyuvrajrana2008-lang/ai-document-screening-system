# Product Requirements Document
# AI-Based Fake Identity & Document Screening System

## 1. Product Goal

Build a prototype AI-assisted document screening platform that helps authorized personnel analyze identity and travel documents quickly and consistently.

The system will combine:

Document Upload
→ OCR
→ Document Validation
→ Tampering Detection
→ Face Verification
→ Risk Assessment
→ Human Review
→ Audit Record

The system provides decision support. It does not make a definitive legal determination of fraud.

## 2. Target Users

### Primary User
Authorized screening/border personnel.

### Secondary Users
Supervisors and administrators who need screening history, reports, and audit information.

## 3. Core MVP

The primary demonstration must support:

1. Upload a sample identity/travel document.
2. Identify the document type.
3. Extract relevant information using OCR.
4. Validate extracted information.
5. Analyze the document for possible tampering.
6. Compare the document photograph with a presented face where applicable.
7. Calculate an explainable risk assessment.
8. Display the complete result to the officer.
9. Allow the officer to record a final review action.
10. Store the screening and results for later inspection.

## 4. Supported Prototype Documents

The prototype may support:

- Passport
- Visa
- National ID
- Driving licence
- Permit

The first golden-path demo should prioritize the passport workflow.

## 5. Functional Requirements

### FR-01 Authentication

Users must authenticate before accessing screening functionality.

### FR-02 Document Upload

The user can upload a supported document image.

The system must validate:

- file type
- file size
- basic image validity

### FR-03 OCR

The system extracts supported fields from the document.

Example passport fields:

- name
- passport number
- nationality
- date of birth
- expiry date
- gender

OCR confidence should be retained where available.

### FR-04 Document Validation

The system validates extracted information using configurable rules.

Examples:

- field format
- date validity
- expiry status
- nationality code
- cross-field consistency

### FR-05 Registry Validation

The prototype may query a simulated reference registry.

Possible statuses:

- ACTIVE
- EXPIRED
- REVOKED
- BLACKLISTED
- NOT_FOUND

The UI must clearly identify simulated registry data.

### FR-06 Tampering Detection

The system analyzes the document image for possible manipulation.

Possible indicators:

- photo-region anomaly
- text-region manipulation
- copy/paste artifacts
- suspicious image properties
- stamp anomaly

Results must include explainable indicators where possible.

### FR-07 Face Verification

Where applicable, compare the document photograph with a presented face image.

Possible outcomes:

- MATCH
- POSSIBLE_MATCH
- POSSIBLE_MISMATCH
- NO_FACE
- MULTIPLE_FACES
- INSUFFICIENT_QUALITY

### FR-08 Risk Assessment

Combine screening signals into an explainable risk result.

Risk levels:

- LOW
- MEDIUM
- HIGH

The system must show contributing reasons.

### FR-09 Human Review

The officer can record a review action.

Example actions:

- CLEARED
- MANUAL_REVIEW
- ESCALATED

The AI result must not automatically determine the final legal decision.

### FR-10 Audit Trail

Each screening must record:

- screening ID
- user
- timestamp
- document
- OCR result
- validation result
- tampering result
- face verification result
- risk assessment
- final review action

## 6. Non-Functional Requirements

### Performance

The prototype should provide results quickly enough for a live demonstration.

### Security

Secrets must never be committed to source control.

### Privacy

Use synthetic, controlled, or legally permissible sample documents.

### Responsiveness

The frontend should work on desktop and mobile-sized screens.

### Reliability

The golden-path workflow must work consistently during demonstration.

## 7. Prototype / Mock Components

The following may be simulated:

- government registry
- blacklist database
- external government APIs
- production identity infrastructure

The UI must clearly indicate simulated data.

## 8. Out of Scope

The prototype will NOT attempt to implement:

- a real national border-control system
- live government database access
- autonomous legal fraud decisions
- production-scale national infrastructure
- complete integration with every Indian government portal
- massive custom AI model training
- autonomous enforcement decisions

## 9. Success Criteria

The core demo succeeds when a sample passport can be processed through:

Upload
→ OCR
→ Validation
→ Tampering Analysis
→ Face Verification
→ Risk Assessment
→ Officer Review
→ Audit Record

without requiring manual intervention between every module.