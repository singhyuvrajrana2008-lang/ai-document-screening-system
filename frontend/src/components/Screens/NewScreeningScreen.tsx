import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, FileText, Loader2, RotateCcw, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { ScreeningRecord } from '../../types';
import { createScreening, getScreening, runScreening, submitOfficerAction } from '../../services/api';

interface Props { onSaveRecord: (record: ScreeningRecord) => void; onNavigateToAudit: () => void; }
type DocType = 'passport' | 'visa' | 'national_id' | 'driving_license' | 'permit';
const labels: Record<DocType, string> = { passport: 'Passport', visa: 'Visa', national_id: 'National ID', driving_license: 'Driving Licence', permit: 'Permit' };
const steps = ['DOCUMENT', 'OCR', 'VALIDATION', 'TAMPERING', 'FACE VERIFY', 'RISK SCORE'];

function mapResult(data: any): ScreeningRecord {
  const risk = String(data.risk?.level || 'low').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
  const validation = String(data.validation?.status || 'warning').toLowerCase();
  const faceStatus = String(data.face_verification?.status || 'uncertain');
  const created = new Date().toISOString();
  const fields = data.ocr?.fields || {};
  return { id: String(data.screening_id), officerId: 'CURRENT-USER', officerName: 'Current Officer', documentType: String(data.document?.document_type || 'unknown'), country: String(fields.nationality || '—'), riskScore: Number(data.risk?.score || 0), riskLevel: risk, status: data.status === 'rejected' ? 'Rejected' : data.status === 'approved' ? 'Approved' : 'Pending', timestamp: created, timeDisplay: new Date(created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ocrConfidence: Number(data.ocr?.confidence || 0) * 100, formatValidation: validation === 'pass' ? 'PASS' : validation === 'fail' ? 'FAIL' : 'FLAG', formatStandard: 'ICAO DOC 9303', tamperingIndex: Number(data.tampering?.score || 0) * 100, faceMatchScore: Number(data.face_verification?.similarity_score || 0) * 100, contributingFactors: Array.isArray(data.risk?.factors) ? data.risk.factors.map(String) : [], validationChecks: { mrzValid: validation === 'pass', hologramValid: validation === 'pass', faceMatchValid: faceStatus === 'match', watchlistClean: true }, ocrData: { fullName: String(fields.name || '—'), dob: String(fields.date_of_birth || '—'), expiryDate: String(fields.expiry_date || '—'), documentNumber: String(fields.passport_number || fields.document_number || '—'), nationality: String(fields.nationality || '—'), documentType: String(data.document?.document_type || '—'), gender: fields.gender }, auditTrail: [{ time: new Date().toLocaleTimeString(), actor: 'AI ENGINE', message: data.risk?.explanation || 'Screening result generated.', type: 'ai' }] };
}

export const NewScreeningScreen: React.FC<Props> = ({ onSaveRecord, onNavigateToAudit }) => {
  const [file, setFile] = useState<File | null>(null); const [documentType, setDocumentType] = useState<DocType>('passport'); const [screeningId, setScreeningId] = useState(''); const [stage, setStage] = useState(0); const [processing, setProcessing] = useState(false); const [result, setResult] = useState<any>(null); const [error, setError] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const start = async () => {
    if (!file) { setError('Select a JPEG, PNG, or PDF document first.'); return; }
    setError(''); setResult(null); setProcessing(true); setStage(0);
    try {
      const form = new FormData(); form.append('document', file); form.append('document_type', documentType);
      const created = await createScreening(form); setScreeningId(created.screening_id); await runScreening(created.screening_id);
      for (let i = 0; i < 30; i++) { setStage(Math.min(5, Math.floor(i / 4))); await new Promise((resolve) => setTimeout(resolve, 1000)); try { const data = await getScreening(created.screening_id); setResult(data); setStage(6); setProcessing(false); return; } catch { /* pipeline is still running */ } }
      throw new Error('Screening timed out. Check Audit History for the latest state.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Screening failed.'); setProcessing(false); }
  };

  const decide = async (action: 'approved' | 'manual_review' | 'rejected') => {
    if (!screeningId) return; setError('');
    try { const response = await submitOfficerAction(screeningId, action); const next = { ...(result || {}), status: response.status }; setResult(next); onSaveRecord(mapResult(next)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to record officer action.'); }
  };
  const reset = () => { setFile(null); setScreeningId(''); setStage(0); setResult(null); setProcessing(false); setError(''); if (inputRef.current) inputRef.current.value = ''; };

  return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 font-mono text-xs">
    <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4"><div className="text-[10px] text-[#10B981] font-bold tracking-wider">VERIFAI / INGESTION &amp; ANALYSIS</div><h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans mt-1">DOCUMENT INTELLIGENCE PIPELINE</h1><p className="text-xs text-[#A1A1AA] mt-1">Upload an identity document and run the real backend screening pipeline.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 space-y-4"><div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4"><div className="flex justify-between mb-3"><span className="text-[10px] font-bold tracking-wider text-[#71717A]">DATA INGESTION</span><FileText className="w-4 h-4 text-[#10B981]" /></div><label className="block text-[10px] text-[#A1A1AA] uppercase mb-1">Document type</label><select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocType)} className="w-full mb-3 bg-[#09090B] border border-[#27272A] rounded px-3 py-2 text-xs text-white outline-none">{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button onClick={() => inputRef.current?.click()} className="w-full min-h-[170px] border border-dashed border-[#3F3F46] rounded-md bg-[#09090B] flex flex-col items-center justify-center gap-3 hover:border-[#10B981] transition-colors cursor-pointer"><UploadCloud className="w-8 h-8 text-[#71717A]" /><span className="text-white font-semibold">{file ? file.name : 'Select identity document'}</span><span className="text-[10px] text-[#71717A]">JPEG / PNG / PDF · max 10 MB</span></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /><div className="flex gap-2 mt-3"><button disabled={processing} onClick={start} className="flex-1 bg-[#10B981] text-[#09090B] font-bold py-2.5 rounded disabled:opacity-50 flex items-center justify-center gap-2">{processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}{processing ? 'SCREENING...' : 'RUN AI SCREENING'}</button><button onClick={reset} className="px-3 bg-[#27272A] text-white rounded"><RotateCcw className="w-4 h-4" /></button></div></div>{error && <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 flex gap-2"><XCircle className="w-4 h-4 shrink-0" />{error}</div>}</div>
      <div className="lg:col-span-8 space-y-4"><div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4"><div className="text-[10px] font-bold tracking-wider text-[#71717A] mb-4">PROCESSING PIPELINE {screeningId && <span className="text-[#10B981] ml-2">{screeningId}</span>}</div><div className="grid grid-cols-2 md:grid-cols-6 gap-2">{steps.map((name, i) => <div key={name} className={`border rounded p-3 text-center ${stage > i ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]' : stage === i && processing ? 'border-[#10B981] bg-[#10B981]/5 text-white' : 'border-[#27272A] text-[#71717A]'}`}>{stage > i ? <CheckCircle2 className="w-4 h-4 mx-auto mb-1" /> : <div className="w-4 h-4 mx-auto mb-1 rounded-full border border-current" />}<span className="text-[9px] font-bold">{name}</span></div>)}</div></div>
      {result && <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4"><div className="flex items-center justify-between mb-4"><div><span className="text-[10px] text-[#71717A]">SCREENING RESULT</span><h2 className="text-lg text-white font-bold">{String(result.document?.document_type || documentType).toUpperCase()}</h2></div><div className="px-2 py-1 rounded border text-[10px] font-bold text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10">RISK {String(result.risk?.level || 'low').toUpperCase()} · {result.risk?.score ?? 0}</div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]"><Metric label="OCR" value={`${Math.round(Number(result.ocr?.confidence || 0) * 100)}%`} /><Metric label="VALIDATION" value={String(result.validation?.status || '—').toUpperCase()} /><Metric label="TAMPERING" value={`${Math.round(Number(result.tampering?.score || 0) * 100)}%`} /><Metric label="FACE" value={String(result.face_verification?.status || '—').toUpperCase()} /></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => decide('approved')} className="bg-[#10B981] text-[#09090B] px-4 py-2 rounded font-bold flex gap-2 items-center"><ShieldCheck className="w-4 h-4" />APPROVE &amp; SAVE</button><button onClick={() => decide('manual_review')} className="bg-[#27272A] border border-[#3F3F46] text-white px-4 py-2 rounded font-bold flex gap-2 items-center"><AlertTriangle className="w-4 h-4" />MANUAL REVIEW</button><button onClick={() => decide('rejected')} className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2 rounded font-bold flex gap-2 items-center"><XCircle className="w-4 h-4" />REJECT</button><button onClick={onNavigateToAudit} className="ml-auto text-[#A1A1AA] hover:text-white px-3 py-2">VIEW AUDIT HISTORY →</button></div></div>}
      </div>
    </div>
  </div>;
};
const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="bg-[#09090B] border border-[#27272A] rounded p-3"><div className="text-[#71717A] mb-1">{label}</div><div className="text-white font-bold">{value}</div></div>;
