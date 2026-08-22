import React, { useEffect, useState } from 'react';
import { ScreenType, ScreeningRecord } from './types';
import { INITIAL_AUDIT_RECORDS } from './data/mockData';
import { Sidebar } from './components/Navigation/Sidebar';
import { TopAppBar } from './components/Navigation/TopAppBar';
import { AuthScreen } from './components/Screens/AuthScreen';
import { CommandCenterScreen } from './components/Screens/CommandCenterScreen';
import { NewScreeningScreen } from './components/Screens/NewScreeningScreen';
import { AuditHistoryScreen } from './components/Screens/AuditHistoryScreen';
import { SecurityScreen } from './components/Screens/SecurityScreen';
import { checkBackendHealth, clearSession, getDashboardStats, getScreenings, hasSession, type DashboardStats } from './services/api';

const EMPTY_STATS: DashboardStats = {
  documents_screened: 0,
  low_risk: 0,
  medium_risk: 0,
  high_risk: 0,
  tampering_flags: 0,
};

function mapRiskLevel(level: string): ScreeningRecord['riskLevel'] { const normalized = level.toUpperCase(); if (normalized === 'HIGH') return 'HIGH'; if (normalized === 'MEDIUM') return 'MEDIUM'; return 'LOW'; }
function mapStatus(status: string, action?: string): ScreeningRecord['status'] { const value = (action || status || '').toLowerCase(); if (value === 'approved') return 'Approved'; if (value === 'rejected') return 'Rejected'; return 'Pending'; }
function mapApiRecord(item: Awaited<ReturnType<typeof getScreenings>>['items'][number]): ScreeningRecord { const created = new Date(item.created_at); const riskLevel = mapRiskLevel(item.risk_level); return { id: item.screening_id, officerId: 'CURRENT-USER', officerName: 'Current Officer', documentType: item.document_type, country: '—', riskScore: riskLevel === 'HIGH' ? 80 : riskLevel === 'MEDIUM' ? 55 : 20, riskLevel, status: mapStatus(item.status, item.action), timestamp: item.created_at, timeDisplay: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ocrConfidence: 0, formatValidation: 'PASS', formatStandard: 'ICAO DOC 9303', tamperingIndex: 0, faceMatchScore: 0, contributingFactors: [], validationChecks: { mrzValid: false, hologramValid: false, faceMatchValid: false, watchlistClean: false }, ocrData: { fullName: '—', dob: '—', expiryDate: '—', documentNumber: '—', nationality: '—', documentType: item.document_type }, auditTrail: [] }; }

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => hasSession() ? 'command-center' : 'auth');
  const [records, setRecords] = useState<ScreeningRecord[]>(INITIAL_AUDIT_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  useEffect(() => {
    if (currentScreen === 'auth') return;
    let cancelled = false;

    Promise.allSettled([
      getScreenings({ page: 1, limit: 20 }),
      getDashboardStats(),
      checkBackendHealth(),
    ]).then(([screeningsResult, statsResult, healthResult]) => {
      if (cancelled) return;

      if (screeningsResult.status === 'fulfilled' && screeningsResult.value.items.length > 0) {
        setRecords(screeningsResult.value.items.map(mapApiRecord));
      }
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (healthResult.status === 'fulfilled') setBackendStatus(healthResult.value ? 'connected' : 'offline');
      else setBackendStatus('offline');

      const authError = [screeningsResult, statsResult].some(
        (result) => result.status === 'rejected' && result.reason instanceof Error && /token|unauthorized|authenticated/i.test(result.reason.message),
      );
      if (authError) {
        clearSession();
        setCurrentScreen('auth');
      }
    });

    return () => { cancelled = true; };
  }, [currentScreen]);

  const handleSignOut = () => { clearSession(); setCurrentScreen('auth'); };
  const handleSaveRecord = (newRecord: ScreeningRecord) => { setRecords((prev) => [newRecord, ...prev]); setSelectedRecordId(newRecord.id); };
  const handleSelectRecord = (record: ScreeningRecord | null) => { if (record) { setSelectedRecordId(record.id); setCurrentScreen('audit-history'); } else setSelectedRecordId(null); };
  const pendingCount = records.filter((r) => r.status === 'Pending').length;
  if (currentScreen === 'auth') return <AuthScreen onLoginSuccess={() => setCurrentScreen('command-center')} />;

  return <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] font-sans flex antialiased selection:bg-[#10B981] selection:text-[#09090B]">
    <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none z-0" />
    <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} pendingCount={pendingCount} />
    <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
      <TopAppBar currentScreen={currentScreen} onNavigate={setCurrentScreen} onSignOut={handleSignOut} onQuickSearch={() => setCurrentScreen('audit-history')} />
      <main className="flex-1 overflow-y-auto">
        {currentScreen === 'command-center' && <CommandCenterScreen records={records} stats={stats} backendStatus={backendStatus} onStartScreening={() => setCurrentScreen('new-screening')} onViewAllAudit={() => setCurrentScreen('audit-history')} onSelectRecord={handleSelectRecord} />}
        {currentScreen === 'new-screening' && <NewScreeningScreen onSaveRecord={handleSaveRecord} onNavigateToAudit={() => setCurrentScreen('audit-history')} />}
        {currentScreen === 'audit-history' && <AuditHistoryScreen records={records} selectedRecordId={selectedRecordId} onSelectRecord={(rec) => setSelectedRecordId(rec ? rec.id : null)} />}
        {currentScreen === 'security' && <SecurityScreen />}
      </main>
      <footer className="h-9 bg-[#09090B] border-t border-[#27272A] flex items-center justify-between px-4 text-[11px] font-mono text-[#71717A] shrink-0 select-none"><div className="flex items-center gap-3"><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /><span>CLOUD RELAY: <span className="text-white">CONNECTED</span></span></div><span>•</span><div>QUEUE DEPTH: <span className="text-white">{pendingCount} PENDING</span></div></div><div className="flex items-center gap-3"><span>NODE: <span className="text-white">LOCAL</span></span><span>•</span><span>CIPHER: <span className="text-[#10B981]">AES-256-GCM</span></span></div></footer>
    </div>
  </div>;
}
