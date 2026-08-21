import React from 'react';
import { ScreenType } from '../../types';
import { 
  Shield, 
  LayoutDashboard, 
  UserSearch, 
  History, 
  Boxes, 
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity
} from 'lucide-react';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentScreen, 
  onNavigate,
  pendingCount = 4
}) => {
  const navItems = [
    {
      id: 'command-center' as ScreenType,
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'new-screening' as ScreenType,
      label: 'New Screening',
      icon: UserSearch,
      badge: 'LIVE'
    },
    {
      id: 'audit-history' as ScreenType,
      label: 'Audit History',
      icon: History,
      badge: pendingCount > 0 ? `${pendingCount}` : null
    },
    {
      id: 'security' as ScreenType,
      label: 'Mock Integrations',
      icon: Boxes,
      badge: null
    },
    {
      id: 'security' as ScreenType,
      label: 'Security & Access',
      icon: ShieldCheck,
      badge: null
    }
  ];

  return (
    <nav className="w-64 h-screen fixed left-0 top-0 bg-[#09090B] border-r border-[#27272A] flex flex-col justify-between z-40 select-none">
      {/* Brand Header */}
      <div>
        <div 
          onClick={() => onNavigate('command-center')} 
          className="p-4 border-b border-[#27272A] cursor-pointer hover:bg-[#18181B] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#10B981] flex items-center justify-center text-[#09090B] font-bold">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-white font-mono leading-none">
                VERIFAI
              </div>
              <div className="text-[9px] tracking-widest text-[#71717A] uppercase font-mono mt-1">
                AI IDENTITY SCREENING
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="py-3 flex flex-col gap-0.5">
          <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
            Navigation
          </div>

          {navItems.map((item, idx) => {
            const isItemActive = 
              (item.label === 'Mock Integrations' && currentScreen === 'security') ||
              (item.label === 'Security & Access' && currentScreen === 'security') ||
              item.id === currentScreen;

            const IconComponent = item.icon;

            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-mono transition-colors text-left ${
                  isItemActive
                    ? 'bg-[#27272A] text-white font-medium border-l-2 border-[#10B981]'
                    : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4 h-4 ${isItemActive ? 'text-[#10B981]' : 'text-[#71717A]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                    item.badge === 'LIVE' 
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold'
                      : 'bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Footer */}
      <div className="p-3 border-t border-[#27272A] bg-[#09090B] text-[11px] font-mono text-[#71717A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>SYS.STAT: <strong className="text-[#10B981] font-medium">OPTIMAL</strong></span>
        </div>
        <span className="text-[#52525B]">v4.2.1</span>
      </div>
    </nav>
  );
};

