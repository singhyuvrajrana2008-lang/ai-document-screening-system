import { ScreeningRecord, PresetSampleDoc, MockIntegrationService } from '../types';

export const INITIAL_PRESET_DOCS: PresetSampleDoc[] = [
  {
    id: 'sample-passport-us',
    title: 'US Passport — John Doe (Standard / Low Risk)',
    documentType: 'Passport',
    country: 'USA',
    riskLevel: 'LOW',
    expectedScore: 28,
    description: 'High-resolution biometric passport, valid ICAO 9303 checksum, clean watchlist.',
    ocrData: {
      fullName: 'DOE, JOHN ALEXANDER',
      dob: '1985-04-12',
      expiryDate: '2030-01-01',
      documentNumber: '948271034',
      nationality: 'USA',
      documentType: 'Passport (ICAO Doc 9303)',
      issueDate: '2020-01-01',
      gender: 'M',
      issuingAuthority: 'Department of State'
    },
    contributingFactors: [
      'Document format conforms to known standards',
      'No cryptographic inconsistencies detected',
      'Slight glare on portrait region (within tolerance)'
    ],
    tamperingIndex: 0.42,
    faceMatchScore: 91,
    ocrConfidence: 97,
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    }
  },
  {
    id: 'sample-visa-schengen',
    title: 'Schengen Visa — Elena Rostova (Medium Risk Flag)',
    documentType: 'Visa',
    country: 'EU / FRA',
    riskLevel: 'MEDIUM',
    expectedScore: 64,
    description: 'Multi-entry visa with secondary expiration discrepancy and low contrast font microprint.',
    ocrData: {
      fullName: 'ROSTOVA, ELENA',
      dob: '1992-09-24',
      expiryDate: '2026-11-15',
      documentNumber: 'V-FRA-883910',
      nationality: 'FRA',
      documentType: 'Uniform Schengen Visa (Type C)',
      issueDate: '2024-11-15',
      gender: 'F',
      issuingAuthority: 'Consulat Général'
    },
    contributingFactors: [
      'Font kerning variance detected on line 2 of MRZ zone',
      'Optical variable ink (OVI) reflection is suboptimal under IR',
      'Cross-database registry confirms valid travel authorization'
    ],
    tamperingIndex: 0.68,
    faceMatchScore: 84,
    ocrConfidence: 89,
    validationChecks: {
      mrzValid: true,
      hologramValid: false,
      faceMatchValid: true,
      watchlistClean: true
    }
  },
  {
    id: 'sample-id-flagged',
    title: 'National ID Card — Tampered Portrait / Watchlist Alert (High Risk)',
    documentType: 'ID Card',
    country: 'GBR',
    riskLevel: 'HIGH',
    expectedScore: 88,
    description: 'Severe photo pixelation splice, invalid MRZ parity check digit, possible photo substitution.',
    ocrData: {
      fullName: 'SMITH, MARCUS TYLER',
      dob: '1979-11-03',
      expiryDate: '2025-06-18',
      documentNumber: 'UK-ID-9920194',
      nationality: 'GBR',
      documentType: 'National Citizen ID',
      issueDate: '2015-06-18',
      gender: 'M',
      issuingAuthority: 'Home Office DVLA'
    },
    contributingFactors: [
      'Significant edge boundary noise around primary portrait region',
      'Checksum validation failure on birth date MRZ byte segment',
      'Flagged in Interpol Stolen and Lost Travel Documents (SLTD) database'
    ],
    tamperingIndex: 0.89,
    faceMatchScore: 42,
    ocrConfidence: 74,
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: false
    }
  }
];

