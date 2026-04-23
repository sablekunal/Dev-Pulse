import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Terminal, 
  Shield, 
  Cpu, 
  Zap, 
  Code, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Globe,
  LayoutGrid,
  Activity as PulseIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

const LOG_MESSAGES = [
  "> [VISION] Analyzing DOM structure...",
  "> [VISION] Capturing viewport Buffer...",
  "> [AI] Initializing Gemini Vision pipeline...",
  "> [AI] Comparing baseline with current state...",
  "> [AI] Layout regression detected in Node_#42...",
  "> [SYSTEM] Generating code patch via Gemini...",
  "> [SYSTEM] Optimizing CSS remediation...",
  "> [CORE] Protocol HEARTBEAT: HEALTHY",
];

export default function LandingPage({ onLogin, isLoggingIn }: LandingPageProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    if (currentLine >= LOG_MESSAGES.length) return;

    const timer = setTimeout(() => {
      setLogs(prev => [...prev, LOG_MESSAGES[currentLine]]);
      setCurrentLine(prev => prev + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentLine]);

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Aurora Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-7xl">
        <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-full px-8 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dev-Pulse</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/40">
              v0.1.0 // ARCHITECTURE_CORE_ALPHA
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Hero Content Left */}
          <motion.div
            className="relative z-20"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                SRE-CORE-01 Protocol Active
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 relative z-30">
              AUTONOMOUS <br />
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                VISUAL MATRIX
              </span>
            </h1>

            <p className="text-indigo-200/60 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
              Dev-Pulse uses headless browser agents and Google Gemini Vision to see what your users see, 
              instantly catching UI regressions before they hit production.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/30 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="relative px-10 py-4 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {isLoggingIn ? <PulseIcon className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {isLoggingIn ? "Initializing..." : "Initialize Session"}
                </button>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-indigo-200/30">
                <Shield className="w-4 h-4 text-emerald-500/50" />
                Session Secure // Root Auth
              </div>
            </div>
          </motion.div>

          {/* Hero Visual Right: AI Terminal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-10"
          >
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] pointer-events-none" />
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[2.5rem] p-1 flex flex-col shadow-2xl relative z-0 overflow-hidden">
              {/* Box Header */}
              <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/5" />
                  <div className="w-3 h-3 rounded-full bg-white/5" />
                  <div className="w-3 h-3 rounded-full bg-white/5" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/30">
                  <Terminal className="w-3 h-3" />
                  Core-Agent-logs
                </div>
              </div>

              {/* Logs Content */}
              <div className="p-8 h-[360px] font-mono text-[11px] leading-loose text-indigo-200/60 overflow-hidden flex flex-col">
                <div className="flex-1">
                  <AnimatePresence initial={false}>
                    {logs.map((log, i) => (
                      <motion.div 
                        key={`${log}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "mb-1",
                          log.includes("[AI]") && "text-indigo-400 font-bold",
                          log.includes("[SYSTEM]") && "text-purple-400",
                          log.includes("HEALTHY") && "text-emerald-400"
                        )}
                      >
                        {log}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <motion.div 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2.5 h-4 bg-white/20 align-middle ml-1"
                  />
                </div>

                {/* Box Footer Stats */}
                <div className="pt-8 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 opacity-30" />
                      <span className="text-[9px] uppercase font-black tracking-widest text-indigo-200/30">Load: 12.2%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 opacity-30 text-emerald-500" />
                      <span className="text-[9px] uppercase font-black tracking-widest text-indigo-200/30">Agent: Standby</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Box Features Grid */}
      <section className="relative z-10 px-6 pb-40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Playwright Engine (Wide) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                <Globe className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Playwright Engine</h3>
                <p className="text-indigo-200/40 text-sm max-w-md leading-relaxed">
                  Massively parallelized headless Chromium nodes that scrape and render your entire DOM structure in sub-second intervals.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Gemini Vision AI (Tall) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden relative group md:row-span-2"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />
              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mb-10 border border-white/5">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">Gemini <br /> Vision AI</h3>
                <p className="text-indigo-200/40 text-sm leading-relaxed">
                  Not just code diffs. True visual semantic understanding of layout shifts and UX regressions.
                </p>
              </div>
              <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200/20 mb-4">
                  <span>Semantic_Core</span>
                  <span>99.8%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '99.8%' }} transition={{ duration: 1 }} className="h-full bg-indigo-500" />
                </div>
              </div>
            </motion.div>

            {/* Card 3: AUTO-REMEDY */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[3rem] p-12 flex flex-col justify-between relative group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                <Code className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">AUTO-REMEDY</h3>
                <p className="text-indigo-200/40 text-xs leading-relaxed">
                  Instant generation of CSS and React patches to hotfix production regressions.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Real-time SRE Metrics */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl rounded-[3rem] p-12 flex items-center gap-10 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-white/[0.01] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px]" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">SRE Matrix</h3>
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-indigo-200/20">
                    <span className="text-emerald-400/50">Latency: 42ms</span>
                    <span className="text-amber-400/50">Load: 0.12</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 hidden sm:flex items-center justify-center relative z-10">
                <div className="w-full h-12 flex items-end gap-1 px-4">
                  {[...Array(12)].map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: '20%' }}
                      animate={{ height: `${Math.random() * 80 + 20}%` }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                      className="flex-1 bg-white/10 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase mb-4">Dev-Pulse</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-200/20">
            v0.1.0 // ARCHITECTURE_CORE_ALPHA
          </p>
          <div className="mt-20 text-[9px] font-medium text-indigo-200/10 uppercase tracking-[0.2em]">
            © 2026 DEVPULSE_TECHNOLOGIES // ALL_RIGHTS_RESERVED
          </div>
        </div>
      </footer>
    </div>
  );
}
