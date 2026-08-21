import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Brain, 
  History, 
  Users, 
  BadgeCheck, 
  Lock, 
  ArrowRight, 
  Check, 
  KeyRound,
  Fingerprint
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [officerId, setOfficerId] = useState('8824-AX');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthStage('VERIFYING CREDENTIALS...');

    setTimeout(() => {
      setAuthStage('ESTABLISHING ENCRYPTED TLS 1.3 SESSION...');
    }, 350);

    setTimeout(() => {
      setAuthStage('AUTHORIZED. ACCESS GRANTED.');
    }, 750);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] text-[#A1A1AA] antialiased overflow-x-hidden flex flex-col md:flex-row w-full font-mono text-xs selection:bg-[#10B981] selection:text-[#09090B]">
      {/* Background Grid */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none z-0"></div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row w-full">
        {/* Left Column: Brand & Capabilities */}
        <div className="w-full md:w-7/12 lg:w-3/5 p-6 md:p-12 lg:p-16 flex flex-col justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#10B981] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#09090B] fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono leading-none">
                VERIFAI
              </h1>
              <p className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase mt-0.5">
                IDENTITY &amp; DOCUMENT SCREENING SYSTEM
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="my-8 md:my-12 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-4 rounded bg-[#18181B] border border-[#27272A] text-[#10B981] text-[10px] font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              ENTERPRISE BORDER &amp; IDENTITY PLATFORM
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight font-sans">
              HIGH-PRECISION INTELLIGENCE.
            </h2>
            <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed mb-8">
              Real-time OCR extraction, forensic tamper detection, biometric face matching, and explainable risk scores with immutable audit trails.
            </p>

            {/* Capability Cards (Bento layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[11px] font-bold tracking-wider text-white uppercase">
                    AI PIPELINE
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Real-time biometric validation, MRZ checksum calculations, and ELA forensic tampering detection.
                </p>
              </div>

              <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[11px] font-bold tracking-wider text-white uppercase">
                    IMMUTABLE AUDIT
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Cryptographic WORM logging of all screening determinations and supervisor overrides.
                </p>
              </div>

              <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg md:col-span-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[11px] font-bold tracking-wider text-white uppercase">
                      HUMAN-IN-THE-LOOP TRIAGE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Automated routing to supervisor queues for high-risk flags and edge cases.
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-1 rounded text-[#10B981]">
                  <span className="text-[10px] font-bold tracking-wider">ONLINE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-[10px] text-[#71717A] flex flex-wrap gap-3 items-center">
            <span>VERIFAI v4.2.1-HD</span>
            <span>•</span>
            <span>NODE: US-EAST-SEC</span>
            <span>•</span>
            <span>ENCRYPTION: <span className="text-[#10B981]">TLS 1.3 / AES-256</span></span>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="w-full md:w-5/12 lg:w-2/5 bg-[#18181B]/80 border-t md:border-t-0 md:border-l border-[#27272A] flex items-center justify-center p-6 md:p-8 relative">
          <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-lg p-6 md:p-8 relative">
            {/* Header */}
            <div className="mb-6 border-b border-[#27272A] pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-base font-bold text-white font-sans tracking-wide">
                  OFFICER AUTHENTICATION
                </h3>
                <Fingerprint className="w-4 h-4 text-[#10B981]" />
              </div>
              <p className="text-[11px] text-[#71717A]">
                Sign in to access the border screening command terminal.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Officer ID */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase mb-1.5" htmlFor="officer-id">
                  Officer ID
                </label>
                <div className="relative">
                  <BadgeCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    id="officer-id"
                    type="text"
                    required
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. 8824-AX"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#52525B] focus:border-[#3F3F46] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase" htmlFor="password">
                    Password / Passkey
                  </label>
                  <button 
                    type="button"
                    onClick={() => alert('Password reset token dispatched to officer hardware key.')}
                    className="text-[10px] text-[#10B981] hover:underline cursor-pointer"
                  >
                    Reset Key
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#52525B] focus:border-[#3F3F46] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-[#27272A] bg-[#09090B] text-[#10B981] focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-[#A1A1AA]">Keep session active</span>
                </label>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[9px] font-bold tracking-wider">HARDENED</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#10B981] hover:bg-[#34D399] text-[#09090B] font-bold text-xs tracking-wider uppercase py-2.5 rounded transition-colors active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin"></div>
                    <span>{authStage || 'AUTHENTICATING...'}</span>
                  </div>
                ) : (
                  <>
                    <span>SIGN IN TO COMMAND CENTER</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Hint */}
            <div className="mt-4 pt-3 border-t border-[#27272A] text-center">
              <span className="text-[10px] text-[#71717A]">
                DEMO ACCESS: Click &apos;Sign In&apos; with pre-filled credentials
              </span>
            </div>
          </div>

          {/* Bottom Security Label */}
          <div className="absolute bottom-4 w-full text-center px-6">
            <p className="text-[9px] text-[#52525B] flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              AUTHENTICATED TERMINAL • CLASSIFIED BORDER CONTROL NETWORK
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

