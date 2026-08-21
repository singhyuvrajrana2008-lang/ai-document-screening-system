import React from 'react';
import { 
  Plus, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileWarning, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Check,
  Activity
} from 'lucide-react';
import { ScreeningRecord } from '../../types';

interface CommandCenterScreenProps {
  records: ScreeningRecord[];
  onStartScreening: () => void;
  onViewAllAudit: () => void;
  onSelectRecord: (record: ScreeningRecord) => void;
}

export const CommandCenterScreen: React.FC<CommandCenterScreenProps> = ({
  records,
  onStartScreening,
  onViewAllAudit,
  onSelectRecord
}) => {
  // Compute dynamic stats based on records
  const totalScreened = 12846 + (records.length - 17);
  const lowRiskCount = records.filter(r => r.riskLevel === 'LOW').length;
  const medRiskCount = records.filter(r => r.riskLevel === 'MEDIUM').length;
  const highRiskCount = records.filter(r => r.riskLevel === 'HIGH').length;

  const recentRecords = records.slice(0, 4);

  // SVG Radial Math for 64% aggregate
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const aggScore = 64;
  const strokeDashoffset = circumference - (aggScore / 100) * circumference;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-150">
      {/* Dashboard Hero */}
      <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              BORDER SECURITY • AI ASSISTED
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1 font-sans">
              VERIFY FASTER. DETECT SMARTER.
            </h2>
            <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed">
              Unified multimodal screening for identity credentials and travel documents. Real-time OCR extraction, forensic tampering detection, and biometric matching.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onStartScreening}
              className="bg-[#10B981] hover:bg-[#34D399] text-[#09090B] font-mono text-xs font-bold tracking-wider uppercase px-4 py-2 rounded flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              START SCREENING
            </button>
            <button
              onClick={onViewAllAudit}
              className="bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] text-white font-mono text-xs font-medium tracking-wider uppercase px-4 py-2 rounded transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#10B981]" />
              AUDIT LOGS
            </button>
          </div>
        </div>
      </section>

      {/* KPI Section (5 Bento Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Screened */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3F3F46] transition-colors">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">
              DOCUMENTS SCREENED
            </span>
            <FileText className="w-3.5 h-3.5 text-[#71717A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              {totalScreened.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[#10B981] font-mono text-[11px]">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last week</span>
            </div>
          </div>
        </div>

        {/* 2. Low Risk */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#10B981]">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">
              LOW RISK
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              10,421
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5 font-mono">
              81.1% of total volume
            </div>
          </div>
        </div>

        {/* 3. Medium Risk */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#F59E0B]">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">
              MEDIUM RISK
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              1,824
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[#F59E0B] font-mono text-[11px]">
              <TrendingUp className="w-3 h-3" />
              <span>+4% variance</span>
            </div>
          </div>
        </div>

        {/* 4. High Risk */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between border-l-2 border-l-[#F43F5E]">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">
              HIGH RISK
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#F43F5E]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#F43F5E]">
              601
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5 font-mono">
              Requires manual review
            </div>
          </div>
        </div>

        {/* 5. Tampering Flags */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">
              TAMPERING FLAGS
            </span>
            <FileWarning className="w-3.5 h-3.5 text-[#71717A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              318
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#F43F5E] h-full rounded-full" style={{ width: '4.8%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Column Pipeline + Table (2 cols), Right Column Risk Assessment (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Screening Intelligence Pipeline Card */}
          <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                Screening Intelligence Pipeline
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                ACTIVE PIPELINE
              </span>
            </div>

            {/* Stepper Diagram */}
            <div className="flex items-center justify-between relative px-1 py-1">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#27272A] z-0"></div>
              <div className="absolute left-6 w-1/2 top-1/2 -translate-y-1/2 h-0.5 bg-[#10B981]/50 z-0"></div>

              {/* Step 1: DOCUMENT */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#27272A] border border-[#10B981] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#10B981]" />
                </div>
                <span className="text-[9px] font-mono text-white font-medium">DOCUMENT</span>
              </div>

              {/* Step 2: OCR */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#27272A] border border-[#10B981] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#10B981]" />
                </div>
                <span className="text-[9px] font-mono text-white font-medium">OCR</span>
              </div>

              {/* Step 3: VALIDATION */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#27272A] border border-[#10B981] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#10B981]" />
                </div>
                <span className="text-[9px] font-mono text-white font-medium">VALIDATION</span>
              </div>

              {/* Step 4: TAMPERING (Active) */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#09090B] border-2 border-[#10B981] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                </div>
                <span className="text-[9px] font-mono text-[#10B981] font-bold">TAMPERING</span>
              </div>

              {/* Step 5: FACE MATCH */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#09090B] border border-[#27272A] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#52525B] rounded-full"></div>
                </div>
                <span className="text-[9px] font-mono text-[#71717A]">FACE MATCH</span>
              </div>

              {/* Step 6: RISK ENGINE */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#09090B] border border-[#27272A] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#52525B] rounded-full"></div>
                </div>
                <span className="text-[9px] font-mono text-[#71717A]">RISK ENGINE</span>
              </div>

              {/* Step 7: REVIEW */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#09090B] border border-[#27272A] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#52525B] rounded-full"></div>
                </div>
                <span className="text-[9px] font-mono text-[#71717A]">REVIEW</span>
              </div>
            </div>
          </section>

          {/* Recent Screening Activity Table */}
          <section className="bg-[#18181B] border border-[#27272A] rounded-lg flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-[#27272A] flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                Recent Screening Activity
              </h3>
              <button 
                onClick={onViewAllAudit}
                className="text-xs font-mono font-medium text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#18181B] border-b border-[#27272A]">
                  <tr>
                    <th className="py-2 px-3.5 text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">ID</th>
                    <th className="py-2 px-3.5 text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">DOCUMENT</th>
                    <th className="py-2 px-3.5 text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase">RESULT</th>
                    <th className="py-2 px-3.5 text-[10px] font-mono font-bold tracking-wider text-[#71717A] uppercase text-right">TIME</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {recentRecords.map((rec) => {
                    const isHigh = rec.riskLevel === 'HIGH';
                    const isMed = rec.riskLevel === 'MEDIUM';

                    return (
                      <tr 
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className={`border-b border-[#27272A]/70 hover:bg-[#27272A]/40 transition-colors cursor-pointer group ${
                          isHigh ? 'bg-[#F43F5E]/5 border-l-2 border-l-[#F43F5E]' : 'border-l-2 border-l-transparent hover:border-l-[#10B981]'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-medium text-white group-hover:text-[#10B981] transition-colors">
                          {rec.id}
                        </td>
                        <td className="py-2.5 px-3.5 text-[#A1A1AA]">
                          {rec.documentType}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            isHigh 
                              ? 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30' 
                              : isMed 
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' 
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          }`}>
                            {rec.riskLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-[#71717A]">
                          {rec.timeDisplay}Z
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Aggregate Risk Assessment (Span 1) */}
        <div className="lg:col-span-1">
          <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase mb-4">
                Aggregate Risk Assessment
              </h3>

              {/* Circular Radial Score */}
              <div className="flex flex-col items-center justify-center mb-4 relative">
                <svg className="transform -rotate-90" width="144" height="144" viewBox="0 0 144 144">
                  <circle
                    cx="72"
                    cy="72"
                    fill="none"
                    r={radius}
                    stroke="#27272A"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-[#F59E0B]"
                    cx="72"
                    cy="72"
                    fill="none"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono text-white leading-none">
                    64
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#F59E0B] mt-1">
                    MEDIUM
                  </span>
                </div>
              </div>

              {/* Horizontal Risk Meter Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-mono font-bold text-[#71717A] mb-1">
                  <span>LOW</span>
                  <span>HIGH</span>
                </div>
                <div className="w-full h-1.5 bg-[#09090B] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#10B981]" style={{ width: '33.33%' }}></div>
                  <div className="h-full bg-[#F59E0B]" style={{ width: '33.33%' }}></div>
                  <div className="h-full bg-[#F43F5E]" style={{ width: '33.33%' }}></div>
                </div>
                {/* Marker for 64 */}
                <div className="relative w-full">
                  <div 
                    className="absolute top-1 w-2 h-2 bg-white rounded-full border border-black transform -translate-x-1/2 shadow-xs"
                    style={{ left: '64%' }}
                  />
                </div>
              </div>
            </div>

            {/* Analysis Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#27272A]">
              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded flex flex-col justify-center">
                <span className="text-[9px] font-mono font-bold text-[#71717A] mb-0.5 uppercase">
                  OCR CONFIDENCE
                </span>
                <span className="text-base font-bold font-mono text-white">97%</span>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded flex flex-col justify-center">
                <span className="text-[9px] font-mono font-bold text-[#71717A] mb-0.5 uppercase">
                  VALIDATION
                </span>
                <span className="text-base font-bold font-mono text-[#10B981]">PASS</span>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded flex flex-col justify-center">
                <span className="text-[9px] font-mono font-bold text-[#71717A] mb-0.5 uppercase">
                  TAMPERING SCORE
                </span>
                <span className="text-base font-bold font-mono text-white">0.42</span>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded flex flex-col justify-center">
                <span className="text-[9px] font-mono font-bold text-[#71717A] mb-0.5 uppercase">
                  FACE MATCH
                </span>
                <span className="text-base font-bold font-mono text-[#F59E0B]">91%</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

