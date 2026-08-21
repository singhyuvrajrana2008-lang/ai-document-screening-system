import React, { useState } from 'react';
import { ScreenType, ScreeningRecord } from './types';
import { INITIAL_AUDIT_RECORDS } from './data/mockData';
import { Sidebar } from './components/Navigation/Sidebar';
import { TopAppBar } from './components/Navigation/TopAppBar';
import { AuthScreen } from './components/Screens/AuthScreen';
import { CommandCenterScreen } from './components/Screens/CommandCenterScreen';
import { NewScreeningScreen } from './components/Screens/NewScreeningScreen';
import { AuditHistoryScreen } from './components/Screens/AuditHistoryScreen';
import { SecurityScreen } from './components/Screens/SecurityScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('auth');
  const [records, setRecords] = useState<ScreeningRecord[]>(INITIAL_AUDIT_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Navigate to screen handler
  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  // Sign in / Sign out handlers
  const handleLoginSuccess = () => {
    setCurrentScreen('command-center');
  };

  const handleSignOut = () => {
    setCurrentScreen('auth');
  };

  // Save record from New Screening pipeline
  const handleSaveRecord = (newRecord: ScreeningRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setSelectedRecordId(newRecord.id);
  };

  // Select record for detailed inspection in audit
  const handleSelectRecord = (record: ScreeningRecord | null) => {
    if (record) {
      setSelectedRecordId(record.id);
      setCurrentScreen('audit-history');
    } else {
      setSelectedRecordId(null);
    }
  };

  // Count pending reviews
  const pendingCount = records.filter(r => r.status === 'Pending').length;

  // Screen 1: If on Auth screen, show isolated full screen Auth Experience
  if (currentScreen === 'auth') {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Screens 2 - 5: Render inside Command Center Shell Layout
  return (
    <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] font-sans flex antialiased selection:bg-[#10B981] selection:text-[#09090B]">
      {/* Background Grid */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none z-0"></div>

      {/* Left Navigation Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        pendingCount={pendingCount}
      />

      {/* Main Content Area (Offset by Sidebar width: 16rem = w-64) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        {/* Sticky Top App Bar */}
        <TopAppBar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          onQuickSearch={(query) => {
            setCurrentScreen('audit-history');
          }}
        />

        {/* Dynamic Screen View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentScreen === 'command-center' && (
            <CommandCenterScreen
              records={records}
              onStartScreening={() => setCurrentScreen('new-screening')}
              onViewAllAudit={() => setCurrentScreen('audit-history')}
              onSelectRecord={handleSelectRecord}
            />
          )}

          {currentScreen === 'new-screening' && (
            <NewScreeningScreen
              onSaveRecord={handleSaveRecord}
              onNavigateToAudit={() => setCurrentScreen('audit-history')}
            />
          )}

          {currentScreen === 'audit-history' && (
            <AuditHistoryScreen
              records={records}
              selectedRecordId={selectedRecordId}
              onSelectRecord={(rec) => setSelectedRecordId(rec ? rec.id : null)}
            />
          )}

          {currentScreen === 'security' && (
            <SecurityScreen />
          )}
        </main>

        {/* High Density Status Footer Bar */}
        <footer className="h-9 bg-[#09090B] border-t border-[#27272A] flex items-center justify-between px-4 text-[11px] font-mono text-[#71717A] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              <span>CLOUD RELAY: <span className="text-white">CONNECTED (12ms)</span></span>
            </div>
            <span>•</span>
            <div>QUEUE DEPTH: <span className="text-white">0 PENDING</span></div>
          </div>

          <div className="flex items-center gap-3">
            <span>NODE: <span className="text-white">US-EAST-01A</span></span>
            <span>•</span>
            <span>CIPHER: <span className="text-[#10B981]">AES-256-GCM</span></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

