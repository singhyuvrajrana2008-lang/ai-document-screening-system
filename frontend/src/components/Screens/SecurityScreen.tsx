import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RotateCw, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Network, 
  Lock, 
  Server, 
  Database,
  FileCheck2,
  KeyRound,
  Check
} from 'lucide-react';
import { MockIntegrationService } from '../../types';
import { INITIAL_MOCK_SERVICES } from '../../data/mockData';

export const SecurityScreen: React.FC = () => {
  const [services, setServices] = useState<MockIntegrationService[]>(INITIAL_MOCK_SERVICES);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState('14:12:09 UTC');

  const handleRefreshToken = () => {
    setIsRefreshingToken(true);
    setTokenFeedback('Cryptographic handshake in progress with Key Vault...');

    setTimeout(() => {
      setIsRefreshingToken(false);
      setSessionTime(new Date().toLocaleTimeString() + ' UTC');
      setTokenFeedback('Session Token successfully rotated (SHA-256 Signature Valid).');
      
      setTimeout(() => {
        setTokenFeedback(null);
      }, 3500);
    }, 800);
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        let nextStatus: MockIntegrationService['status'] = 'ONLINE';
        if (s.status === 'ONLINE') nextStatus = 'DEGRADED';
        else if (s.status === 'DEGRADED') nextStatus = 'SIMULATED';
        else if (s.status === 'SIMULATED') nextStatus = 'LOCAL DEMO';
        else nextStatus = 'ONLINE';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-150 font-mono text-xs">
      {/* Toast Notification */}
      {tokenFeedback && (
        <div className="fixed top-14 right-6 z-50 px-4 py-2.5 bg-[#10B981]/20 border border-[#10B981] text-[#A7F3D0] rounded shadow-xl flex items-center gap-2.5 animate-in slide-in-from-right duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{tokenFeedback}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-[#10B981] font-bold tracking-wider uppercase">
              GOVERNANCE &amp; HARDENING
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            SECURITY &amp; ACCESS CONTROLS
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Officer credentials, cryptographic session parameters, and integration telemetry.
          </p>
        </div>

        {/* Refresh Token Button */}
        <button
          onClick={handleRefreshToken}
          disabled={isRefreshingToken}
          className="bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] text-white text-xs font-medium px-3 py-2 rounded transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 text-[#10B981] ${isRefreshingToken ? 'animate-spin' : ''}`} />
          <span>ROTATE SESSION KEY</span>
        </button>
      </div>

      {/* Prototype Environment Warning Banner */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-3 flex items-center gap-3 text-xs text-[#FDE68A]">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B]" />
        <div className="flex-1">
          <span className="font-bold tracking-wider uppercase block mb-0.5 text-[11px]">
            SANDBOX ENVIRONMENT ACTIVE
          </span>
          <span className="text-[#A1A1AA] text-[11px]">
            Running in isolated screening node. Mock endpoint adjustments immediately update runtime simulation parameters.
          </span>
        </div>
      </div>

      {/* Main Grid Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Officer Identity & Role */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                  OFFICER IDENTITY &amp; ROLE
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 tracking-wider">
                VERIFIED ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#09090B] p-3 rounded border border-[#27272A]">
                <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-1">
                  CURRENT ROLE
                </span>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  Authorized Screening Officer
                </h4>
                <p className="text-[11px] text-[#10B981]">
                  ID: 8824-AX-99Q
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#27272A] text-[11px] text-[#71717A] space-y-1">
                  <div>ORG: <span className="text-[#A1A1AA]">National Border Authority</span></div>
                  <div>CLEARANCE: <span className="text-[#10B981]">LEVEL-IV TOP SECRET</span></div>
                </div>
              </div>

              <div className="bg-[#09090B] p-3 rounded border border-[#27272A]">
                <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-2">
                  ACTIVE PERMISSIONS
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Read: Global DB Registry</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Write: Verification Ledger</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Override: Discrepancies</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71717A]">
                    <XCircle className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                    <span>Admin: System Core (Denied)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Data */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#10B981]" />
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                SESSION TELEMETRY
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#09090B] border border-[#27272A] p-3 rounded">
                <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-1">
                  SESSION STATE
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  CONNECTED
                </div>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-3 rounded">
                <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-1">
                  LOGIN TIME
                </span>
                <div className="text-xs text-white font-bold">
                  08:42:11 UTC
                </div>
                <span className="text-[10px] text-[#71717A]">Today</span>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-3 rounded">
                <span className="text-[9px] font-bold tracking-wider text-[#71717A] uppercase block mb-1">
                  LAST HANDSHAKE
                </span>
                <div className="text-xs text-white font-bold">
                  {sessionTime}
                </div>
                <span className="text-[10px] text-[#71717A]">Active sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Security Protocols */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                SECURITY PROTOCOLS
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#27272A]">
                <span className="text-[#71717A]">Authentication</span>
                <span className="text-[#10B981] font-bold">ACTIVE (MFA)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#27272A]">
                <span className="text-[#71717A]">Session Transport</span>
                <span className="text-[#10B981] font-bold">ENCRYPTED (TLS 1.3)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#27272A]">
                <span className="text-[#71717A]">Audit Logging</span>
                <span className="text-[#10B981] font-bold">ENABLED (WORM)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#71717A]">Data Residency</span>
                <span className="text-white font-bold">US-EAST-1</span>
              </div>
            </div>
          </div>

          {/* Integration Hub (Mock) */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                  INTEGRATION NODES
                </h3>
              </div>
              <span className="text-[10px] text-[#71717A]">
                Click pill to toggle state
              </span>
            </div>

            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="p-2.5 bg-[#09090B] border border-[#27272A] rounded flex items-center justify-between hover:border-[#3F3F46] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#71717A]">
                      {svc.id === 'nat-reg' && <Database className="w-3.5 h-3.5" />}
                      {svc.id === 'visa-reg' && <FileCheck2 className="w-3.5 h-3.5" />}
                      {svc.id === 'blacklist-svc' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {svc.id === 'id-ref' && <Server className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">
                        {svc.name}
                      </div>
                      <div className="text-[10px] text-[#71717A]">
                        {svc.endpointType} • {svc.responseTimeMs}ms
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleServiceStatus(svc.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                      svc.status === 'ONLINE'
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25'
                        : svc.status === 'SIMULATED'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/25'
                        : svc.status === 'LOCAL DEMO'
                        ? 'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46] hover:text-white'
                        : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
                    }`}
                  >
                    {svc.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

