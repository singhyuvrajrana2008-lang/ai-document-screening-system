import React, { useEffect, useState } from 'react';
import { ScreenType, ScreeningRecord } from './types';
import { Sidebar } from './components/Navigation/Sidebar';
import { TopAppBar } from './components/Navigation/TopAppBar';
import { AuthScreen } from './components/Screens/AuthScreen';
import { CommandCenterScreen } from './components/Screens/CommandCenterScreen';
import { NewScreeningScreen } from './components/Screens/NewScreeningScreen';
import { AuditHistoryScreen } from './components/Screens/AuditHistoryScreen';
import { SecurityScreen } from './components/Screens/SecurityScreen';
import { api, DashboardStats } from './api';
import { supabase } from './supabase';

const emptyStats: DashboardStats = { documents_screened: 0, low_risk: 0, medium_risk: 0, high_risk: 0, tampering_flags: 0 };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('auth');
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  const refreshData = async () => {
    try {
      const [health, dashboard, history] = await Promise.all([api.health(), api.dashboardStats(), api.history()]);
      setBackendStatus(health.status === 'operational' && health.database === 'connected' ? 'connected' : 'offline');
      setStats(dashboard);
      setRecords(history.items.map(item => ({
        id: item.screening_id, officerId: 'CURRENT', officerName: 'Current Officer', documentType: item.document_type || 'Unknown', country: '-',
        riskScore: item.risk_level === 'high' ? 80 : item.risk_level === 'medium' ? 50 : 20,
        riskLevel: (item.risk_level || 'low').toUpperCase() as 'LOW'|'MEDIUM'|'HIGH',
        status: item.action === 'approved' ? 'Approved' : item.action === 'rejected' ? 'Rejected' : 'Pending', timestamp: item.created_at || '',
        timeDisplay: item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '-', ocrConfidence: 0,
        formatValidation: 'PASS', formatStandard: 'ICAO DOC 9303', tamperingIndex: 0, faceMatchScore: 0, contributingFactors: [],
        validationChecks: {mrzValid:false,hologramValid:false,faceMatchValid:false,watchlistClean:false},
        ocrData: {fullName:'',dob:'',expiryDate:'',documentNumber:'',nationality:'',documentType:item.document_type || ''}, auditTrail: []
      })));
    } catch { setBackendStatus('offline'); }
  };

  useEffect(() => { if (currentScreen !== 'auth') refreshData(); }, [currentScreen]);
  const handleLoginSuccess = () => setCurrentScreen('command-center');
  const handleSignOut = async () => { await supabase.auth.signOut(); setRecords([]); setCurrentScreen('auth'); };
  const handleSaveRecord = (record: ScreeningRecord) => { setRecords(prev => [record, ...prev]); setSelectedRecordId(record.id); refreshData(); };
  const handleSelectRecord = (record: ScreeningRecord | null) => { setSelectedRecordId(record?.id || null); if (record) setCurrentScreen('audit-history'); };

  if (currentScreen === 'auth') return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  return <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] font-sans flex antialiased"><div className="fixed inset-0 grid-bg opacity-30 pointer-events-none z-0"/>
    <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} pendingCount={records.filter(r=>r.status==='Pending').length}/>
    <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10"><TopAppBar currentScreen={currentScreen} onNavigate={setCurrentScreen} onSignOut={handleSignOut} onQuickSearch={()=>setCurrentScreen('audit-history')}/>
      <main className="flex-1 overflow-y-auto">
        {currentScreen==='command-center' && <CommandCenterScreen records={records} stats={stats} backendStatus={backendStatus} onStartScreening={()=>setCurrentScreen('new-screening')} onViewAllAudit={()=>setCurrentScreen('audit-history')} onSelectRecord={handleSelectRecord}/>} 
        {currentScreen==='new-screening' && <NewScreeningScreen onSaveRecord={handleSaveRecord} onNavigateToAudit={()=>setCurrentScreen('audit-history')}/>} 
        {currentScreen==='audit-history' && <AuditHistoryScreen records={records} selectedRecordId={selectedRecordId} onSelectRecord={rec=>setSelectedRecordId(rec ? rec.id : null)}/>} 
        {currentScreen==='security' && <SecurityScreen/>}
      </main>
      <footer className="h-9 bg-[#09090B] border-t border-[#27272A] flex items-center justify-between px-4 text-[11px] font-mono text-[#71717A]"><span>BACKEND: <span className={backendStatus==='connected'?'text-[#10B981]':'text-[#F43F5E]'}>{backendStatus.toUpperCase()}</span></span><span>API: http://localhost:5000/api</span></footer>
    </div></div>;
}
