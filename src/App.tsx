/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  LogIn,
  LogOut,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, updateDoc, Timestamp, serverTimestamp, limit } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import LandingPage from './components/LandingPage';

// Types
interface Project {
  id: string;
  name: string;
  url: string;
  status: 'healthy' | 'critical' | 'unknown';
  lastScanAt?: any;
  ownerId: string;
}

interface ScanReport {
  status: string;
  confidenceScore: number;
  issuesFound: string[];
  recommendedFix: string;
  suggestedPatch?: string;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [latestScan, setLatestScan] = useState<any>(null);
  const [newProject, setNewProject] = useState({ name: '', url: '' });
  const [ticker, setTicker] = useState("");

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(Math.random().toString(16).substring(2, 20).toUpperCase());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== 'auth/cancelled-popup-request') console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (err) { console.error("Logout failed:", err); }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false);
    });
    return () => unsubscribeProjects();
  }, [user]);

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        status: 'unknown',
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewProject({ name: '', url: '' });
      setShowAddModal(false);
    } catch (err) { console.error("Error adding project:", err); }
  };

  const runScan = async (project: Project) => {
    if (scanningId) return;
    setScanningId(project.id);
    try {
      const scanResponse = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: project.url })
      });
      if (!scanResponse.ok) throw new Error("Failed to capture screenshot");
      const { screenshot, mimeType } = await scanResponse.json();
      
      const analysisPrompt = `Analyze this website screenshot for SRE and UX health. Respond ONLY in structured JSON format. IF YOU FIND ISSUES: Provide a 'suggestedPatch'. This should be a block of code (CSS, React, or HTML) that fixes the issue. If healthy, leave suggestedPatch as an empty string.`;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: analysisPrompt },
          { inlineData: { mimeType, data: screenshot } }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              issuesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedFix: { type: Type.STRING },
              suggestedPatch: { type: Type.STRING }
            },
            required: ["status", "confidenceScore", "issuesFound", "recommendedFix", "suggestedPatch"]
          }
        }
      });

      const report: ScanReport = JSON.parse(geminiResponse.text || '{}');
      const finalStatus = report.status.toLowerCase() === 'healthy' ? 'healthy' : 'critical';
      
      await updateDoc(doc(db, 'projects', project.id), { status: finalStatus, lastScanAt: serverTimestamp() });
      await addDoc(collection(db, 'projects', project.id, 'scans'), { ...report, createdAt: serverTimestamp(), screenshotUrl: `data:${mimeType};base64,${screenshot}` });
    } catch (err) { console.error("Scan failed:", err); } finally { setScanningId(null); }
  };

  if (!user && !loading) return <LandingPage onLogin={handleLogin} isLoggingIn={isLoggingIn} />;

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Aurora Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      {/* Floating Island Container */}
      <div className="max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 relative z-10">
        
        {/* Navigation Glass Pane */}
        <header className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-6 mb-8 flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dev-Pulse</h1>
              <p className="text-[10px] text-indigo-200/40 uppercase tracking-widest font-semibold">Autonomous SRE Matrix</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-medium text-emerald-400">System Active</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Node
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-indigo-200/60 hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Left Column: BENTO FLEET GRID */}
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-8 px-4">
              <h2 className="text-3xl font-bold tracking-tight">Fleet <span className="text-indigo-400">Topology</span></h2>
              <div className="text-xs text-indigo-200/60 font-medium">Monitoring {projects.length} Active Nodes</div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[48px] p-20 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                  <Terminal className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">No active nodes found</h3>
                <p className="text-indigo-200/40 text-sm max-w-xs mx-auto mb-10 leading-relaxed">
                  Connect your first endpoint to initialize autonomous visual monitoring and regression detection.
                </p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-10 py-4 bg-indigo-500 rounded-full text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform"
                >
                  Deploy First Node
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* Agent Cursor Decoration */}
                <motion.div
                  animate={{
                    x: [100, 500, 200, 600, 100],
                    y: [50, 250, 400, 150, 50],
                  }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute pointer-events-none z-20 hidden xl:block"
                >
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] border-2 border-white" />
                     <div className="bg-indigo-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter text-white whitespace-nowrap shadow-lg">
                       AI Agent Scanning
                     </div>
                   </div>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project, idx) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        onClick={() => {
                          setSelectedProject(project);
                          const q = query(collection(db, 'projects', project.id, 'scans'), orderBy('createdAt', 'desc'), limit(1));
                          onSnapshot(q, (sn) => { if (!sn.empty) setLatestScan(sn.docs[0].data()); });
                        }}
                        className={cn(
                          "bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-8 cursor-pointer transition-all duration-500 relative overflow-hidden shadow-sm",
                          selectedProject?.id === project.id && "bg-white/[0.08] border-indigo-500 ring-2 ring-indigo-500/20"
                        )}
                      >
                        <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                              {idx % 2 === 0 ? <Globe className="w-6 h-6 text-indigo-300/60" /> : <LayoutGrid className="w-6 h-6 text-indigo-300/60" />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xl font-bold tracking-tight text-white/90 truncate">{project.name}</h3>
                              <p className="text-[10px] text-indigo-200/40 uppercase font-bold tracking-widest mt-1">PID: {project.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            project.status === 'healthy' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" : 
                            project.status === 'critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]" :
                            "bg-white/5 text-zinc-500 border border-white/5"
                          )}>
                            {project.status || 'Checking'}
                          </div>
                        </div>

                        <div className="mb-10">
                          <div className="text-[10px] text-indigo-200/30 uppercase tracking-widest font-bold mb-2">Endpoint URL</div>
                          <p className="text-sm text-indigo-200/60 truncate font-medium">{project.url}</p>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                           <div className="text-[10px] text-indigo-200/30 uppercase tracking-widest font-bold">
                             {project.lastScanAt ? "Active Scan System" : "Deployment Pending"}
                           </div>
                           <button 
                            onClick={(e) => { e.stopPropagation(); runScan(project); }}
                            disabled={scanningId === project.id}
                            className={cn(
                              "px-6 py-3 rounded-2xl text-[11px] font-bold transition-all duration-300 relative overflow-hidden",
                              scanningId === project.id 
                                ? "bg-white/5 text-zinc-600 cursor-not-allowed" 
                                : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/10"
                            )}
                          >
                            {scanningId === project.id ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Analyzing...
                              </div>
                            ) : (
                              "Run Agent Scan"
                            )}
                          </button>
                        </div>

                        {/* Subtle background glow */}
                        <div className={cn(
                          "absolute -bottom-10 -right-10 w-32 h-32 blur-[50px] opacity-20 pointer-events-none transition-colors duration-1000",
                          project.status === 'healthy' ? "bg-emerald-500" : project.status === 'critical' ? "bg-rose-500" : "bg-indigo-500"
                        )} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI REMEDIATION HUB */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
            {!selectedProject ? (
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-12 text-center min-h-[600px] flex flex-col items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                <div className="relative mb-8">
                  <Activity className="w-16 h-16 text-indigo-500 animate-pulse relative z-10" />
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-4">Intelligence <span className="text-indigo-400">Standby</span></h3>
                <p className="text-indigo-200/40 text-sm leading-relaxed max-w-[240px]">
                  Select a node from the topology map to initialize the autonomous remediation pipeline.
                </p>
              </div>
            ) : latestScan ? (
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-10 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] h-full"
              >
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-xl font-bold">Analysis <span className="text-indigo-400">Report</span></h3>
                  <div className="text-[10px] text-indigo-200/40 font-black uppercase tracking-[0.2em]">{selectedProject.name}</div>
                </div>

                {/* Confidence Bar */}
                <div className="mb-12">
                  <div className="flex justify-between items-end mb-4">
                    <div className="text-[11px] font-bold text-indigo-200/60 uppercase tracking-widest">AI Confidence</div>
                    <div className="text-2xl font-black text-indigo-400">{(latestScan.confidenceScore * 100).toFixed(0)}%</div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${latestScan.confidenceScore * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Anomalies */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/30 mb-6 px-1">Detected Points of Interest</h4>
                    <div className="space-y-4">
                      {latestScan.issuesFound.map((issue: string, i: number) => (
                        <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          </div>
                          <p className="text-xs text-indigo-200/80 leading-relaxed font-medium italic">"{issue}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patch */}
                  {latestScan.suggestedPatch && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/30 mb-6 px-1 text-center">Autonomous Patch Generation</h4>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <pre className="bg-black/40 border border-white/10 rounded-3xl p-6 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed shadow-inner backdrop-blur-3xl relative z-10">
                          <code className="text-emerald-400">
                             {latestScan.suggestedPatch}
                          </code>
                        </pre>
                        <button 
                          onClick={() => navigator.clipboard.writeText(latestScan.suggestedPatch)}
                          className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-xl z-20 group-hover:scale-110 active:scale-95"
                        >
                          <Terminal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vision Capture */}
                  {latestScan.screenshotUrl && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/30 mb-6 px-1">Visual Evidence Buffer</h4>
                      <div className="rounded-[32px] overflow-hidden border border-indigo-500/20 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
                        <img src={latestScan.screenshotUrl} className="w-full grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-700 scale-105 group-hover:scale-100" alt="Telemetry" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-20 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col items-center justify-center min-h-[600px]">
                <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-8" />
                <h3 className="text-xl font-bold mb-3 tracking-tight">Crunching Telemetry</h3>
                <p className="text-indigo-200/30 text-[10px] uppercase font-black tracking-widest">Neural weights aligning...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deploy Node Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-[#030014]/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 50, opacity: 0 }} 
              className="relative w-full max-w-lg bg-white/[0.03] border border-white/[0.1] backdrop-blur-3xl rounded-[48px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Plus className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h4 className="text-3xl font-black tracking-tight">Deploy Node</h4>
                  <p className="text-xs text-indigo-200/40 uppercase font-black tracking-widest mt-1">Satellite Configuration Alpha-1</p>
                </div>
              </div>

              <form onSubmit={addProject} className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/40 ml-2">Node Identifier</label>
                  <input 
                    required 
                    value={newProject.name} 
                    onChange={e => setNewProject({...newProject, name: e.target.value})} 
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-3xl px-8 py-5 text-sm outline-none focus:border-indigo-500/50 transition-all font-medium text-white placeholder:text-zinc-700 shadow-inner" 
                    placeholder="MAIN_SYSTEM_CORE" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/40 ml-2">Endpoint URL</label>
                  <input 
                    required 
                    type="url" 
                    value={newProject.url} 
                    onChange={e => setNewProject({...newProject, url: e.target.value})} 
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-3xl px-8 py-5 text-sm outline-none focus:border-indigo-500/50 transition-all font-medium text-white placeholder:text-zinc-700 shadow-inner" 
                    placeholder="https://console.devpulse.ai" 
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-black py-6 rounded-full text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-indigo-500/40"
                  >
                    Confirm Deployment
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="px-8 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest transition-all text-indigo-200/60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

