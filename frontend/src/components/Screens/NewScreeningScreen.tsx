import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Cpu, 
  RotateCcw, 
  Check, 
  FileText, 
  ShieldCheck, 
  Fingerprint, 
  Smile, 
  CheckCircle2, 
  Gavel, 
  XCircle, 
  Sparkles,
  FileCheck,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { ScreeningRecord, PresetSampleDoc } from '../../types';
import { INITIAL_PRESET_DOCS } from '../../data/mockData';

interface NewScreeningScreenProps {
  onSaveRecord: (record: ScreeningRecord) => void;
  onNavigateToAudit: () => void;
}

export const NewScreeningScreen: React.FC<NewScreeningScreenProps> = ({
  onSaveRecord,
  onNavigateToAudit
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetSampleDoc>(INITIAL_PRESET_DOCS[0]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>('passport_scan_usa_08842.png');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  
  // Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(6); // 0 to 6 (6 means all done)
  const [isCompleted, setIsCompleted] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    { id: 'doc', label: 'DOC ANALYSIS', short: 'DOC' },
    { id: 'ocr', label: 'OCR EXTRACT', short: 'OCR' },
    { id: 'val', label: 'VALIDATION', short: 'VAL' },
    { id: 'tamp', label: 'TAMPERING', short: 'TAMP' },
    { id: 'face', label: 'FACE VERIFY', short: 'FACE' },
    { id: 'risk', label: 'RISK SCORE', short: 'SCORE' }
  ];

  const handleSelectPreset = (preset: PresetSampleDoc) => {
    setSelectedPreset(preset);
    setUploadedFileName(`${preset.documentType.toLowerCase()}_${preset.country.toLowerCase()}_sample.png`);
    setUploadedFilePreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const url = URL.createObjectURL(file);
      setUploadedFilePreview(url);
      
      // Auto-configure sample document based on file name or generic
      setSelectedPreset({
        ...selectedPreset,
        title: `Uploaded: ${file.name}`,
        documentType: file.name.toLowerCase().includes('visa') ? 'Visa' : 'Passport',
        ocrData: {
          ...selectedPreset.ocrData,
          documentNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`
        }
      });
    }
  };

  const handleRunPipeline = () => {
    setIsProcessing(true);
    setIsCompleted(false);
    setCurrentStepIndex(0);

    const stepInterval = 400;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= pipelineSteps.length - 1) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsCompleted(true);
          return pipelineSteps.length;
        }
        return prev + 1;
      });
    }, stepInterval);
  };

  const handleResetPipeline = () => {
    setIsProcessing(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handleActionDecision = (decision: 'Approved' | 'Pending' | 'Rejected') => {
    const newId = `SCR-00${Math.floor(843 + Math.random() * 50)}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newRecord: ScreeningRecord = {
      id: newId,
      officerId: 'Officer-018',
      officerName: 'Officer-018',
      documentType: `${selectedPreset.documentType} (${selectedPreset.country})`,
      country: selectedPreset.country,
      riskScore: selectedPreset.expectedScore,
      riskLevel: selectedPreset.riskLevel,
      status: decision,
      timestamp: now.toISOString(),
      timeDisplay: timeStr,
      ocrConfidence: selectedPreset.ocrConfidence,
      formatValidation: selectedPreset.validationChecks.mrzValid ? 'PASS' : 'FAIL',
      formatStandard: 'ICAO DOC 9303',
      tamperingIndex: selectedPreset.tamperingIndex,
      faceMatchScore: selectedPreset.faceMatchScore,
      contributingFactors: selectedPreset.contributingFactors,
      validationChecks: selectedPreset.validationChecks,
      ocrData: selectedPreset.ocrData,
      auditTrail: [
        {
          time: `${timeStr}:${now.getSeconds().toString().padStart(2, '0')}`,
          actor: 'OFFICER-018',
          message: `Decision recorded: ${decision.toUpperCase()}.`
        },
        {
          time: `${timeStr}:15`,
          actor: 'AI ENGINE',
          message: `Screening score computed: ${selectedPreset.expectedScore}/100 (${selectedPreset.riskLevel} RISK).`
        },
        {
          time: `${timeStr}:00`,
          actor: 'OFFICER-018',
          message: `Ingestion verified for ${uploadedFileName || 'Document'}.`
        }
      ]
    };

    onSaveRecord(newRecord);
    
    if (decision === 'Approved') {
      showToast(`Record ${newId} APPROVED and logged to audit trail.`, 'success');
    } else if (decision === 'Pending') {
      showToast(`Record ${newId} routed to Supervisor Queue for Review.`, 'warning');
    } else {
      showToast(`Record ${newId} REJECTED and alert dispatched to gate.`, 'error');
    }
  };

  // SVG Radial Math
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = selectedPreset.expectedScore;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score <= 35) return '#10B981';
    if (score <= 70) return '#F59E0B';
    return '#F43F5E';
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-150 font-mono text-xs">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed top-14 right-6 z-50 px-4 py-2.5 rounded border shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-right duration-150 ${
          feedbackToast.type === 'success' 
            ? 'bg-[#10B981]/20 border-[#10B981] text-[#A7F3D0]'
            : feedbackToast.type === 'warning'
            ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#FDE68A]'
            : 'bg-[#F43F5E]/20 border-[#F43F5E] text-[#FECDD3]'
        }`}>
          {feedbackToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
          {feedbackToast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />}
          {feedbackToast.type === 'error' && <XCircle className="w-4 h-4 text-[#F43F5E]" />}
          <span className="font-medium">{feedbackToast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-[#10B981] font-bold tracking-wider uppercase">
            VERIFAI / INGESTION &amp; ANALYSIS
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
          DOCUMENT INTELLIGENCE PIPELINE
        </h1>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Upload identity document to run OCR extraction, tamper detection, and biometric matching against security databases.
        </p>
      </div>

      {/* Preset Test Case Selector Pills */}
      <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">PRESET SCENARIOS:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INITIAL_PRESET_DOCS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedPreset.id === preset.id
                  ? 'bg-[#10B981] text-[#09090B] font-bold'
                  : 'bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#3F3F46]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                preset.riskLevel === 'LOW' ? 'bg-[#10B981]' : preset.riskLevel === 'MEDIUM' ? 'bg-[#F59E0B]' : 'bg-[#F43F5E]'
              }`} />
              {preset.documentType} ({preset.country}) — {preset.riskLevel} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Upload & Actions (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Upload Card */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 flex flex-col relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                DATA INGESTION
              </span>
              <span className="text-[10px] text-[#71717A]">
                FLATBED / LIVE
              </span>
            </div>

            {/* Dropzone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#3F3F46] rounded-md bg-[#09090B] p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-[#10B981] transition-colors cursor-pointer group min-h-[190px]"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
              />

              <div className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center group-hover:border-[#10B981] transition-colors">
                <UploadCloud className="w-5 h-5 text-[#71717A] group-hover:text-[#10B981] transition-colors" />
              </div>

              <div>
                <span className="text-xs font-semibold text-white block mb-0.5">
                  Upload Identity Document
                </span>
                <span className="text-[11px] text-[#71717A]">
                  Drag &amp; drop or click to browse
                </span>
              </div>

              {uploadedFileName && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#27272A] border border-[#3F3F46] rounded text-[11px] text-white">
                  <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="truncate max-w-[180px]">{uploadedFileName}</span>
                </div>
              )}

              <div className="text-[10px] text-[#71717A] border border-[#27272A] rounded px-2 py-0.5 bg-[#18181B]">
                ICAO 9303 COMPLIANT FORMATS
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-[#27272A] border border-[#3F3F46] text-white font-medium text-xs py-2 rounded hover:bg-[#3F3F46] transition-colors tracking-wider cursor-pointer"
              >
                SELECT LOCAL FILE
              </button>
            </div>
          </div>

          {/* Command Actions Card */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 flex flex-col gap-2.5">
            <button 
              onClick={handleRunPipeline}
              disabled={isProcessing}
              className="w-full bg-[#10B981] text-[#09090B] text-xs font-bold tracking-wider uppercase py-2.5 rounded hover:bg-[#34D399] transition-colors flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <Cpu className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'SCANNING PIPELINE...' : 'RUN AI SCREENING'}
            </button>

            <button 
              onClick={handleResetPipeline}
              className="w-full bg-[#09090B] border border-[#27272A] text-[#A1A1AA] hover:text-white text-xs font-medium tracking-wider uppercase py-2 rounded hover:bg-[#27272A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#71717A]" />
              RESET PIPELINE
            </button>
          </div>
        </div>

        {/* Right Column: Pipeline & Results (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Pipeline Stepper Card */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                PROCESSING PIPELINE
              </span>
              <span className="text-[10px] text-[#10B981] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                {isProcessing ? 'PROCESSING' : isCompleted ? 'VERIFIED' : 'READY'}
              </span>
            </div>

            {/* Stepper Bar */}
            <div className="flex items-center justify-between w-full relative px-2">
              {/* Line Backdrop */}
              <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-[#27272A] z-0"></div>

              {pipelineSteps.map((step, idx) => {
                const isStepCompleted = currentStepIndex > idx;
                const isStepActive = currentStepIndex === idx;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 relative bg-[#18181B] px-1">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isStepCompleted
                          ? 'bg-[#27272A] text-white border border-[#3F3F46]'
                          : isStepActive
                          ? 'border-2 border-[#10B981] bg-[#09090B] text-[#10B981]'
                          : 'border border-[#27272A] bg-[#09090B] text-[#52525B]'
                      }`}
                    >
                      {isStepCompleted ? (
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : isStepActive ? (
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></div>
                      ) : (
                        <span className="text-[10px]">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-[9px] tracking-wider font-bold text-center ${
                      isStepCompleted 
                        ? 'text-white' 
                        : isStepActive 
                        ? 'text-[#10B981]' 
                        : 'text-[#52525B]'
                    }`}>
                      {step.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result Metric Cards (4 Bento cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. OCR EXTRACTION */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#10B981]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                  OCR EXTRACTION
                </span>
                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {selectedPreset.ocrConfidence}%
                  </span>
                  <span className="text-[10px] text-[#10B981] font-medium">
                    HIGH CONFIDENCE
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A] truncate max-w-[120px]">
                  {selectedPreset.ocrData.fullName}
                </span>
              </div>
            </div>

            {/* 2. FORMAT VALIDATION */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#3F3F46]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                  FORMAT VALIDATION
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#A1A1AA]" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${
                    selectedPreset.validationChecks.mrzValid ? 'text-[#10B981]' : 'text-[#F43F5E]'
                  }`}>
                    {selectedPreset.validationChecks.mrzValid ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    ICAO DOC 9303
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A]">
                  MRZ CHECKSUM
                </span>
              </div>
            </div>

            {/* 3. TAMPERING ANALYSIS */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#F59E0B]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                  TAMPERING ANALYSIS
                </span>
                <Fingerprint className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {selectedPreset.tamperingIndex}
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    ANOMALY INDEX
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A]">
                  ELA FORENSIC
                </span>
              </div>
            </div>

            {/* 4. FACE VERIFICATION */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#27272A]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                  FACE VERIFICATION
                </span>
                <Smile className="w-3.5 h-3.5 text-[#A1A1AA]" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {selectedPreset.faceMatchScore}%
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    LIVENESS MATCH
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A]">
                  BIOMETRIC V3
                </span>
              </div>
            </div>
          </div>

          {/* Final Risk Assessment Card */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 flex flex-col md:flex-row gap-5">
            {/* Left: Circular Radial Score */}
            <div className="flex flex-col items-center justify-center min-w-[130px]">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Background circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r={radius}
                    stroke="#27272A"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    style={{
                      stroke: getScoreColor(selectedPreset.expectedScore),
                      strokeDasharray: circumference,
                      strokeDashoffset: isCompleted ? strokeDashoffset : circumference,
                      transition: 'stroke-dashoffset 0.8s ease-out'
                    }}
                    cx="50"
                    cy="50"
                    fill="none"
                    r={radius}
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="flex flex-col items-center z-10">
                  <span 
                    className="text-2xl font-bold leading-none text-white"
                  >
                    {selectedPreset.expectedScore}
                  </span>
                  <span className="text-[9px] text-[#71717A] mt-0.5">/ 100</span>
                </div>
              </div>

              <span 
                className="text-[10px] font-bold tracking-wider mt-2 px-2.5 py-0.5 rounded border"
                style={{
                  color: getScoreColor(selectedPreset.expectedScore),
                  borderColor: `${getScoreColor(selectedPreset.expectedScore)}50`,
                  backgroundColor: `${getScoreColor(selectedPreset.expectedScore)}15`
                }}
              >
                {selectedPreset.riskLevel} RISK
              </span>
            </div>

            {/* Right: Contributing Factors & Decisions */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase block mb-2">
                  CONTRIBUTING RISK FACTORS
                </span>
                <ul className="space-y-1.5">
                  {selectedPreset.contributingFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#A1A1AA]">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        idx === 0 ? 'bg-[#10B981]' : idx === 1 ? 'bg-[#F59E0B]' : 'bg-[#71717A]'
                      }`} />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4 border-t border-[#27272A] pt-3">
                <button 
                  onClick={() => handleActionDecision('Approved')}
                  className="bg-[#10B981] hover:bg-[#34D399] text-[#09090B] text-xs font-bold px-3 py-1.5 rounded transition-colors tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  APPROVE &amp; SAVE
                </button>

                <button 
                  onClick={() => handleActionDecision('Pending')}
                  className="bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Gavel className="w-3.5 h-3.5 text-[#F59E0B]" />
                  MANUAL REVIEW
                </button>

                <button 
                  onClick={() => handleActionDecision('Rejected')}
                  className="bg-transparent hover:bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 text-xs font-medium px-3 py-1.5 rounded transition-colors tracking-wider ml-auto flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  REJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

