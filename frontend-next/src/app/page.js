'use client';
import { useState } from 'react';
import { useWorkspace } from '../lib/workspaceContext';
import { Sparkles, ShieldCheck, Lock, RefreshCw, Key, ArrowRight, Shield } from 'lucide-react';

export default function Home() {
  const { loginToWorkspace, isLoggingIn } = useWorkspace();
  const [ssoStep, setSsoStep] = useState(0); // 0: select, 1: connecting, 2: token, 3: success

  const handleConnect = async (workspace) => {
    // Start SSO simulation pipeline for visual wow factor
    setSsoStep(1);
    await new Promise((r) => setTimeout(r, 800));
    setSsoStep(2);
    await new Promise((r) => setTimeout(r, 800));
    setSsoStep(3);
    await new Promise((r) => setTimeout(r, 500));
    
    // Perform actual workspace routing via context
    await loginToWorkspace(workspace);
    setSsoStep(0);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-16 bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* Logo / Title */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center justify-center h-14 w-14 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-4">
            <Shield className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-violet-400 bg-clip-text text-transparent">
            AUN Enterprise Gateway
          </h1>
          <p className="mt-3 text-slate-400 text-sm font-semibold flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-emerald-400" /> SSO Single Sign-On Portal
          </p>
        </div>

        {/* SSO Handshake Overlay Dialog */}
        {isLoggingIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
            <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 animate-pulse" />
              
              <div className="flex justify-center mb-6">
                <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">SSO Authentication</h3>
              
              {/* Stepper details */}
              <div className="space-y-4 mt-6 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${ssoStep >= 1 ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-700'}`} />
                  <span className={`text-xs font-semibold ${ssoStep >= 1 ? 'text-cyan-300 font-bold' : 'text-slate-500'}`}>
                    1. Resolving SSO Identity Provider...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${ssoStep >= 2 ? 'bg-indigo-400 shadow-sm shadow-indigo-400' : 'bg-slate-700'}`} />
                  <span className={`text-xs font-semibold ${ssoStep >= 2 ? 'text-indigo-300 font-bold' : 'text-slate-500'}`}>
                    2. Exchanging OAuth Security Tokens...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${ssoStep >= 3 ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`text-xs font-semibold ${ssoStep >= 3 ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                    3. Access Granted. Launching Workspace...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* HR WORKSPACE CARD */}
          <div className="group relative rounded-3xl bg-slate-900/40 border border-slate-900 hover:border-cyan-500/30 p-8 flex flex-col justify-between transition-all duration-300 hover:bg-slate-900/60 hover:-translate-y-1 shadow-xl">
            <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                HR Operations
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Manage employees, directory indexes, secure attendance reporting, leaves, payroll inputs, and recruitment boards.
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-850 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Workspace ID: AUN-HR</span>
              <button
                onClick={() => handleConnect('hr')}
                className="flex items-center gap-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-semibold text-xs px-5 py-2.5 transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                <span>SSO Connect</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MARKETING WORKSPACE CARD */}
          <div className="group relative rounded-3xl bg-slate-900/40 border border-slate-900 hover:border-violet-500/30 p-8 flex flex-col justify-between transition-all duration-300 hover:bg-slate-900/60 hover:-translate-y-1 shadow-xl">
            <div className="absolute top-0 right-0 h-32 w-32 bg-violet-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors">
                Marketing Suite
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Coordinate automated email sequences, leads lists, targeted campaign metrics, and analytical tracking hubs.
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-850 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Workspace ID: AUN-MKTG</span>
              <button
                onClick={() => handleConnect('marketing')}
                className="flex items-center gap-2 rounded-full bg-violet-500/10 hover:bg-violet-500 text-violet-300 hover:text-slate-950 font-semibold text-xs px-5 py-2.5 transition-all shadow-lg hover:shadow-violet-500/20"
              >
                <span>SSO Connect</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Secure Footer Information */}
        <div className="mt-20 flex flex-col items-center gap-3 text-center text-xs text-slate-500">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-850 px-4 py-1.5">
            <Key className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-400">Authenticated Session Key Exchange Active</span>
          </div>
          <p>© 2026 AUN Systems Inc. Protected by End-to-End SSO Protocols.</p>
        </div>

      </div>
    </div>
  );
}