export const INITIAL_AUDIT_RECORDS: ScreeningRecord[] = [
  {
    id: 'SCR-00842',
    officerId: 'Officer-018',
    officerName: 'Officer-018',
    documentType: 'Passport (USA)',
    country: 'USA',
    riskScore: 12,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:28:05Z',
    timeDisplay: '14:28',
    ocrConfidence: 97,
    formatValidation: 'PASS',
    formatStandard: 'ICAO DOC 9303',
    tamperingIndex: 0.05,
    faceMatchScore: 99.4,
    contributingFactors: [
      'Cryptographic signature fully validated via PKI CSCA trust chain',
      'Biometric face vector similarity exceeds threshold (>99%)',
      'Zero anomaly index in UV/IR spectral analysis'
    ],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'DOE, JOHN',
      dob: '1985-04-12',
      expiryDate: '2030-01-01',
      documentNumber: '948271034',
      nationality: 'USA',
      documentType: 'Passport (USA)',
      issueDate: '2020-01-01',
      gender: 'M'
    },
    auditTrail: [
      { time: '14:28:05', actor: 'SYSTEM', message: 'Final decision logged: APPROVED.' },
      { time: '14:27:45', actor: 'AI ENGINE', message: 'Face verification match completed (99.4% confidence).' },
      { time: '14:27:42', actor: 'AI ENGINE', message: 'OCR extraction and MRZ validation successful.' },
      { time: '14:27:40', actor: 'OFFICER-018', message: 'Screening initiated. Document uploaded.' }
    ]
  },
  {
    id: 'SCR-00841',
    officerId: 'Officer-011',
    officerName: 'Officer-011',
    documentType: 'Visa',
    country: 'FRA',
    riskScore: 54,
    riskLevel: 'MEDIUM',
    status: 'Pending',
    timestamp: '2026-08-21T14:27:10Z',
    timeDisplay: '14:27',
    ocrConfidence: 91,
    formatValidation: 'FLAG',
    formatStandard: 'EU VISA FORMAT 2020',
    tamperingIndex: 0.48,
    faceMatchScore: 88,
    contributingFactors: [
      'Entry stamp saturation variance detected on prior passport page',
      'Travel itinerary requires officer manual confirmation'
    ],
    validationChecks: {
      mrzValid: true,
      hologramValid: false,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'GARCIA, SOFIA VALENTINA',
      dob: '1990-07-22',
      expiryDate: '2027-08-14',
      documentNumber: 'ESP-984210',
      nationality: 'ESP',
      documentType: 'Schengen Visa Type D',
      gender: 'F'
    },
    auditTrail: [
      { time: '14:27:10', actor: 'OFFICER-011', message: 'Escalated to secondary officer review.' },
      { time: '14:26:50', actor: 'AI ENGINE', message: 'Optical variable ink warning generated.' },
      { time: '14:26:30', actor: 'OFFICER-011', message: 'Document ingested via Flatbed Scanner #3.' }
    ]
  },
  {
    id: 'SCR-00840',
    officerId: 'Officer-012',
    officerName: 'Officer-012',
    documentType: 'Passport',
    country: 'GBR',
    riskScore: 84,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:26:00Z',
    timeDisplay: '14:26',
    ocrConfidence: 78,
    formatValidation: 'FAIL',
    formatStandard: 'ICAO DOC 9303',
    tamperingIndex: 0.82,
    faceMatchScore: 56,
    contributingFactors: [
      'MRZ checksum invalid on composite check digit (byte 44)',
      'Security laminate shows physical delamination pattern',
      'Facial geometry deviates significantly from microchip portrait'
    ],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'ALEXANDER, KEVIN B',
      dob: '1982-03-19',
      expiryDate: '2024-12-31',
      documentNumber: 'GB-55829104',
      nationality: 'GBR',
      documentType: 'Standard Passport',
      gender: 'M'
    },
    auditTrail: [
      { time: '14:26:00', actor: 'SYSTEM', message: 'Auto-rejection enforced: Security Checksum Failure.' },
      { time: '14:25:35', actor: 'AI ENGINE', message: 'Laminate tampering flag triggered (Severity: Critical).' },
      { time: '14:25:10', actor: 'OFFICER-012', message: 'Screening process commenced.' }
    ]
  },
  {
    id: 'SCR-00839',
    officerId: 'Officer-013',
    officerName: 'Officer-013',
    documentType: 'ID Card',
    country: 'DEU',
    riskScore: 18,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:25:00Z',
    timeDisplay: '14:25',
    ocrConfidence: 98,
    formatValidation: 'PASS',
    formatStandard: 'BSI TR-03110',
    tamperingIndex: 0.08,
    faceMatchScore: 96,
    contributingFactors: [
      'RFID chip cryptographically authenticated via EAC2',
      'All security features match German National ID reference specs'
    ],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'MUELLER, THOMAS',
      dob: '1988-12-05',
      expiryDate: '2029-05-19',
      documentNumber: 'DE-T22000129',
      nationality: 'DEU',
      documentType: 'Personalausweis (ID Card)',
      gender: 'M'
    },
    auditTrail: [
      { time: '14:25:00', actor: 'OFFICER-013', message: 'Fast-track gate passage approved.' },
      { time: '14:24:40', actor: 'AI ENGINE', message: 'Chip and visual zone matched perfectly.' }
    ]
  },
  {
    id: 'SCR-00838',
    officerId: 'Officer-014',
    officerName: 'Officer-014',
    documentType: 'Driver License',
    country: 'USA',
    riskScore: 89,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:24:00Z',
    timeDisplay: '14:24',
    ocrConfidence: 65,
    formatValidation: 'FAIL',
    formatStandard: 'AAMVA DL/ID',
    tamperingIndex: 0.94,
    faceMatchScore: 38,
    contributingFactors: [
      'PDF417 2D Barcode payload does not match front OCR text',
      'State seal ultraviolet fluorescence missing'
    ],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: false
    },
    ocrData: {
      fullName: 'WILLIAMS, CHAD',
      dob: '1995-02-14',
      expiryDate: '2026-02-14',
      documentNumber: 'CA-D8829104',
      nationality: 'USA',
      documentType: 'California Driver License',
      gender: 'M'
    },
    auditTrail: [
      { time: '14:24:00', actor: 'OFFICER-014', message: 'Fraud confiscation protocol initiated.' },
      { time: '14:23:45', actor: 'AI ENGINE', message: 'Barcode/Text cryptographic discrepancy confirmed.' }
    ]
  },
  {
    id: 'SCR-00837',
    officerId: 'Officer-010',
    officerName: 'Officer-010',
    documentType: 'Driver License',
    country: 'CAN',
    riskScore: 48,
    riskLevel: 'MEDIUM',
    status: 'Pending',
    timestamp: '2026-08-21T14:23:00Z',
    timeDisplay: '14:23',
    ocrConfidence: 92,
    formatValidation: 'PASS',
    formatStandard: 'CCMTA 2019',
    tamperingIndex: 0.35,
    faceMatchScore: 85,
    contributingFactors: [
      'Minor surface wear around magnetic stripe',
      'Secondary address mismatch with flight manifest'
    ],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'TREMBLAY, JEAN-LUC',
      dob: '1984-06-30',
      expiryDate: '2028-06-30',
      documentNumber: 'QC-T5529104',
      nationality: 'CAN',
      documentType: 'Quebec Permis de Conduire',
      gender: 'M'
    },
    auditTrail: [
      { time: '14:23:00', actor: 'OFFICER-010', message: 'Manual supervisor consultation requested.' }
    ]
  },
  {
    id: 'SCR-00836',
    officerId: 'Officer-011',
    officerName: 'Officer-011',
    documentType: 'Driver License',
    country: 'USA',
    riskScore: 15,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:22:00Z',
    timeDisplay: '14:22',
    ocrConfidence: 99,
    formatValidation: 'PASS',
    formatStandard: 'REAL ID COMPLIANT',
    tamperingIndex: 0.04,
    faceMatchScore: 98,
    contributingFactors: ['REAL ID gold star security feature authenticated'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'JOHNSON, EMILY ROSE',
      dob: '1991-09-18',
      expiryDate: '2029-09-18',
      documentNumber: 'NY-88391024',
      nationality: 'USA',
      documentType: 'New York Enhanced DL',
      gender: 'F'
    },
    auditTrail: [{ time: '14:22:00', actor: 'OFFICER-011', message: 'Automated clearance granted.' }]
  },
  {
    id: 'SCR-00835',
    officerId: 'Officer-012',
    officerName: 'Officer-012',
    documentType: 'Driver License',
    country: 'MEX',
    riskScore: 78,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:21:00Z',
    timeDisplay: '14:21',
    ocrConfidence: 71,
    formatValidation: 'FAIL',
    formatStandard: 'SCT NOM-001',
    tamperingIndex: 0.81,
    faceMatchScore: 50,
    contributingFactors: ['Guilloche pattern irregularities detected along left border'],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'RAMIREZ, CARLOS H',
      dob: '1977-01-20',
      expiryDate: '2025-01-20',
      documentNumber: 'MX-LIC-448102',
      nationality: 'MEX',
      documentType: 'Licencia de Conducir',
      gender: 'M'
    },
    auditTrail: [{ time: '14:21:00', actor: 'OFFICER-012', message: 'Declined due to pattern divergence.' }]
  },
  {
    id: 'SCR-00834',
    officerId: 'Officer-013',
    officerName: 'Officer-013',
    documentType: 'Driver License',
    country: 'AUS',
    riskScore: 58,
    riskLevel: 'MEDIUM',
    status: 'Pending',
    timestamp: '2026-08-21T14:20:00Z',
    timeDisplay: '14:20',
    ocrConfidence: 87,
    formatValidation: 'FLAG',
    formatStandard: 'NSW TRANSPORT SPEC',
    tamperingIndex: 0.44,
    faceMatchScore: 81,
    contributingFactors: ['Card expiry date within 48 hours of transit timestamp'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'HARRIS, LIAM',
      dob: '1989-08-11',
      expiryDate: '2026-08-23',
      documentNumber: 'NSW-9920149',
      nationality: 'AUS',
      documentType: 'NSW Driver License',
      gender: 'M'
    },
    auditTrail: [{ time: '14:20:00', actor: 'OFFICER-013', message: 'Awaiting secondary supervisor acknowledgment.' }]
  },
  {
    id: 'SCR-00833',
    officerId: 'Officer-014',
    officerName: 'Officer-014',
    documentType: 'Driver License',
    country: 'USA',
    riskScore: 22,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:19:00Z',
    timeDisplay: '14:19',
    ocrConfidence: 96,
    formatValidation: 'PASS',
    formatStandard: 'AAMVA DL/ID',
    tamperingIndex: 0.12,
    faceMatchScore: 94,
    contributingFactors: ['Clean state registry confirmation received in 120ms'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'BROWN, RACHEL',
      dob: '1993-04-02',
      expiryDate: '2031-04-02',
      documentNumber: 'TX-49201948',
      nationality: 'USA',
      documentType: 'Texas Driver License',
      gender: 'F'
    },
    auditTrail: [{ time: '14:19:00', actor: 'OFFICER-014', message: 'Standard approval complete.' }]
  },
  {
    id: 'SCR-00832',
    officerId: 'Officer-010',
    officerName: 'Officer-010',
    documentType: 'Driver License',
    country: 'BRA',
    riskScore: 91,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:18:00Z',
    timeDisplay: '14:18',
    ocrConfidence: 62,
    formatValidation: 'FAIL',
    formatStandard: 'CONTRAN 2022',
    tamperingIndex: 0.96,
    faceMatchScore: 31,
    contributingFactors: ['QR Code digitally signed with untrusted certificate'],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: false
    },
    ocrData: {
      fullName: 'SILVA, LUCAS',
      dob: '1981-10-15',
      expiryDate: '2025-05-10',
      documentNumber: 'BR-CNH-002910',
      nationality: 'BRA',
      documentType: 'Carteira Nacional de Habilitação',
      gender: 'M'
    },
    auditTrail: [{ time: '14:18:00', actor: 'OFFICER-010', message: 'Rejected: Cryptographic signature untrusted.' }]
  },
  {
    id: 'SCR-00831',
    officerId: 'Officer-011',
    officerName: 'Officer-011',
    documentType: 'Driver License',
    country: 'JPN',
    riskScore: 45,
    riskLevel: 'MEDIUM',
    status: 'Pending',
    timestamp: '2026-08-21T14:17:00Z',
    timeDisplay: '14:17',
    ocrConfidence: 94,
    formatValidation: 'PASS',
    formatStandard: 'NPA STANDARD 2021',
    tamperingIndex: 0.28,
    faceMatchScore: 82,
    contributingFactors: ['Name transliteration variance requires manual English check'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'TANAKA, KENJI',
      dob: '1986-03-29',
      expiryDate: '2028-03-29',
      documentNumber: 'JP-920194820',
      nationality: 'JPN',
      documentType: 'Japanese Driver License (Gold)',
      gender: 'M'
    },
    auditTrail: [{ time: '14:17:00', actor: 'OFFICER-011', message: 'Escalated for transliteration review.' }]
  },
  {
    id: 'SCR-00830',
    officerId: 'Officer-012',
    officerName: 'Officer-012',
    documentType: 'Driver License',
    country: 'USA',
    riskScore: 19,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:16:00Z',
    timeDisplay: '14:16',
    ocrConfidence: 98,
    formatValidation: 'PASS',
    formatStandard: 'AAMVA DL/ID',
    tamperingIndex: 0.09,
    faceMatchScore: 97,
    contributingFactors: ['All security features validated against Florida DL standard'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'MARTINEZ, ELIZABETH',
      dob: '1996-01-14',
      expiryDate: '2032-01-14',
      documentNumber: 'FL-M49201928',
      nationality: 'USA',
      documentType: 'Florida Driver License',
      gender: 'F'
    },
    auditTrail: [{ time: '14:16:00', actor: 'OFFICER-012', message: 'Clearance approved.' }]
  },
  {
    id: 'SCR-00829',
    officerId: 'Officer-013',
    officerName: 'Officer-013',
    documentType: 'Driver License',
    country: 'IND',
    riskScore: 86,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:15:00Z',
    timeDisplay: '14:15',
    ocrConfidence: 69,
    formatValidation: 'FAIL',
    formatStandard: 'SARATHI PARIVAHAN',
    tamperingIndex: 0.88,
    faceMatchScore: 44,
    contributingFactors: ['Smart chip contact points oxidized/unreadable and font mismatch'],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'SHARMA, ROHIT',
      dob: '1983-09-12',
      expiryDate: '2025-09-12',
      documentNumber: 'IN-DL-04201900',
      nationality: 'IND',
      documentType: 'Indian Smart Card DL',
      gender: 'M'
    },
    auditTrail: [{ time: '14:15:00', actor: 'OFFICER-013', message: 'Rejected: Physical and biometric mismatch.' }]
  },
  {
    id: 'SCR-00828',
    officerId: 'Officer-014',
    officerName: 'Officer-014',
    documentType: 'Driver License',
    country: 'ZAF',
    riskScore: 50,
    riskLevel: 'MEDIUM',
    status: 'Pending',
    timestamp: '2026-08-21T14:14:00Z',
    timeDisplay: '14:14',
    ocrConfidence: 89,
    formatValidation: 'PASS',
    formatStandard: 'ENATIS STANDARD',
    tamperingIndex: 0.39,
    faceMatchScore: 86,
    contributingFactors: ['Document barcode degraded but OCR readable'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'VAN DER MERWE, PIETER',
      dob: '1975-12-01',
      expiryDate: '2027-12-01',
      documentNumber: 'ZA-751201509',
      nationality: 'ZAF',
      documentType: 'South African DL Card',
      gender: 'M'
    },
    auditTrail: [{ time: '14:14:00', actor: 'OFFICER-014', message: 'Pending barcode manual verify.' }]
  },
  {
    id: 'SCR-00827',
    officerId: 'Officer-010',
    officerName: 'Officer-010',
    documentType: 'Driver License',
    country: 'USA',
    riskScore: 16,
    riskLevel: 'LOW',
    status: 'Approved',
    timestamp: '2026-08-21T14:13:00Z',
    timeDisplay: '14:13',
    ocrConfidence: 99,
    formatValidation: 'PASS',
    formatStandard: 'AAMVA DL/ID',
    tamperingIndex: 0.06,
    faceMatchScore: 96,
    contributingFactors: ['Clean state cross-match'],
    validationChecks: {
      mrzValid: true,
      hologramValid: true,
      faceMatchValid: true,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'CLARK, BRANDON',
      dob: '1994-05-17',
      expiryDate: '2030-05-17',
      documentNumber: 'IL-C49201948',
      nationality: 'USA',
      documentType: 'Illinois Driver License',
      gender: 'M'
    },
    auditTrail: [{ time: '14:13:00', actor: 'OFFICER-010', message: 'Standard approval.' }]
  },
  {
    id: 'SCR-00826',
    officerId: 'Officer-011',
    officerName: 'Officer-011',
    documentType: 'Driver License',
    country: 'SGP',
    riskScore: 82,
    riskLevel: 'HIGH',
    status: 'Rejected',
    timestamp: '2026-08-21T14:12:00Z',
    timeDisplay: '14:12',
    ocrConfidence: 73,
    formatValidation: 'FAIL',
    formatStandard: 'SPF TRAFFIC POLICE',
    tamperingIndex: 0.85,
    faceMatchScore: 40,
    contributingFactors: ['Ghost image missing on secondary optical angle'],
    validationChecks: {
      mrzValid: false,
      hologramValid: false,
      faceMatchValid: false,
      watchlistClean: true
    },
    ocrData: {
      fullName: 'LIM, WEI KANG',
      dob: '1987-10-09',
      expiryDate: '2026-10-09',
      documentNumber: 'SG-S8729104F',
      nationality: 'SGP',
      documentType: 'Singapore Driving License',
      gender: 'M'
    },
    auditTrail: [{ time: '14:12:00', actor: 'OFFICER-011', message: 'Security features failed verification.' }]
  }
];

export const INITIAL_MOCK_SERVICES: MockIntegrationService[] = [
  {
    id: 'nat-reg',
    name: 'National Document Registry',
    endpointType: 'MOCK ENDPOINT',
    status: 'ONLINE',
    responseTimeMs: 34,
    lastChecked: 'Just now'
  },
  {
    id: 'visa-reg',
    name: 'Visa Registry',
    endpointType: 'MOCK ENDPOINT',
    status: 'ONLINE',
    responseTimeMs: 52,
    lastChecked: '1 min ago'
  },
  {
    id: 'blacklist-svc',
    name: 'Blacklist Service',
    endpointType: 'SIMULATED BEHAVIOR',
    status: 'SIMULATED',
    responseTimeMs: 18,
    lastChecked: 'Active sync'
  },
  {
    id: 'id-ref',
    name: 'Identity Reference',
    endpointType: 'LOCAL DATASTORE',
    status: 'LOCAL DEMO',
    responseTimeMs: 6,
    lastChecked: 'Cached'
  }
];
