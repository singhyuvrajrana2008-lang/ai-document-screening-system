export type ScreenType =
  | 'auth'
  | 'command-center'
  | 'new-screening'
  | 'audit-history'
  | 'security';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ScreeningStatus = 'Completed' | 'Approved' | 'Rejected' | 'Manual Review' | 'Failed' | 'Pending';

export interface ValidationChecks {
  mrzValid: boolean;
  hologramValid: boolean;
  faceMatchValid: boolean;
  watchlistClean: boolean;
}

export interface OCRExtractedData {
  fullName: string;
  dob: string;
  expiryDate: string;
  documentNumber: string;
  nationality: string;
  documentType: string;
  issueDate?: string;
  issuingAuthority?: string;
  gender?: string;
}

export interface AuditTrailEvent {
  time: string;
  actor: string;
  message: string;
  type?: 'system' | 'ai' | 'officer' | 'warning';
}

export interface ScreeningRecord {
  id: string;
  officerId: string;
  officerName: string;
  documentType: string;
  country: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: ScreeningStatus;
  timestamp: string;
  timeDisplay: string;
  ocrConfidence: number;
  formatValidation: 'PASS' | 'FLAG' | 'FAIL';
  formatStandard: string;
  tamperingIndex: number;
  faceMatchScore: number;
  contributingFactors: string[];
  validationChecks: ValidationChecks;
  ocrData: OCRExtractedData;
  auditTrail: AuditTrailEvent[];
  documentImage?: string;
  notes?: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  shortName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  icon: string;
}

export interface PresetSampleDoc {
  id: string;
  title: string;
  documentType: string;
  country: string;
  riskLevel: RiskLevel;
  expectedScore: number;
  description: string;
  ocrData: OCRExtractedData;
  contributingFactors: string[];
  tamperingIndex: number;
  faceMatchScore: number;
  ocrConfidence: number;
  validationChecks: ValidationChecks;
}

export interface MockIntegrationService {
  id: string;
  name: string;
  endpointType: string;
  status: 'ONLINE' | 'SIMULATED' | 'LOCAL DEMO' | 'OFFLINE' | 'DEGRADED';
  responseTimeMs: number;
  lastChecked: string;
}
