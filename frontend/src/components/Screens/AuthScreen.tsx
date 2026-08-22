import React, { useState } from 'react';
import { Shield, ShieldCheck, Brain, History, Users, BadgeCheck, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import { signInOfficer } from '../../services/api';

interface AuthScreenProps { onLoginSuccess: () => void; }

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [officerId, setOfficerId] = useState('8824-AX');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAuthStage('VERIFYING CREDENTIALS...');
    try {
      await signInOfficer(officerId, password, rememberSession);
      setAuthStage('AUTHORIZED. ACCESS GRANTED.');
      setTimeout(onLoginSuccess, 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setIsLoading(false);
      setAuthStage('');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] text-[#A1A1AA] antialiased overflow-x-hidden flex flex-col md:flex-row w-full font-mono text-xs selection:bg-[#10B981] selection:text-[#09090B]">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none z-0" />
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row w-full">
        <div className="w-full md:w-7/12 lg:w-3/5 p-6 md:p-12 lg:p-16 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#10B981] flex items-center justify-center"><Shield className="w-5 h-5 text-[#09090B] fill-current" /></div>
            <div><h1 className="text-xl font-bold tracking-tight text-white leading-none">VERIFAI</h1><p className="text-[10px] font-bold tracking-wider text-[#71717A] uppercase mt-0.5">IDENTITY &amp; DOCUMENT SCREENING SYSTEM</p></div>
          </div>
          <div className="my-8 md:my-12 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-4 rounded bg-[#18181B] border border-[#27272A] text-[#10B981] text-[10px] font-bold tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />ENTERPRISE BORDER &amp; IDENTITY PLATFORM</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight font-sans">HIGH-PRECISION INTELLIGENCE.</h2>
            <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed mb-8">Real-time OCR extraction, forensic tamper detection, biometric face matching, and explainable risk scores with immutable audit trails.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Capability icon={<Brain className="w-4 h-4 text-[#10B981]" />} title="AI PIPELINE" text="Real-time biometric validation, MRZ checksum calculations, and ELA forensic tampering detection." />
              <Capability icon={<History className="w-4 h-4 text-[#10B981]" />} title="IMMUTABLE AUDIT" text="Cryptographic WORM logging of all screening determinations and supervisor overrides." />
              <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg md:col-span-2 flex items-center justify-between"><div><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-[#10B981]" /><span className="text-[11px] font-bold tracking-wider text-white uppercase">HUMAN-IN-THE-LOOP TRIAGE</span></div><p className="text-[11px] text-[#71717A]">Automated routing to supervisor queues for high-risk flags and edge cases.</p></div><div className="flex items-center gap-1.5 bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-1 rounded text-[#10B981]"><span className="text-[10px] font-bold tracking-wider">ONLINE</span></div></div>
            </div>
          </div>
          <div className="text-[10px] text-[#71717A] flex flex-wrap gap-3 items-center"><span>VERIFAI v4.2.1-HD</span><span>•</span><span>NODE: LOCAL</span><span>•</span><span>ENCRYPTION: <span className="text-[#10B981]">TLS 1.3 / AES-256</span></span></div>
        </div>

        <div className="w-full md:w-5/12 lg:w-2/5 bg-[#18181B]/80 border-t md:border-t-0 md:border-l border-[#27272A] flex items-center justify-center p-6 md:p-8 relative">
          <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-lg p-6 md:p-8 relative">
            <div className="mb-6 border-b border-[#27272A] pb-4"><div className="flex items-center justify-between mb-1.5"><h3 className="text-base font-bold text-white font-sans tracking-wide">OFFICER AUTHENTICATION</h3><Fingerprint className="w-4 h-4 text-[#10B981]" /></div><p className="text-[11px] text-[#71717A]">Sign in with your Supabase-authenticated officer account.</p></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase mb-1.5" htmlFor="officer-id">Officer ID / Email</label><div className="relative"><BadgeCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" /><input id="officer-id" type="text" required value={officerId} onChange={(e) => setOfficerId(e.target.value)} placeholder="8824-AX or officer@example.com" className="w-full bg-[#09090B] border border-[#27272A] rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#52525B] focus:border-[#3F3F46] focus:outline-none transition-colors" /></div></div>
              <div><label className="block text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase mb-1.5" htmlFor="password">Password / Passkey</label><div className="relative"><Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" /><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full bg-[#09090B] border border-[#27272A] rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#52525B] focus:border-[#3F3F46] focus:outline-none transition-colors" /></div></div>
              <div className="flex items-center justify-between pt-1"><label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={rememberSession} onChange={(e) => setRememberSession(e.target.checked)} className="rounded border-[#27272A] bg-[#09090B] text-[#10B981] focus:ring-0 w-3.5 h-3.5" /><span className="text-[11px] text-[#A1A1AA]">Keep session active</span></label><div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]"><ShieldCheck className="w-3 h-3" /><span className="text-[9px] font-bold tracking-wider">HARDENED</span></div></div>
              {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-300">{error}</div>}
              <button type="submit" disabled={isLoading} className="w-full bg-[#10B981] hover:bg-[#34D399] text-[#09090B] font-bold text-xs tracking-wider uppercase py-2.5 rounded transition-colors active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer mt-2">{isLoading ? <><div className="w-3.5 h-3.5 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" /><span>{authStage || 'AUTHENTICATING...'}</span></> : <><span>SIGN IN TO COMMAND CENTER</span><ArrowRight className="w-3.5 h-3.5" /></>}</button>
            </form>
            <div className="mt-4 pt-3 border-t border-[#27272A] text-center"><span className="text-[10px] text-[#71717A]">Authentication is handled by Supabase Auth; no password is stored by VERIFAI.</span></div>
          </div>
          <div className="absolute bottom-4 w-full text-center px-6"><p className="text-[9px] text-[#52525B] flex items-center justify-center gap-1.5"><Lock className="w-3 h-3" />AUTHENTICATED TERMINAL • CLASSIFIED BORDER CONTROL NETWORK</p></div>
        </div>
      </div>
    </div>
  );
};

const Capability: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg"><div className="flex items-center gap-2 mb-2">{icon}<span className="text-[11px] font-bold tracking-wider text-white uppercase">{title}</span></div><p className="text-[11px] text-[#71717A] leading-relaxed">{text}</p></div>
);
