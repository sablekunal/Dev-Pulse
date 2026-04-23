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
  LogOut
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

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
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', url: '' });

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Projects Listener
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
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const runScan = async (project: Project) => {
    if (scanningId) return;
    setScanningId(project.id);

    try {
      // 1. Take Screenshot via Backend
      const scanResponse = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: project.url })
      });

      if (!scanResponse.ok) throw new Error("Failed to capture screenshot");
      const { screenshot, mimeType } = await scanResponse.json();

      // 2. Analyze with Gemini
      const analysisPrompt = `
        Analyze this website screenshot for SRE and UX health. 
        Look for:
        - Visible error messages (404, 500, etc.)
        - Broken layouts or overlapping elements
        - Massive whitespace indicating failed loads
        - "Server Busy" or Timeout screens
        
        Respond ONLY in structured JSON format.
      `;

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
              status: { type: Type.STRING, description: "One word status: Healthy, Degraded, or Critical" },
              confidenceScore: { type: Type.NUMBER },
              issuesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedFix: { type: Type.STRING }
            },
            required: ["status", "confidenceScore", "issuesFound", "recommendedFix"]
          }
        }
      });

      const report: ScanReport = JSON.parse(geminiResponse.text || '{}');

      // 3. Save Results
      const finalStatus = report.status.toLowerCase() === 'healthy' ? 'healthy' : 'critical';
      
      await updateDoc(doc(db, 'projects', project.id), {
        status: finalStatus,
        lastScanAt: serverTimestamp()
      });

      await addDoc(collection(db, 'projects', project.id, 'scans'), {
        ...report,
        createdAt: serverTimestamp(),
        screenshotUrl: `data:${mimeType};base64,${screenshot}` // Storing small screenshot for history
      });

    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanningId(null);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-10 rounded-3xl text-center border-emerald-500/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[64px] rounded-full" />
          
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Activity className="w-8 h-8 text-black" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight uppercase mono mb-2">Dev-Pulse</h1>
          <p className="text-zinc-500 text-sm uppercase mono tracking-widest mb-10">Autonomous SRE Matrix</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              Initialize Session
            </button>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mono pt-4">
              Authorized personnel only // System: SECURE
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase mono">
                Dev-Pulse<span className="text-zinc-500 font-normal ml-2 tracking-normal capitalize font-sans">// Autonomous SRE</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] uppercase tracking-widest mono text-zinc-400">
            <div className="hidden md:block">System: <span className="text-emerald-400">Operational</span></div>
            {user && (
              <>
                <div className="hidden lg:block">Uptime: <span className="text-zinc-100">99.982%</span></div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                  New Node
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 uppercase mono">
              Fleet <span className="text-emerald-500 italic">Status</span>
            </h2>
            <p className="text-zinc-500 max-w-xl text-xs uppercase mono tracking-wider">
              Real-time site reliability matrix // AI-powered visual regression analysis
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] mono text-zinc-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 glass rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "glass p-6 rounded-xl border-l-4 flex flex-col justify-between transition-all duration-300",
                    project.status === 'healthy' ? "border-l-emerald-500 glow-green" : 
                    project.status === 'critical' ? "border-l-rose-500 glow-red" :
                    "border-l-zinc-700"
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
                      <p className="text-[10px] text-zinc-500 mono mt-1 flex items-center gap-1">
                        <span className="truncate max-w-[150px]">{project.url}</span>
                        <a href={project.url} target="_blank" rel="noreferrer" className="hover:text-zinc-300">
                          <ExternalLink className="w-2 h-2" />
                        </a>
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded uppercase mono",
                      project.status === 'healthy' ? "bg-emerald-500/10 text-emerald-500" : 
                      project.status === 'critical' ? "bg-rose-500/10 text-rose-500" :
                      "bg-zinc-500/10 text-zinc-400"
                    )}>
                      {project.status || 'Idle'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider">
                      <span className="text-zinc-500 mono">Node Data</span>
                      <span className={cn(
                        "mono",
                        project.status === 'healthy' ? "text-emerald-400" : 
                        project.status === 'critical' ? "text-rose-400" :
                        "text-zinc-400"
                      )}>
                        {project.status === 'healthy' ? "Stable" : project.status === 'critical' ? "Regression" : "Awaiting Trigger"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider">
                      <span className="text-zinc-500 mono">Last Sync</span>
                      <span className="text-zinc-300 mono">
                        {project.lastScanAt ? new Date(project.lastScanAt.toDate()).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => runScan(project)}
                    disabled={scanningId === project.id}
                    className={cn(
                      "w-full py-2.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-300 mono",
                      scanningId === project.id 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                        : "bg-zinc-100 text-zinc-900 hover:bg-white"
                    )}
                  >
                    {scanningId === project.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      "Run Agent Scan"
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Empty State Help */}
            {projects.length === 0 && !loading && (
              <div className="col-span-full py-24 glass rounded-3xl flex flex-col items-center justify-center text-center border-dashed border-zinc-800">
                <div className="w-12 h-12 glass rounded flex items-center justify-center mb-4 border-zinc-700">
                  <Terminal className="w-5 h-5 text-zinc-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mono">No nodes deployed</h3>
                <p className="text-zinc-600 text-[10px] max-w-sm mt-2 uppercase tracking-wide mono">
                  Connect your endpoints to the Pulse grid
                </p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-6 text-emerald-500 text-[10px] tracking-widest uppercase font-bold hover:text-emerald-400 mono"
                >
                  [ Initialize Deployment ]
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md glass border-emerald-500/20 rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold uppercase mono tracking-tight mb-8">Node <span className="text-emerald-500 italic">Registration</span></h3>
              <form onSubmit={addProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mono mb-2">Identifier</label>
                  <input 
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    placeholder="E.G. CORE-ALPHA-01"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-4 py-3 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mono mb-2">Endpoint URL</label>
                  <input 
                    required
                    type="url"
                    value={newProject.url}
                    onChange={e => setNewProject({...newProject, url: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-4 py-3 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors mono transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 mono"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] mono"
                  >
                    Register Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer from Design */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center text-[10px] mono text-zinc-600 gap-4 mt-auto">
        <p>© 2024 DEV-PULSE ARCHITECTURE // SRE-CORE-01</p>
        <p className="flex items-center gap-4">
          <span>LATENCY: 12ms</span>
          <span>MEMORY: 421MB</span>
          <span>NODE: V20.10.0</span>
        </p>
      </footer>
    </div>
  );
}
