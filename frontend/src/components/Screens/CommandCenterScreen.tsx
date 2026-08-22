import React from 'react';
import { Plus, Eye, FileText, CheckCircle, AlertTriangle, ShieldAlert, FileWarning } from 'lucide-react';
import { ScreeningRecord } from '../../types';
import { DashboardStats } from '../../services/api';

interface Props {
  records: ScreeningRecord[];
  stats: DashboardStats;
  backendStatus: 'checking' | 'connected' | 'offline';
  onStartScreening: () => void;
  onViewAllAudit: () => void;
  onSelectRecord: (record: ScreeningRecord) => void;
}

export const CommandCenterScreen: React.FC<Props> = ({
  records,
  stats,
  backendStatus,
  onStartScreening,
  onViewAllAudit,
  onSelectRecord,
}) => (
  <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 font-mono">
    <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 flex flex-col md:flex-row justify-between gap-4">
      <div>
        <div className="text-[10px] text-[#10B981] font-bold tracking-wider">BORDER SECURITY • AI ASSISTED</div>
        <h2 className="text-2xl font-bold text-white font-sans mt-1">VERIFY FASTER. DETECT SMARTER.</h2>
        <p className="text-xs text-[#A1A1AA] mt-1">Live dashboard backed by Flask and Supabase. No hard-coded KPI values.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onStartScreening} className="bg-[#10B981] text-[#09090B] px-4 py-2 rounded font-bold flex items-center gap-2">
          <Plus className="w-4" />START SCREENING
        </button>
        <button onClick={onViewAllAudit} className="bg-[#27272A] text-white px-4 py-2 rounded flex items-center gap-2">
          <Eye className="w-4" />AUDIT LOGS
        </button>
      </div>
    </section>

    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-[#10B981]' : 'bg-[#F43F5E]'}`} />
      {backendStatus === 'connected' ? 'FLASK API CONNECTED' : 'FLASK API UNAVAILABLE'}
    </div>

    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <Kpi icon={<FileText />} label="DOCUMENTS SCREENED" value={stats.documents_screened} />
      <Kpi icon={<CheckCircle />} label="LOW RISK" value={stats.low_risk} />
      <Kpi icon={<AlertTriangle />} label="MEDIUM RISK" value={stats.medium_risk} />
      <Kpi icon={<ShieldAlert />} label="HIGH RISK" value={stats.high_risk} />
      <Kpi icon={<FileWarning />} label="TAMPERING FLAGS" value={stats.tampering_flags} />
    </section>

    <section className="bg-[#18181B] border border-[#27272A] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#27272A] flex justify-between">
        <span className="text-xs font-bold text-white">RECENT SCREENINGS</span>
        <button onClick={onViewAllAudit} className="text-[#10B981] text-xs">VIEW ALL →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#27272A] text-[#71717A]">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">DOCUMENT</th>
              <th className="p-3 text-left">RISK</th>
              <th className="p-3 text-left">STATUS</th>
              <th className="p-3 text-left">TIME</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 8).map((record) => (
              <tr
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="border-b border-[#27272A] hover:bg-[#27272A] cursor-pointer"
              >
                <td className="p-3 text-white">{record.id}</td>
                <td className="p-3">{record.documentType}</td>
                <td className="p-3">{record.riskLevel}</td>
                <td className="p-3">{record.status}</td>
                <td className="p-3">{record.timeDisplay}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#71717A]">No screenings returned by backend.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  </div>
);

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
    <div className="flex justify-between text-[#71717A] text-[10px] font-bold">
      <span>{label}</span>
      <span className="w-4">{icon}</span>
    </div>
    <div className="text-2xl text-white font-bold mt-2">{value.toLocaleString()}</div>
  </div>
);
