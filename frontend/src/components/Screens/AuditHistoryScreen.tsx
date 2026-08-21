import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Eye,
  Filter,
  Check,
  AlertTriangle,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { ScreeningRecord, RiskLevel, ScreeningStatus } from '../../types';

interface AuditHistoryScreenProps {
  records: ScreeningRecord[];
  selectedRecordId: string | null;
  onSelectRecord: (record: ScreeningRecord | null) => void;
}

export const AuditHistoryScreen: React.FC<AuditHistoryScreenProps> = ({
  records,
  selectedRecordId,
  onSelectRecord
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Find currently active inspected record
  const inspectedRecord = useMemo(() => {
    if (!selectedRecordId) return records[0] || null;
    return records.find(r => r.id === selectedRecordId) || records[0] || null;
  }, [records, selectedRecordId]);

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesSearch = 
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.officerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.ocrData.fullName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk = 
        riskFilter === 'ALL' || rec.riskLevel.toUpperCase() === riskFilter.toUpperCase();

      const matchesStatus = 
        statusFilter === 'ALL' || rec.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [records, searchQuery, riskFilter, statusFilter]);

  const handleRowClick = (record: ScreeningRecord) => {
    onSelectRecord(record);
    setIsInspectorOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto flex flex-col h-[calc(100vh-2.75rem-2.25rem)] overflow-hidden animate-in fade-in duration-150 font-mono text-xs">
      {/* Page Header */}
      <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#10B981] font-bold tracking-wider uppercase">
              TRACEABILITY &amp; LEDGER
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            IMMUTABLE AUDIT TRAIL
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Officer, Doc..."
              className="w-48 lg:w-56 h-8 bg-[#18181B] border border-[#27272A] rounded pl-8 pr-2.5 text-xs text-white placeholder:text-[#52525B] focus:border-[#3F3F46] focus:outline-none transition-colors"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-8 bg-[#18181B] border border-[#27272A] rounded px-2.5 text-xs text-white focus:border-[#3F3F46] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Risk: All</option>
            <option value="HIGH">Risk: High</option>
            <option value="MEDIUM">Risk: Medium</option>
            <option value="LOW">Risk: Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 bg-[#18181B] border border-[#27272A] rounded px-2.5 text-xs text-white focus:border-[#3F3F46] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Table Container & Slide Inspector */}
      <div className="flex-1 flex gap-3 overflow-hidden relative">
        {/* Table Container */}
        <div className="flex-1 bg-[#18181B] border border-[#27272A] rounded-lg flex flex-col overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-4 py-2 border-b border-[#27272A] bg-[#18181B] text-[10px] font-bold tracking-wider text-[#71717A] uppercase shrink-0">
            <div className="w-28">Screening ID</div>
            <div className="w-28">Officer</div>
            <div className="flex-1 min-w-[140px]">Document</div>
            <div className="w-20 text-center">Risk</div>
            <div className="w-28">Status</div>
            <div className="w-20 text-right">Time</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#27272A]/70">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#71717A]">
                No matching records found for active filters.
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isSelected = inspectedRecord?.id === rec.id;
                const isHigh = rec.riskLevel === 'HIGH';
                const isMed = rec.riskLevel === 'MEDIUM';

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleRowClick(rec)}
                    className={`flex items-center px-4 py-2 text-xs cursor-pointer transition-colors border-l-2 ${
                      isSelected
                        ? 'bg-[#27272A] border-l-[#10B981] text-white'
                        : 'border-l-transparent hover:bg-[#27272A]/40 text-[#A1A1AA]'
                    }`}
                  >
                    <div className="w-28 font-medium text-white">
                      {rec.id}
                    </div>
                    <div className="w-28 text-[#71717A]">
                      {rec.officerId}
                    </div>
                    <div className="flex-1 min-w-[140px] truncate text-[#A1A1AA]">
                      {rec.documentType}
                    </div>
                    <div className="w-20 flex justify-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        isHigh
                          ? 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
                          : isMed
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                      }`}>
                        {rec.riskLevel}
                      </span>
                    </div>
                    <div className="w-28 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rec.status === 'Approved'
                          ? 'bg-[#10B981]'
                          : rec.status === 'Rejected'
                          ? 'bg-[#F43F5E]'
                          : 'bg-[#F59E0B]'
                      }`} />
                      <span className="text-[11px]">{rec.status}</span>
                    </div>
                    <div className="w-20 text-right text-[#71717A]">
                      {rec.timeDisplay}Z
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Inspector Drawer */}
        {isInspectorOpen && inspectedRecord && (
          <div className="w-full md:w-[380px] bg-[#18181B] border border-[#27272A] rounded-lg shrink-0 flex flex-col overflow-hidden animate-in slide-in-from-right duration-150">
            {/* Header */}
            <div className="p-3.5 border-b border-[#27272A] flex justify-between items-center bg-[#18181B]">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#10B981] uppercase block">
                  SCREENING AUDIT DETAIL
                </span>
                <h3 className="text-sm font-bold text-white">
                  {inspectedRecord.id}
                </h3>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-[#71717A] hover:text-white p-1 rounded hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Overall Status & Risk Score Bento */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#09090B] p-2.5 rounded border border-[#27272A]">
                  <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-0.5">
                    RISK SCORE
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${
                      inspectedRecord.riskScore <= 35 
                        ? 'text-[#10B981]' 
                        : inspectedRecord.riskScore <= 70 
                        ? 'text-[#F59E0B]' 
                        : 'text-[#F43F5E]'
                    }`}>
                      {inspectedRecord.riskScore}
                    </span>
                    <span className="text-[10px] text-[#71717A]">/ 100</span>
                  </div>
                </div>

                <div className="bg-[#09090B] p-2.5 rounded border border-[#27272A]">
                  <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-0.5">
                    DECISION
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {inspectedRecord.status === 'Approved' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                    {inspectedRecord.status === 'Rejected' && (
                      <XCircle className="w-3.5 h-3.5 text-[#F43F5E]" />
                    )}
                    {inspectedRecord.status === 'Pending' && (
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    )}
                    <span className="text-xs font-bold text-white">
                      {inspectedRecord.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Checks Bento */}
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase block mb-2 pb-1 border-b border-[#27272A]">
                  VALIDATION CHECKS
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="bg-[#09090B] p-2 rounded border border-[#27272A] flex justify-between items-center">
                    <span className="text-[#A1A1AA] text-[11px]">MRZ Checksum</span>
                    {inspectedRecord.validationChecks.mrzValid ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#F43F5E]" />
                    )}
                  </div>

                  <div className="bg-[#09090B] p-2 rounded border border-[#27272A] flex justify-between items-center">
                    <span className="text-[#A1A1AA] text-[11px]">Hologram Refl.</span>
                    {inspectedRecord.validationChecks.hologramValid ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#F43F5E]" />
                    )}
                  </div>

                  <div className="bg-[#09090B] p-2 rounded border border-[#27272A] flex justify-between items-center">
                    <span className="text-[#A1A1AA] text-[11px]">Face Match</span>
                    {inspectedRecord.validationChecks.faceMatchValid ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#F43F5E]" />
                    )}
                  </div>

                  <div className="bg-[#09090B] p-2 rounded border border-[#27272A] flex justify-between items-center">
                    <span className="text-[#A1A1AA] text-[11px]">Watchlist DB</span>
                    {inspectedRecord.validationChecks.watchlistClean ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#F43F5E]" />
                    )}
                  </div>
                </div>
              </div>

              {/* OCR Extraction */}
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase block mb-2 pb-1 border-b border-[#27272A]">
                  OCR EXTRACTED VALUES
                </span>
                <div className="bg-[#09090B] p-2.5 rounded border border-[#27272A] text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">NAME:</span>
                    <span className="text-white font-medium">{inspectedRecord.ocrData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">DOB:</span>
                    <span className="text-[#A1A1AA]">{inspectedRecord.ocrData.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">EXPIRY:</span>
                    <span className="text-[#A1A1AA]">{inspectedRecord.ocrData.expiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">DOC NO:</span>
                    <span className="text-white">{inspectedRecord.ocrData.documentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">NATIONALITY:</span>
                    <span className="text-[#A1A1AA]">{inspectedRecord.ocrData.nationality}</span>
                  </div>
                </div>
              </div>

              {/* Tampering Analysis */}
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase block mb-2 pb-1 border-b border-[#27272A]">
                  TAMPERING ANOMALY
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#09090B] rounded-full h-1.5 overflow-hidden border border-[#27272A]">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        inspectedRecord.tamperingIndex < 0.2
                          ? 'bg-[#10B981]'
                          : inspectedRecord.tamperingIndex < 0.6
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#F43F5E]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, inspectedRecord.tamperingIndex * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {Math.round(inspectedRecord.tamperingIndex * 100)}%
                  </span>
                </div>
              </div>

              {/* Audit Trail Timeline */}
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase block mb-2.5 pb-1 border-b border-[#27272A]">
                  CRYPTOGRAPHIC LOG
                </span>
                <div className="relative border-l border-[#27272A] ml-2 space-y-3 pb-1">
                  {inspectedRecord.auditTrail.map((ev, idx) => (
                    <div key={idx} className="relative pl-4 text-xs">
                      <div className={`absolute -left-[4px] top-1 w-2 h-2 rounded-full ${
                        idx === 0 ? 'bg-[#10B981]' : 'bg-[#3F3F46]'
                      }`} />
                      <p className="text-[10px] text-[#71717A] mb-0.5">
                        {ev.time} • {ev.actor}
                      </p>
                      <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                        {ev.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

