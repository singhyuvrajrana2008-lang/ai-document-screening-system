import React, { useState } from 'react';
import { ScreenType } from '../../types';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck, 
  X,
  RefreshCw,
  Cpu,
  Activity
} from 'lucide-react';

interface TopAppBarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onSignOut: () => void;
  onQuickSearch?: (query: string) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentScreen,
  onNavigate,
  onSignOut,
  onQuickSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Tamper Anomaly Detected',
      desc: 'SCR-00840 flagged with 82% anomaly on laminate layer.',
      time: '3m ago',
      type: 'alert'
    },
    {
      id: '2',
      title: 'Watchlist Sync Completed',
      desc: 'Interpol SLTD database updated (28,941 delta records).',
      time: '12m ago',
      type: 'info'
    },
    {
      id: '3',
      title: 'High Volume Ingestion Node',
      desc: 'Terminal Gate 4 throughput increased +18%.',
      time: '24m ago',
      type: 'info'
    }
  ]);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'new-screening':
        return 'NEW SCREENING';
      case 'audit-history':
        return 'AUDIT HISTORY';
      case 'security':
        return 'SECURITY & ACCESS';
      case 'command-center':
      default:
        return 'COMMAND CENTER';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onQuickSearch && searchQuery.trim()) {
      onQuickSearch(searchQuery.trim());
      onNavigate('audit-history');
    }
  };

  return (
    <>
      <header className="h-11 bg-[#09090B] border-b border-[#27272A] flex items-center justify-between px-4 z-30 sticky top-0 font-mono text-xs select-none">
        {/* Title & Live Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#52525B]">VERIFAI /</span>
            <span className="font-bold text-white tracking-wider">
              {getScreenTitle()}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-[#27272A] text-[11px] text-[#71717A]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#52525B]">THROUGHPUT:</span>
              <span className="text-white font-medium">1,422 REQ/S</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#52525B]">RISK INDEX:</span>
              <span className="text-[#10B981] font-medium">0.04 Low</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Entity ID or Doc #..."
              className="w-52 lg:w-60 bg-[#18181B] border border-[#27272A] rounded pl-8 pr-3 py-1 text-xs text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#3F3F46] transition-colors"
            />
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-1 relative">
            {/* Notification Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded text-[#A1A1AA] hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F43F5E] rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 rounded text-[#A1A1AA] hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              title="System Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-[#18181B] border border-[#27272A] rounded-md shadow-xl z-50 p-3 animate-in fade-in duration-100">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#27272A]">
                  <span className="text-xs font-bold text-white tracking-wider uppercase">
                    Alerts &amp; Feeds ({notifications.length})
                  </span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[#71717A] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-2.5 rounded border text-xs ${
                        notif.type === 'alert' 
                          ? 'bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#FDA4AF]' 
                          : 'bg-[#27272A]/50 border-[#27272A] text-[#A1A1AA]'
                      }`}
                    >
                      <div className="flex justify-between items-start font-medium text-white mb-0.5">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-[#71717A]">{notif.time}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#A1A1AA]">{notif.desc}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setNotifications([]);
                    setShowNotifications(false);
                  }}
                  className="w-full mt-2.5 py-1 text-[10px] text-[#71717A] hover:text-white text-center border-t border-[#27272A]"
                >
                  Clear All Alerts
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[#27272A]"></div>

          {/* Officer Info & Sign Out */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium text-white">
                Officer 8824-AX
              </span>
              <button
                onClick={onSignOut}
                className="text-[10px] text-[#71717A] hover:text-[#F43F5E] transition-colors text-right flex items-center justify-end gap-1 cursor-pointer"
              >
                <span>Sign Out</span>
                <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>

            <div 
              onClick={() => onNavigate('security')}
              className="w-7 h-7 rounded bg-[#27272A] border border-[#3F3F46] flex items-center justify-center cursor-pointer hover:border-[#10B981] transition-colors"
              title="Security & Access Controls"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181B] border border-[#27272A] rounded-lg p-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#27272A] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                  SYSTEM PARAMETERS &amp; DIAGNOSTICS
                </h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-[#71717A] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-[#09090B] p-3 rounded border border-[#27272A] space-y-2 text-[#A1A1AA]">
                <div className="flex justify-between"><span className="text-[#71717A]">ENGINE:</span> <span className="text-white font-medium">VERIFAI Multimodal Neural v4.2</span></div>
                <div className="flex justify-between"><span className="text-[#71717A]">OCR MODULE:</span> <span className="text-white font-medium">Tesseract-DeepVision ICAO 9303</span></div>
                <div className="flex justify-between"><span className="text-[#71717A]">TAMPER MODEL:</span> <span className="text-white font-medium">Forensic Specular ELA v2.8</span></div>
                <div className="flex justify-between"><span className="text-[#71717A]">LATENCY TARGET:</span> <span className="text-[#10B981] font-medium">&lt; 350ms</span></div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#27272A]">
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    onNavigate('security');
                  }}
                  className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded text-xs font-medium tracking-wider"
                >
                  OPEN SECURITY HUB
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 bg-[#10B981] text-[#09090B] rounded text-xs font-bold tracking-wider hover:bg-[#34D399]"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

