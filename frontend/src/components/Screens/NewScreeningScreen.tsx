import React, { useRef, useState } from 'react';
import { api, ScreeningResult } from '../../api';
import { ScreeningRecord } from '../../types';

interface Props { onSaveRecord: (record: ScreeningRecord) => void; onNavigateToAudit: () => void; }
const steps = ['DOCUMENT', 'OCR', 'VALIDATION', 'TAMPERING', 'FACE VERIFY', 'RISK ENGINE'];

export const NewScreeningScreen: React.FC<Props> = ({ onSaveRecord, onNavigateToAudit }) => {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('passport');
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const run = async () => {
    if (!file) return setError('Select a JPEG, PNG, or PDF document first.');
    setError(''); setBusy(true); setResult(null); setStep(0);
    try {
      const created = await api.createScreening(file, documentType);
      setScreeningId(created.screening_id);
      await api.runScreening(created.screening_id);
      for (let i = 1; i < steps.length; i++) { setStep(i); await new Promise(r => setTimeout(r, 250)); }
      let latest: ScreeningResult | null = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        latest = await api.result(created.screening_id);
        setResult(latest);
        if (latest.status === 'completed') break;
        await new Promise(r => setTimeout(r, 1000));
      }
      if (!latest || latest.status !== 'completed') throw new Error('Screening is still processing. Check Audit Logs shortly.');
      setStep(steps.length);
    } catch (e) { setError(e instanceof Error ? e.message : 'Screening failed.'); }
    finally { setBusy(false); }
  };

  const takeAction = async (action: 'approved' | 'manual_review' | 'rejected' | 'escalated') => {
    if (!screeningId) return;
    setActionBusy(true); setError('');
    try {
      const saved = await api.action(screeningId, action);
      setResult(prev => prev ? { ...prev, action: saved.action, status: saved.status } : prev);
      const r = result;
      if (r) {
        const risk = r.risk?.level?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' || 'LOW';
        const record: ScreeningRecord = {
          id: screeningId, officerId: 'CURRENT', officerName: 'Current Officer',
          documentType: r.document?.document_type || documentType, country: r.ocr?.fields?.nationality || '-',
          riskScore: r.risk?.score || 0, riskLevel: risk,
          status: action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Pending',
          timestamp: new Date().toISOString(), timeDisplay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ocrConfidence: r.ocr?.confidence || 0, formatValidation: r.validation?.status === 'pass' ? 'PASS' : 'FLAG', formatStandard: 'ICAO DOC 9303',
          tamperingIndex: r.tampering?.score || 0, faceMatchScore: r.face_verification?.similarity_score || 0,
          contributingFactors: r.risk?.factors || [],
          validationChecks: { mrzValid: r.validation?.status === 'pass', hologramValid: false, faceMatchValid: r.face_verification?.status === 'match', watchlistClean: false },
          ocrData: { fullName: r.ocr?.fields?.name || '', dob: r.ocr?.fields?.date_of_birth || '', expiryDate: r.ocr?.fields?.expiry_date || '', documentNumber: r.ocr?.fields?.passport_number || '', nationality: r.ocr?.fields?.nationality || '', documentType: r.document?.document_type || documentType },
          auditTrail: []
        };
        onSaveRecord(record);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setActionBusy(false); }
  };

  return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 font-mono text-xs">
    <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-5">
      <div className="text-[10px] text-[#10B981] font-bold tracking-wider">VERIFAI / LIVE BACKEND PIPELINE</div>
      <h1 className="text-2xl font-bold text-white font-sans mt-1">DOCUMENT INTELLIGENCE PIPELINE</h1>
      <p className="text-[#A1A1AA] mt-1">Real document → Flask API → AI modules → Supabase results. No preset screening data is used.</p>
    </section>

    <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="bg-[#09090B] border border-[#3F3F46] text-white rounded px-3 py-2">
          <option value="passport">Passport</option><option value="visa">Visa</option><option value="national_id">National ID</option><option value="driving_license">Driving License</option><option value="permit">Permit</option>
        </select>
        <button onClick={() => input.current?.click()} className="bg-[#27272A] border border-[#3F3F46] text-white px-4 py-2 rounded">SELECT LOCAL FILE</button>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        <span className="text-[#A1A1AA]">{file ? file.name : 'No document selected'}</span>
      </div>
      <button onClick={run} disabled={busy || !file} className="w-full bg-[#10B981] disabled:opacity-40 text-[#09090B] font-bold py-3 rounded">{busy ? 'SCREENING WITH BACKEND...' : 'RUN AI SCREENING'}</button>
      {screeningId && <div className="text-[#10B981]">SCREENING ID: {screeningId}</div>}
      {error && <div className="border border-[#F43F5E] bg-[#F43F5E]/10 text-[#FECDD3] p-3 rounded">{error}</div>}
    </section>

    <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-5">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">{steps.map((name, i) => <div key={name} className={`p-3 rounded border text-center ${i < step ? 'border-[#10B981] text-[#10B981]' : i === step ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#27272A] text-[#71717A]'}`}>{i < step ? '✓ ' : ''}{name}</div>)}</div>
    </section>

    {result && <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ResultCard title="OCR EXTRACTION"><pre className="whitespace-pre-wrap">{JSON.stringify(result.ocr, null, 2)}</pre></ResultCard>
      <ResultCard title="VALIDATION"><pre className="whitespace-pre-wrap">{JSON.stringify(result.validation, null, 2)}</pre></ResultCard>
      <ResultCard title="TAMPERING"><pre className="whitespace-pre-wrap">{JSON.stringify(result.tampering, null, 2)}</pre></ResultCard>
      <ResultCard title="FACE VERIFICATION"><pre className="whitespace-pre-wrap">{JSON.stringify(result.face_verification, null, 2)}</pre></ResultCard>
      <ResultCard title="RISK ASSESSMENT"><div className="text-3xl text-white font-bold">{result.risk?.score ?? '-'}<span className="text-sm text-[#71717A]"> / 100</span></div><div className="text-[#10B981] uppercase">{result.risk?.level || '-'}</div><ul className="mt-2 list-disc pl-5">{(result.risk?.factors || []).map(f => <li key={f}>{f}</li>)}</ul></ResultCard>
      <ResultCard title="OFFICER ACTION"><div className="grid grid-cols-2 gap-2">{(['approved','manual_review','rejected','escalated'] as const).map(a => <button key={a} disabled={actionBusy} onClick={() => takeAction(a)} className="border border-[#3F3F46] hover:border-[#10B981] text-white p-2 rounded uppercase">{a.replace('_',' ')}</button>)}</div><button onClick={onNavigateToAudit} className="mt-3 text-[#10B981]">OPEN AUDIT LOGS →</button></ResultCard>
    </section>}
  </div>;
};

const ResultCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4"><div className="text-[10px] font-bold tracking-wider text-[#71717A] mb-3">{title}</div><div className="text-[#D4D4D8] text-xs">{children}</div></div>;
