import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, ShieldCheck, Brain, History, Users } from 'lucide-react';
import { supabase } from '../../supabase';

interface Props { onLoginSuccess: () => void; }

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    else onLoginSuccess();
    setLoading(false);
  };

  return <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] flex font-mono">
    <div className="hidden md:flex md:w-3/5 p-12 flex-col justify-between">
      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-[#10B981] flex items-center justify-center"><Shield className="w-5 h-5 text-[#09090B]"/></div><div><div className="text-xl font-bold text-white">VERIFAI</div><div className="text-[10px] text-[#71717A]">IDENTITY & DOCUMENT SCREENING SYSTEM</div></div></div>
      <div className="max-w-xl"><div className="text-[#10B981] text-[10px] font-bold mb-3">SECURE OFFICER TERMINAL</div><h1 className="text-4xl font-bold text-white font-sans">HIGH-PRECISION INTELLIGENCE.</h1><p className="mt-4 text-sm">Live OCR, validation, tampering analysis, biometric verification and explainable risk assessment through the Flask/Supabase backend.</p><div className="grid grid-cols-2 gap-3 mt-8"><Feature icon={<Brain/>} title="AI PIPELINE"/><Feature icon={<History/>} title="AUDIT TRAIL"/><Feature icon={<Users/>} title="HUMAN REVIEW"/></div></div>
      <div className="text-[10px]">VERIFAI • SUPABASE AUTH • FLASK API</div>
    </div>
    <div className="flex-1 md:w-2/5 flex items-center justify-center p-6 bg-[#18181B] border-l border-[#27272A]">
      <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-lg p-7">
        <h2 className="text-lg font-bold text-white">OFFICER AUTHENTICATION</h2><p className="text-[11px] mt-1">Sign in with the Supabase Auth account assigned to your officer profile.</p>
        <form onSubmit={submit} className="space-y-4 mt-6">
          <label className="block text-[10px] font-bold text-[#A1A1AA]">EMAIL<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="mt-1 w-full bg-[#09090B] border border-[#3F3F46] rounded px-3 py-2 text-white" placeholder="officer@example.com"/></label>
          <label className="block text-[10px] font-bold text-[#A1A1AA]">PASSWORD<div className="relative"><Lock className="absolute left-3 top-2.5 w-3.5"/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required className="mt-1 w-full bg-[#09090B] border border-[#3F3F46] rounded pl-9 pr-3 py-2 text-white" placeholder="Password"/></div></label>
          {error && <div className="text-[#FECDD3] border border-[#F43F5E] bg-[#F43F5E]/10 rounded p-3 text-xs">{error}</div>}
          <button disabled={loading} className="w-full bg-[#10B981] disabled:opacity-50 text-[#09090B] font-bold py-2.5 rounded flex items-center justify-center gap-2">{loading ? 'AUTHENTICATING...' : 'SIGN IN'}<ArrowRight className="w-4"/></button>
        </form>
        <div className="mt-5 text-[10px] text-[#71717A] flex items-center gap-2"><ShieldCheck className="w-3.5"/> Bearer token is attached automatically to protected API calls.</div>
      </div>
    </div>
  </div>;
};

const Feature: React.FC<{icon: React.ReactNode; title: string}> = ({icon,title}) => <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-lg"><div className="text-[#10B981] w-4 mb-2">{icon}</div><div className="text-[10px] text-white font-bold">{title}</div></div>;
