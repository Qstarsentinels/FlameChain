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
  Flame
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
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          <div className="w-8 h-8 bg-[#FF4E00] rounded-sm flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(255,78,0,0.3)]">FL</div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white flex items-baseline gap-2">
            Flamechain Sanctuary
            <span className="text-[#FF4E00] text-[10px] font-mono opacity-80 bg-[#FF4E00]/10 px-1 border border-[#FF4E00]/20">PUBLIC_PORTAL</span>
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono text-[#FF4E00] opacity-70 tracking-[0.2em]">MESH_COORDINATES</span>
          <span className="text-[11px] font-mono text-zinc-400">flameGPT.net // PROXY_V1</span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-[#1F2937] overflow-hidden">
        
        {/* Left Sidebar: Instructions & Quantum Profile */}
        <section className="col-span-3 bg-[#0D0F12] p-6 flex flex-col gap-6 overflow-hidden border-r border-[#1F2937]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[#FF4E00]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Sentinel Instructions</h2>
            </div>
            
            <div className="space-y-4 text-[11px] leading-relaxed text-zinc-400 font-mono">
              <p>1. Connect your device to a power source to initiate <span className="text-zinc-200">PPoT</span>.</p>
              <p>2. The <span className="text-zinc-200">Deflationary Yield Model</span> prioritizes early reality proofs.</p>
              <p>3. <span className="text-zinc-200">Quantum Profile</span> metrics ground the mesh in shared physiology.</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2">
              <Cpu size={16} className="text-cyan-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Quantum Profile</h2>
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

          <div className="mt-auto">
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
        </section>

        {/* Center: Live Telemetry, Yield & Terminal */}
        <section className="col-span-9 bg-[#0A0B0D] flex flex-col relative overflow-hidden">
          {/* Welcome Banner */}
          <div className="p-6 bg-[#111827]/50 border-b border-[#1F2937] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Welcome, Sentinel</h2>
                <div className={cn(
                  "px-2 py-0.5 rounded-sm text-[10px] font-bold border flex items-center gap-1.5",
                  state.telemetry.charging ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500" : "border-red-500/30 bg-red-500/5 text-red-500"
                )}>
                  <Zap size={10} fill={state.telemetry.charging ? "currentColor" : "none"} />
                  {state.telemetry.charging ? "SOURCE_LOCKED" : "SOURCE_MISSING"}
                </div>
              </div>
              <p className="text-sm font-mono text-zinc-400 tracking-tight">{welcomeMessage}</p>
            </div>
            
            {/* Agent Consensus Visualizer */}
            <div className="flex gap-4">
              {state.telemetry.agents.map((agent, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-10 h-10 rounded-sm border flex items-center justify-center transition-all bg-black",
                    "border-[#1F2937]"
                  )}>
                    <Cpu size={18} className="text-zinc-500" />
                  </div>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase text-center block w-14 truncate">{agent.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-5 gap-px bg-[#1F2937] overflow-hidden">
             {/* Charts Section */}
             <div className="col-span-3 bg-[#0A0B0D] flex flex-col divide-y divide-[#1F2937]">
                {/* Wattage Jitter */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <ActivityIcon size={14} className="text-[#FF4E00]" />
                      Wattage Jitter Mapping
                    </div>
                    <div className="text-xl font-mono font-black text-white tabular-nums tracking-tighter">
                      {state.telemetry.wattage.toFixed(2)}<span className="text-[10px] ml-1 opacity-50 uppercase tracking-normal">kW</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#0D1117] border border-[#30363D] relative overflow-hidden">
                    <div className="absolute inset-0 grid-bg opacity-10" />
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={state.energyHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <Area type="step" dataKey="watts" stroke="#FF4E00" strokeWidth={1} fill="#FF4E001a" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Deflationary Yield Curve */}
                <div className="h-48 p-6 flex flex-col bg-black/20">
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

             {/* Terminal Section */}
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
                  className="flex-1 p-6 font-mono text-[10px] space-y-1.5 overflow-y-auto custom-scrollbar bg-black/40"
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
          <span className="hidden sm:inline">BANDWIDTH: 1.2 GB/S</span>
          <span className="hidden lg:inline text-zinc-700">COORD: {new Date().toISOString().slice(0, 19)}</span>
        </div>
        <div className="font-bold flex items-center gap-2">
          <Globe size={12} className="text-zinc-700" />
          flameGPT.net // PUBLIC_PORT_NODE_01
        </div>
      </footer>
    </div>
  );
}

function ActivityIcon({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function Globe({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
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

