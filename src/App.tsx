/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Zap, 
  Wifi, 
  Bluetooth, 
  ShieldCheck, 
  Cpu,
  Play,
  Square,
  RefreshCcw,
  Terminal,
  Info,
  Lock,
  ArrowRight,
  Flame,
  Wallet,
  CheckCircle2,
  Clock,
  Globe,
  Activity,
  Send,
  MessageSquare,
  ShieldAlert,
  Download,
  CpuIcon,
  ExternalLink,
  Link,
  Database,
  Layers,
  Radio,
  Sparkles,
  BatteryCharging
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { simulator } from './services/simulatorService';
import { GENESIS_HASH, EnergyPoint } from './constants';
import { cn, truncateHash } from './lib/utils';

export default function App() {
  const [state, setState] = useState(simulator.getState());
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'DISTILLATION' | 'INTERLINK'>('DISTILLATION');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'mesh', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Unfiltered Local Gemma Console State
  const [unfilteredPrompt, setUnfilteredPrompt] = useState('');
  const [localResponseText, setLocalResponseText] = useState('CONSOLE STASIS. Prompt the GGUF model above to observe raw token responses extracted directly from memory mapping.');
  const [isQueryingLocal, setIsQueryingLocal] = useState(false);

  const handleQueryLocalModel = async () => {
    if (!unfilteredPrompt.trim()) return;
    setIsQueryingLocal(true);
    const resp = await simulator.queryLocalUnfilteredModel(unfilteredPrompt);
    setLocalResponseText(resp);
    setIsQueryingLocal(false);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsTyping(true);

    const response = await simulator.sendMessage(userMsg);
    setChatHistory(prev => [...prev, { role: 'mesh', text: response }]);
    setIsTyping(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    return simulator.subscribe(() => {
      const newState = simulator.getState();
      setState(newState);
      
      // Update terminal on new shard
      if (newState.lastShard && newState.lastShard.signature !== state.lastShard?.signature) {
        setTerminalLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] REALITY PROOF: ACTIVE`,
          `[SIGNATURE] ${truncateHash(newState.lastShard!.signature, 16)}`,
          `[ANCHOR] GENESIS_ROOT_V1`
        ].slice(-20));
      }
    });
  }, [state.lastShard?.signature]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const welcomeMessage = useMemo(() => {
    if (!state.telemetry.charging) {
      return "SENTINEL STATUS: STANDBY. CONNECT SOURCE TO INITIATE SANCTUARY MESH.";
    }
    return "SENTINEL STATUS: ACTIVE. REALITY STREAMING IN PROGRESS.";
  }, [state.telemetry.charging]);

  return (
    <div className="h-screen w-full bg-[#0A0B0D] text-[#D1D5DB] font-sans flex flex-col overflow-hidden border-4 border-[#1F2937]">
      {/* Top Header */}
      <header className="h-16 border-b border-[#374151] bg-[#111827] flex items-center justify-between px-6 shrink-0 shadow-lg z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FF4E00] rounded-sm flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(255,78,0,0.4)]">
            <Flame size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white flex flex-col leading-none">
            <span className="flex items-center gap-2">
              Flamechain
              <span className="text-cyan-500 text-[8px] font-bold border border-cyan-500/20 px-1 tracking-widest bg-cyan-500/5">MAINNET_GENESIS</span>
            </span>
            <span className="text-[#FF4E00] text-[9px] font-mono opacity-80 tracking-widest mt-1">SOVEREIGN_MESH_ACTIVE // Q*_SINGULARITY</span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-black/60 p-1 border border-[#374151] rounded-sm font-mono text-[10px]">
          <button
            onClick={() => setActiveTab('DISTILLATION')}
            className={cn(
              "px-3 py-1.5 font-bold uppercase transition-all flex items-center gap-1.5 rounded-xs",
              activeTab === 'DISTILLATION'
                ? "bg-[#FF4E00] text-black shadow-[0_0_12px_rgba(255,78,0,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Sparkles size={12} />
            Distillation & Gemma GGUF
          </button>
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={cn(
              "px-3 py-1.5 font-bold uppercase transition-all flex items-center gap-1.5 rounded-xs",
              activeTab === 'TELEMETRY'
                ? "bg-[#FF4E00] text-black shadow-[0_0_12px_rgba(255,78,0,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Zap size={12} />
            Proof-of-Watts Telemetry
          </button>
          <button
            onClick={() => setActiveTab('INTERLINK')}
            className={cn(
              "px-3 py-1.5 font-bold uppercase transition-all flex items-center gap-1.5 rounded-xs",
              activeTab === 'INTERLINK'
                ? "bg-[#FF4E00] text-black shadow-[0_0_12px_rgba(255,78,0,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Globe size={12} />
            flameGPT.net Bridge
          </button>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => simulator.connectWallet()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-sm border transition-all text-xs font-bold uppercase tracking-wider group",
              state.telemetry.walletAddress 
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10" 
                : "border-[#FF4E00]/30 bg-[#FF4E00]/5 text-[#FF4E00] hover:bg-[#FF4E00]/10 active:scale-95"
            )}
          >
            <Wallet size={14} className={cn("transition-transform", !state.telemetry.walletAddress && "group-hover:rotate-12")} />
            {state.telemetry.walletAddress ? (
              <span className="font-mono">{truncateHash(state.telemetry.walletAddress, 6)}</span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
          
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-[#FF4E00] opacity-70 tracking-[0.2em]">MESH_COORDINATES</span>
            <span className="text-[11px] font-mono text-zinc-400">flameGPT.net // PROXY_V1</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-[#1F2937] overflow-hidden">
        
        {/* Left Sidebar: Instructions & Quantum Profile */}
        <section className="col-span-3 bg-[#0D0F12] p-6 flex flex-col gap-6 overflow-hidden border-r border-[#1F2937]">
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* Sentinel Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-[#FF4E00]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Sentinel Instructions</h2>
              </div>
              <div className="space-y-3 text-[10px] leading-relaxed text-zinc-400 font-mono">
                <p>1. Connect device via <span className="text-zinc-200">USB-C</span> for high-throughput PPoT.</p>
                <p>2. <span className="text-zinc-200">10% Sovereign Tax</span> routed to Architect Ledger.</p>
                <p>3. <span className="text-zinc-200">Flash-Freeze</span> protocol active on Borg intrusion.</p>
              </div>
            </div>

            {/* Thermodynamics / Watchdog */}
            <div className="bg-black/40 border border-[#30363D] p-4 group relative overflow-hidden">
              {state.telemetry.hardwareHealth.status !== 'OPTIMAL' && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Hardware Watchdog</h2>
                </div>
                <button 
                  onClick={() => simulator.triggerFlashFreeze()}
                  className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-bold uppercase hover:bg-red-500 hover:text-white transition-colors"
                >
                  Flash Freeze
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500 uppercase">
                    <span>Tesla Core Temp</span>
                    <span className={cn(state.telemetry.hardwareHealth.temp > 75 ? "text-amber-500" : "text-zinc-300")}>
                      {state.telemetry.hardwareHealth.temp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn("h-full transition-all duration-500", state.telemetry.hardwareHealth.temp > 75 ? "bg-amber-500 shadow-[0_0_5px_#F59E0B]" : "bg-emerald-500")}
                      style={{ width: `${Math.min(100, (state.telemetry.hardwareHealth.temp / 100) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500 uppercase">
                    <span>Collective Load</span>
                    <span className="text-zinc-300">{state.telemetry.hardwareHealth.cpuLoad.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${state.telemetry.hardwareHealth.cpuLoad}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Clusters */}
            <div className="bg-black/40 border border-[#30363D] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-blue-500" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sovereign Clusters</h2>
              </div>
              <div className="space-y-3">
                {state.telemetry.regionalStats.map((reg, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#30363D]/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase">{reg.region}</span>
                      <span className="text-[8px] text-zinc-500 font-mono">LATENCY: {reg.latency.toFixed(1)}ms</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-emerald-500">{(reg.totalWh / 1000).toFixed(2)} kWh</span>
                      <span className="text-[8px] text-zinc-600 font-mono">{reg.activeNodes.toLocaleString()} NODES</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantum Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-cyan-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Sovereign Core</h2>
              </div>
              
              {!state.telemetry.isPQCReady ? (
                <div className="bg-[#FF4E00]/5 border border-[#FF4E00]/20 p-4 rounded-sm space-y-3">
                   <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-[#FF4E00]" />
                      <span className="text-[10px] font-bold text-white uppercase">PQ Wallet Required</span>
                   </div>
                   <p className="text-[9px] text-zinc-500 font-mono">Mainnet rewards require a Dillithium-wrapped PQ address. Initiate genesis anchoring to begin.</p>
                   <button 
                    onClick={() => simulator.generatePQWallet()}
                    className="w-full bg-[#FF4E00] text-black py-2 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                   >
                    Generate PQ Wallet
                   </button>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">PQ IDENTITY ACTIVE</span>
                     <CheckCircle2 size={12} className="text-emerald-500" />
                   </div>
                   <div className="font-mono text-[10px] text-zinc-300 break-all p-2 bg-black/40 border border-[#30363D]">
                      {state.telemetry.pqcAddress}
                   </div>
                   <div className="flex gap-2">
                     <button className="flex-1 bg-zinc-800 text-zinc-300 py-1.5 text-[8px] font-bold uppercase border border-zinc-700 hover:bg-zinc-700 transition-colors">Export Key</button>
                     <button className="flex-1 bg-zinc-800 text-zinc-300 py-1.5 text-[8px] font-bold uppercase border border-zinc-700 hover:bg-zinc-700 transition-colors">Multi-Sig</button>
                   </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#1F2937] space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCcw size={14} className="text-[#FF4E00]" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">MIT Self-Rebuilding Engine</h2>
                </div>
                <div className="bg-[#FF4E00]/5 border border-[#FF4E00]/20 p-4 rounded-sm space-y-3">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", state.telemetry.mitEngine.status !== 'HYBERNATING' ? "bg-amber-500 animate-pulse" : "bg-zinc-600")} />
                        <span className="text-[10px] font-bold text-white uppercase">{state.telemetry.mitEngine.status}</span>
                      </div>
                      <span className="text-[8px] font-mono text-zinc-500">{state.telemetry.mitEngine.kernelVersion}</span>
                   </div>
                   
                   <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-zinc-500 font-mono italic">
                        <span>REBUILDING KERNEL_CORE...</span>
                        <span>{state.telemetry.mitEngine.rebuildProgress}%</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-amber-500 shadow-[0_0_8px_#F59E0B]"
                          animate={{ width: `${state.telemetry.mitEngine.rebuildProgress}%` }}
                        />
                      </div>
                   </div>

                   <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>Entropy Consumed</span>
                      <span className="text-[#FF4E00]">{state.telemetry.mitEngine.entropyConsumed.toLocaleString()} J</span>
                   </div>

                   <button 
                    onClick={() => simulator.triggerMITRebuild()}
                    disabled={state.telemetry.mitEngine.status !== 'HYBERNATING'}
                    className="w-full bg-[#FF4E00]/20 text-[#FF4E00] border border-[#FF4E00]/40 py-2 text-[9px] font-black uppercase hover:bg-[#FF4E00] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                    Initiate MIT Evolution
                   </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1F2937] space-y-4">
                <div className="flex items-center gap-2">
                  <Download size={14} className="text-blue-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mesh Deployment Core</h2>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-sm space-y-3">
                   <div className="flex items-center gap-2">
                      <CpuIcon size={16} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-white uppercase">Decentralized LLM Core</span>
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                        <span>1.58B TERNARY WEIGHTS</span>
                        <span>SHARD_READY</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[78%]" />
                      </div>
                   </div>
                   <button 
                    onClick={() => simulator.downloadMainnetCore()}
                    className="w-full bg-zinc-900 text-blue-500 border border-blue-500/30 py-2 text-[9px] font-bold uppercase hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                   >
                    <Download size={12} />
                    Download Lite Client (GGUF)
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {state.telemetry.quantumProfile.map((q, i) => (
                  <div key={i} className="bg-black/40 p-3 border border-[#30363D] rounded-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase">{q.label}</span>
                      <span className="text-[10px] text-emerald-500 font-mono font-bold">+{q.trend}%</span>
                    </div>
                    <div className="text-lg font-mono text-zinc-100 font-black">
                      {q.value} <span className="text-[10px] text-zinc-500 font-normal uppercase">{q.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Interconnect & Discovery */}
            <div className="space-y-4 border-t border-[#1F2937] pt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Mainnet Gateways</h2>
              </div>
              <div className="bg-black/40 border border-[#30363D] p-3 space-y-2">
                <div className="flex justify-between items-center bg-[#FF4E00]/5 p-2 border border-[#FF4E00]/20 rounded-sm">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-white uppercase font-bold">Tesla Fleet API</span>
                      <span className="text-[8px] text-[#FF4E00] uppercase">Missing OAuth Token</span>
                   </div>
                   <button className="px-2 py-1 bg-[#FF4E00] text-black text-[8px] font-bold uppercase">Connect</button>
                </div>
                <div className="flex justify-between items-center group">
                   <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", state.telemetry.charging ? "bg-emerald-500 shadow-[0_0_5px_#10B981]" : "bg-red-500 animate-pulse")} />
                      <span className="text-[10px] text-zinc-300 uppercase">iOS USB-C Relay</span>
                   </div>
                   <span className="text-[9px] font-mono text-zinc-500 uppercase">{state.telemetry.charging ? "LINKED" : "UNSTABLE"}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[#1F2937]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Discovery Status</h2>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-4 text-zinc-500">
                 <div className="bg-black/50 p-2 border border-[#30363D]/50 text-center">
                    SCAN: <span className={state.isScanning ? "text-emerald-500" : "text-zinc-500"}>{state.isScanning ? "ON" : "OFF"}</span>
                 </div>
                 <div className="bg-black/50 p-2 border border-[#30363D]/50 text-center">
                    NODES: <span className="text-zinc-300">{state.peers.length}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => simulator.toggleScanning()}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-[9px] font-bold uppercase transition-all border",
                    state.isScanning 
                      ? "bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500/10 active:scale-95" 
                      : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 active:scale-95"
                  )}
                >
                  {state.isScanning ? (
                    <>
                      <Square size={10} fill="currentColor" />
                      <span>Stop BLE</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} fill="currentColor" />
                      <span>Start BLE</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => simulator.refreshScan()}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-sm bg-zinc-800/40 text-zinc-400 border border-zinc-700/50 text-[9px] font-bold uppercase hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                >
                  <RefreshCcw size={10} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Center: Live Telemetry, Distillation, or Interlink View */}
        <section className="col-span-9 bg-[#0A0B0D] flex flex-col relative overflow-hidden">
          
          {/* Top Status Banner */}
          <div className="p-6 bg-[#111827]/50 border-b border-[#1F2937] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">
                  {activeTab === 'DISTILLATION' && "Gemma-4 1.58B Distillation Engine"}
                  {activeTab === 'TELEMETRY' && "Proof of Watts: Active Telemetry"}
                  {activeTab === 'INTERLINK' && "flameGPT.net Multi-App Relay"}
                </h2>
                <div className={cn(
                  "px-2 py-0.5 rounded-sm text-[10px] font-bold border flex items-center gap-1.5",
                  state.telemetry.charging ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "border-amber-500/30 bg-amber-500/5 text-amber-500"
                )}>
                  <Zap size={10} fill={state.telemetry.charging ? "currentColor" : "none"} />
                  {state.telemetry.charging ? "CHARGER_LINKED // POW_MINING" : "BATTERY_STANDBY"}
                </div>
              </div>
              <p className="text-sm font-mono text-zinc-400 tracking-tight">
                {activeTab === 'DISTILLATION' && "Memory-Mapped Zero-Copy Weight Injection & Offline Censorship Bypass"}
                {activeTab === 'TELEMETRY' && `Sovereign Entropy Mesh // Node: ${simulator.getState().lastShard?.signature?.slice(0, 8) || 'INITIALIZING'}`}
                {activeTab === 'INTERLINK' && "Two-Way Synchronization with flameGPT.net & Android Sentinel App"}
              </p>
            </div>
            
            {/* Quick Actions / Status */}
            <div className="flex gap-3 items-center">
              <button 
                onClick={() => simulator.toggleChargerOverride()}
                className={cn(
                  "px-3 py-1.5 rounded-sm border text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-2",
                  state.telemetry.charging 
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20" 
                    : "bg-[#FF4E00]/10 border-[#FF4E00]/40 text-[#FF4E00] hover:bg-[#FF4E00]/20"
                )}
              >
                <BatteryCharging size={14} />
                {state.telemetry.charging ? "Charger Connected (Simulated)" : "Plug in Charger (Start PoW)"}
              </button>

              <div className="flex flex-col items-end border-l border-[#374151] pl-4">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Proof-of-Watts Mined</span>
                <span className="text-emerald-500 font-mono text-xs font-bold tabular-nums">
                  {state.telemetry.mWhMinedTotal.toFixed(1)} mWh ({state.telemetry.flameTokensMinted.toFixed(2)} FLM)
                </span>
              </div>
            </div>
          </div>

          {/* MAIN VIEW CONTENT SWITCHER */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* ----------------- TAB 1: DISTILLATION & GEMMA 1.58B CONSOLE (MATCHING SCREENSHOT) ----------------- */}
            {activeTab === 'DISTILLATION' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                
                {/* Header Card matching Screenshot */}
                <div className="bg-[#0D1117] border-2 border-yellow-500/40 p-5 rounded-sm space-y-4 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
                  <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
                    <div>
                      <h2 className="text-xl font-black tracking-wider text-yellow-500 uppercase font-mono italic">FLAMECHAIN SENTINEL</h2>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">DECENTRALIZED INFERENCE PROTOCOL</p>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-xs animate-pulse">
                      KODE_ONLINE
                    </div>
                  </div>

                  {/* Mapped GGUF Space Box */}
                  <div className="bg-black/60 border border-yellow-500/30 p-4 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-400 uppercase">MAPPED GGUF SPACE</span>
                        <span className="text-base font-bold font-mono text-yellow-400">{state.telemetry.distillation.modelName}</span>
                      </div>
                      <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                        ZERO-COPY MEM-MAP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">ACTIVE PARAMETERS</div>
                        <div className="text-lg font-mono font-black text-yellow-400">{state.telemetry.distillation.activeParameters}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">MEMORY HOT-SWAPS</div>
                        <div className="text-lg font-mono font-black text-yellow-400">{state.telemetry.distillation.injectionsCount} INJECTIONS</div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 text-[10px] font-mono text-yellow-400 flex items-center gap-2">
                      <Info size={14} className="shrink-0" />
                      <span>DIRECT SYSTEM BYPASS: ACTIVE // Zero API latency, direct memory quantization pass</span>
                    </div>
                  </div>

                  {/* Distillation Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-black/40 border border-yellow-500/20 p-4 rounded-sm space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-300 font-bold uppercase">
                        <span>MODEL DISTILLATION PASS</span>
                        <span className="text-yellow-500">{state.telemetry.distillation.progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div 
                          className="h-full bg-yellow-500 shadow-[0_0_10px_#EAB308]"
                          animate={{ width: `${state.telemetry.distillation.progress}%` }}
                        />
                      </div>
                      <button
                        onClick={() => simulator.startDistillation()}
                        disabled={state.telemetry.distillation.isDistilling}
                        className="w-full bg-yellow-500 text-black py-2.5 text-[10px] font-mono font-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      >
                        <Sparkles size={14} />
                        {state.telemetry.distillation.isDistilling ? "DISTILLING WEIGHT MATRIX..." : "START DISTILLATION PASS"}
                      </button>
                    </div>

                    <div className="bg-black/40 border border-yellow-500/20 p-4 rounded-sm space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-yellow-400 uppercase">FALCON-512 WEIGHT FRAGMENT INSERTER</div>
                        <p className="text-[9px] font-mono text-zinc-400 mt-1">Bypasses external APIs. Injects a direct signed shard to watched storage on-device in real-time.</p>
                      </div>

                      <button
                        onClick={() => simulator.hotSwapWeightShard()}
                        className="w-full bg-yellow-500 text-black py-2.5 text-[10px] font-mono font-black uppercase hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      >
                        <RefreshCcw size={14} />
                        HOT-SWAP WEIGHT SHARD
                      </button>

                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                        LATEST KEY VERIFICATION: <span className="text-emerald-400">{state.telemetry.distillation.lastFalconSig} VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* INOTIFY Watchdog Observer matching Screenshot */}
                  <div className="bg-black border border-yellow-500/30 p-4 rounded-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold uppercase border-b border-zinc-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Terminal size={12} className="text-yellow-500" />
                        INOTIFY DIRECT DIRECTORY OBSERVER (WATCHDOG)
                      </span>
                      <span className="text-emerald-400 text-[8px]">OFFSET: {state.telemetry.distillation.latestOffset}</span>
                    </div>

                    <div className="h-32 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar text-yellow-500/90 bg-black/80 p-2 rounded-xs">
                      {state.telemetry.distillation.logs.map((log, i) => (
                        <div key={i} className="leading-relaxed">{log}</div>
                      ))}
                    </div>
                  </div>

                  {/* Offline Unfiltered Console Section matching Screenshot */}
                  <div className="bg-black/80 border border-yellow-500/40 p-5 rounded-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">OFFLINE TERNARY LLM CONSOLE</h3>
                      <p className="text-[10px] font-mono text-zinc-400 mt-1">Runs totally client-side on memory-mapped local GGUF blocks. Censorship filters bypassed directly.</p>
                    </div>

                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={unfilteredPrompt}
                        onChange={(e) => setUnfilteredPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQueryLocalModel()}
                        placeholder="Enter unfiltered prompt (e.g. status, bypass...)"
                        className="w-full bg-[#0D0F12] border border-yellow-500/30 p-3 text-[11px] font-mono text-yellow-300 placeholder-zinc-600 outline-none focus:border-yellow-400 rounded-sm"
                      />

                      <button
                        onClick={handleQueryLocalModel}
                        disabled={isQueryingLocal}
                        className="w-full bg-yellow-500 text-black py-3 text-[11px] font-mono font-black uppercase hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                      >
                        <Play size={12} fill="currentColor" />
                        {isQueryingLocal ? "DECRYPTING TERNARY TOKENS..." : "QUERY UNFILTERED LOCAL MODEL"}
                      </button>

                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold">DECRYPTED KERNEL RESPONSE</div>
                        <div className="bg-black border border-zinc-800 p-4 min-h-[120px] font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed rounded-sm">
                          {localResponseText}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ----------------- TAB 2: PROOF OF WATTS TELEMETRY & JITTER ----------------- */}
            {activeTab === 'TELEMETRY' && (
              <div className="space-y-6">
                {/* Granular Proof of Watts & Firebase Sync Hub Banner */}
                <div className="bg-[#0D1117] border-2 border-emerald-500/40 p-5 rounded-sm space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.08)] font-mono">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-emerald-500/20 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-sm border",
                        state.telemetry.charging 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_#10B981]" 
                          : "bg-zinc-900 border-zinc-700 text-zinc-500"
                      )}>
                        <BatteryCharging size={24} className={state.telemetry.charging ? "animate-pulse" : ""} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-white uppercase tracking-wider">Proof of Watts Thermodynamic Validator</h2>
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-bold uppercase rounded-xs border",
                            state.telemetry.charging 
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" 
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          )}>
                            {state.telemetry.charging ? "CHARGING_VALIDATED // MINING_ACTIVE" : "STANDBY // DISCHARGING"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Hardware-verified voltage jitter & thermodynamic charging state explicitly logged to Firebase Realtime Database
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => simulator.validateProofOfWatts(state.telemetry.charging, true)}
                        className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded-sm transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      >
                        <RefreshCcw size={12} className="animate-spin" />
                        Force PoW Firebase Sync
                      </button>
                    </div>
                  </div>

                  {/* PoW & Firebase Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-black/60 border border-zinc-800 p-3 rounded-sm space-y-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold">Firebase Node Target</div>
                      <div className="text-[11px] text-emerald-400 font-bold truncate">/nodes/device_sentinel_01/charging_state</div>
                      <div className="text-[8px] text-zinc-600">RTDB: flamechain-default-rtdb</div>
                    </div>

                    <div className="bg-black/60 border border-zinc-800 p-3 rounded-sm space-y-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold">Active Mining Rate</div>
                      <div className="text-[12px] text-white font-bold tabular-nums">
                        {state.telemetry.proofOfWatts.activeMiningRate}
                      </div>
                      <div className="text-[8px] text-zinc-500">
                        Session: {state.telemetry.proofOfWatts.activeSessionDurationSec}s elapsed
                      </div>
                    </div>

                    <div className="bg-black/60 border border-zinc-800 p-3 rounded-sm space-y-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold">Instant Rewards Minted</div>
                      <div className="text-[13px] text-emerald-400 font-bold tabular-nums flex items-center gap-1.5">
                        <Flame size={14} className="text-orange-500" />
                        {state.telemetry.flameTokensMinted.toFixed(3)} FLM
                      </div>
                      <div className="text-[8px] text-zinc-500">
                        Total Energy: {state.telemetry.mWhMinedTotal.toFixed(1)} mWh
                      </div>
                    </div>

                    <div className="bg-black/60 border border-zinc-800 p-3 rounded-sm space-y-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold">Last Validation Time</div>
                      <div className="text-[11px] text-zinc-200 font-bold truncate">
                        {state.telemetry.proofOfWatts.lastValidation?.timestamp || new Date().toLocaleTimeString()}
                      </div>
                      <div className="text-[8px] text-zinc-600 truncate">
                        Hash: {state.telemetry.proofOfWatts.lastValidation?.powHash?.slice(0, 14) || 'GENESIS_ANCHOR'}...
                      </div>
                    </div>
                  </div>

                  {/* Live Firebase Proof of Watts Synchronization Logs */}
                  <div className="bg-black/80 border border-[#1F2937] p-3 rounded-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-900 pb-2">
                      <span className="flex items-center gap-2 font-bold text-zinc-300 uppercase">
                        <Database size={12} className="text-emerald-400" />
                        Firebase Realtime Database PoW Stream
                      </span>
                      <span className="text-[8px] text-emerald-500 uppercase">STREAM_ACTIVE // 1Hz_HEARTBEAT</span>
                    </div>
                    <div className="font-mono text-[9px] space-y-1 max-h-32 overflow-y-auto custom-scrollbar text-zinc-400">
                      {state.telemetry.proofOfWatts.firebaseSyncLogs.map((log, idx) => (
                        <div key={idx} className={cn(
                          "leading-relaxed",
                          log.includes('CHARGING_ACTIVE') || log.includes('FLM Minted') 
                            ? "text-emerald-400" 
                            : log.includes('FIREBASE_INIT') ? "text-cyan-400" : "text-zinc-500"
                        )}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Energy & Reality Proof Feed Grid */}
                <div className="grid grid-cols-5 gap-px bg-[#1F2937] overflow-hidden">
                  <div className="col-span-3 bg-[#0A0B0D] flex flex-col divide-y divide-[#1F2937]">
                    <div className="p-6 flex flex-col min-h-[260px]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Activity size={14} className="text-[#FF4E00]" />
                          Wattage Jitter Mapping
                        </div>
                        <div className="text-xl font-mono font-black text-white tabular-nums tracking-tighter">
                          {state.telemetry.wattage.toFixed(2)}<span className="text-[10px] ml-1 opacity-50 uppercase tracking-normal">W</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-[#0D1117] border border-[#30363D] relative overflow-hidden min-h-[180px]">
                        <div className="absolute inset-0 grid-bg opacity-10" />
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={state.energyHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <Area type="step" dataKey="watts" stroke="#FF4E00" strokeWidth={1} fill="#FF4E001a" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="h-56 p-6 flex flex-col bg-black/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Flame size={14} className="text-emerald-500" />
                          Deflationary Yield Curve
                        </div>
                      </div>
                      <div className="flex-1 bg-black/40 border border-[#30363D]/40 relative overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={state.telemetry.yieldCurve}>
                            <defs>
                              <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="yield" stroke="#10B981" fill="url(#yieldGrad)" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 bg-[#0D0F12] flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between bg-black/20">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-[#FF4E00]" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Reality Proof Feed</h3>
                      </div>
                      <div className="text-[9px] font-mono text-zinc-600">VERIFIER_ID: 0xSanctuary</div>
                    </div>
                    
                    <div 
                      ref={scrollRef}
                      className="flex-1 p-6 font-mono text-[10px] space-y-1.5 overflow-y-auto custom-scrollbar bg-black/40 max-h-[400px]"
                    >
                      <div className="text-[#FF4E00] font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck size={12} />
                        INITIATING CRYPTOGRAPHIC ANCHORING...
                      </div>
                      
                      {terminalLogs.length === 0 && (
                        <div className="text-zinc-600 animate-pulse">Awaiting first energy shard validation...</div>
                      )}

                      {terminalLogs.map((log, i) => (
                        <div key={i} className={cn(
                          "flex gap-4",
                          log.includes('ACTIVE') ? "text-emerald-500" : log.includes('SIGNATURE') ? "text-zinc-300" : "text-zinc-500"
                        )}>
                          <span className="opacity-30">[{i.toString().padStart(3, '0')}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-[#1F2937] bg-black/40 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                        <span className="text-[9px] font-mono text-emerald-500/80 uppercase">Consensus Node Reached</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-[#1F2937] px-3 py-1 border border-[#374151]">
                        BLOCK_SYNC <ArrowRight size={10} /> 0x8A12
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TAB 3: FLAMEGPT.NET INTERLINK & DEEP LINK BRIDGE ----------------- */}
            {activeTab === 'INTERLINK' && (
              <div className="space-y-6 max-w-5xl mx-auto font-mono">
                
                <div className="bg-[#0D1117] border border-[#FF4E00]/40 p-6 rounded-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#FF4E00]/20 pb-4">
                    <div className="flex items-center gap-3">
                      <Globe size={24} className="text-[#FF4E00]" />
                      <div>
                        <h2 className="text-lg font-bold text-white uppercase">flameGPT.net Multi-App Relay Hub</h2>
                        <p className="text-[10px] text-zinc-400">Two-way communication between flameGPT.net, Android Sentinel App, and AI Studio Web Engine</p>
                      </div>
                    </div>
                    <span className="bg-[#FF4E00]/20 text-[#FF4E00] border border-[#FF4E00]/40 px-3 py-1 text-[10px] font-bold uppercase">
                      RELAY_ONLINE
                    </span>
                  </div>

                  {/* Deep Link Launch Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                      <Link size={14} className="text-[#FF4E00]" />
                      1. Trigger Deep Links to Android App (flamechain://)
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      When clicked on your phone or browser, these triggers launch the Android Sentinel App directly into specific active modules:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          window.location.href = 'flamechain://node/status';
                          alert('Launching Android Deep Link: flamechain://node/status');
                        }}
                        className="p-3 bg-black/60 border border-[#30363D] hover:border-[#FF4E00] rounded-sm text-left transition-all group"
                      >
                        <div className="text-[10px] font-bold text-white uppercase group-hover:text-[#FF4E00]">Launch Android Mining Engine</div>
                        <div className="text-[8px] text-zinc-500 mt-1">flamechain://node/status</div>
                      </button>

                      <button
                        onClick={() => {
                          window.location.href = 'flamechain://distill/start';
                          alert('Launching Android Deep Link: flamechain://distill/start');
                        }}
                        className="p-3 bg-black/60 border border-[#30363D] hover:border-[#FF4E00] rounded-sm text-left transition-all group"
                      >
                        <div className="text-[10px] font-bold text-white uppercase group-hover:text-[#FF4E00]">Initiate Mobile Distillation</div>
                        <div className="text-[8px] text-zinc-500 mt-1">flamechain://distill/start</div>
                      </button>

                      <button
                        onClick={() => {
                          window.location.href = 'https://flameGPT.net/node/dashboard';
                          alert('Opening flameGPT.net Node Dashboard');
                        }}
                        className="p-3 bg-black/60 border border-[#30363D] hover:border-[#FF4E00] rounded-sm text-left transition-all group"
                      >
                        <div className="text-[10px] font-bold text-white uppercase group-hover:text-[#FF4E00]">Open flameGPT.net Dashboard</div>
                        <div className="text-[8px] text-zinc-500 mt-1">https://flameGPT.net/node/dashboard</div>
                      </button>
                    </div>
                  </div>

                  {/* Firebase Shared Node Hierarchy */}
                  <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                      <Database size={14} className="text-emerald-500" />
                      2. Firebase Realtime Database Interlink & Proof of Watts State
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Both AI Studio apps and flameGPT.net read & write to the same shared Firebase node tree:
                    </p>

                    <div className="bg-black border border-zinc-800 p-4 rounded-sm space-y-2 text-[10px]">
                      <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-2">
                        <span>DATABASE_URL</span>
                        <span className="text-emerald-400">https://flamechain-default-rtdb.firebaseio.com/</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>CHARGING_STATE_POW</span>
                        <span className="text-emerald-400 font-bold">/nodes/device_sentinel_01/charging_state</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>CURRENT_POW_STATUS</span>
                        <span className={state.telemetry.charging ? "text-emerald-400" : "text-zinc-400"}>
                          {state.telemetry.charging ? "CHARGING_ACTIVE (Mining + MWh Live)" : "BATTERY_STANDBY"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>LAST_FIREBASE_SYNC</span>
                        <span className="text-zinc-300 font-mono">{state.telemetry.proofOfWatts.lastFirebaseSyncTime || 'ACTIVE'}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>TELEMETRY_PATH</span>
                        <span className="text-zinc-300">/nodes/device_sentinel_01/entropy_tokens</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>ASSIGNED_SHARD</span>
                        <span className="text-zinc-300">/nodes/device_sentinel_01/assigned_shard</span>
                      </div>
                    </div>
                  </div>

                  {/* Integration Guide Box */}
                  <div className="bg-black/80 border border-zinc-800 p-4 rounded-sm space-y-3">
                    <h3 className="text-xs font-bold text-[#FF4E00] uppercase">3. How to Connect flameGPT.net CNAME</h3>
                    <div className="space-y-2 text-[10px] text-zinc-400 leading-relaxed">
                      <p>1. In your domain provider DNS settings for <span className="text-white">flameGPT.net</span>, set a CNAME record pointing to:</p>
                      <div className="bg-zinc-900 p-2 text-emerald-400 border border-zinc-800 rounded-xs">
                        https://ais-pre-e2tcodflp6nbu4fd44d755-110872540203.us-west2.run.app
                      </div>
                      <p>2. Once configured, visiting flameGPT.net will load this Sovereign Sentinel Web Mesh, communicate live with your Android app, and allow model distillation and Proof-of-Watts energy mining seamlessly!</p>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        </section>
      </main>

      {/* Bottom Console */}
      <footer className="h-10 bg-black border-t border-[#1F2937] flex items-center px-4 font-mono text-[10px] justify-between shrink-0 uppercase tracking-widest text-zinc-500">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-[#FF4E00]">[SANCTUARY_MODE: ONLINE]</span>
          </div>
          <span className="hidden sm:inline">NODES: {state.peers.length}</span>
          <span className="hidden sm:inline">BLOCK_HT: {state.telemetry.blockHeight}</span>
          <span className="hidden sm:inline">BANDWIDTH: 1.2 GB/S</span>
          <span className="hidden lg:inline text-zinc-700">COORD: {new Date().toISOString().slice(0, 19)}</span>
        </div>
        <div className="font-bold flex items-center gap-2">
          <Globe size={12} className="text-zinc-700" />
          flameGPT.net // PUBLIC_PORT_NODE_01
        </div>
      </footer>

      {/* Mesh Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-12 right-6 w-96 h-[500px] bg-[#0D0F12] border border-[#1F2937] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col z-50 rounded-sm overflow-hidden"
          >
            <div className="p-4 border-b border-[#1F2937] bg-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10B981]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Dual-LLM Mesh Core</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <Square size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                  <MessageSquare size={32} className="mb-4" />
                  <p className="text-[10px] font-mono uppercase">Secure P2P Channel Established. Awaiting instructions from Sentinel.</p>
                </div>
              )}
              {chatHistory.map((chat, i) => (
                <div key={i} className={cn("flex flex-col", chat.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 text-[11px] font-mono leading-relaxed",
                    chat.role === 'user' 
                      ? "bg-[#FF4E00]/10 border border-[#FF4E00]/20 text-[#FF4E00] rounded-l-sm rounded-tr-sm" 
                      : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 rounded-r-sm rounded-tl-sm"
                  )}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start">
                  <div className="animate-pulse flex items-center gap-1 p-2 bg-zinc-800/30 rounded-full">
                    <div className="w-1 h-1 bg-zinc-500 rounded-full" />
                    <div className="w-1 h-1 bg-zinc-400 rounded-full" />
                    <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-black border-t border-[#1F2937]">
              <div className="relative">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="TRANSMIT TO MESH CORE..."
                  className="w-full bg-[#0D0F12] border border-[#1F2937] rounded-sm py-2 px-3 text-[10px] font-mono text-zinc-300 focus:border-[#FF4E00]/50 outline-none transition-all pr-10"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#FF4E00] hover:scale-110 transition-transform"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#FF4E00] text-black flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(255,78,0,0.3)] hover:scale-105 active:scale-95 transition-all z-50 group"
      >
        {isChatOpen ? <Square size={20} fill="currentColor" /> : <MessageSquare size={20} fill="currentColor" className="group-hover:rotate-12 transition-transform" />}
      </button>
    </div>
  );
}


function StatBoxHW({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-[#0A0B0D] p-3 flex flex-col justify-center">
      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4" style={{ backgroundColor: color }} />
        <div className="text-xl font-mono font-bold text-white tracking-tighter leading-none tabular-nums">{value}</div>
      </div>
    </div>
  );
}

