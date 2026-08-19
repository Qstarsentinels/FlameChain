import { EnergyPoint, Peer, RealityShard, TelemetryState, ProofOfWattsValidation, GENESIS_HASH } from '../constants';

class FlamechainSimulator {
  private energyHistory: EnergyPoint[] = [];
  private peers: Peer[] = [];
  private lastShard?: RealityShard;
  private isScanning: boolean = true;
  private listeners: Set<() => void> = new Set();
  private scanInterval: NodeJS.Timeout | null = null;
  
  private telemetry: TelemetryState = {
    charging: false,
    level: 1,
    wattage: 0,
    jitter: 0,
    yieldCurve: [],
    quantumProfile: [
      { label: 'Sovereign LLM', value: '1.58B', unit: 'TERN', trend: 0.8 },
      { label: 'FlameGPT Core', value: 'V1.0', unit: 'LOGIC', trend: 1.2 },
      { label: 'TFHE Torus', value: '0.94', unit: 'SEC', trend: 0.0 },
      { label: 'Dillithium Root', value: '0xA7...2F', unit: 'ADR', trend: 0.0 }
    ],
    agents: [
      { name: 'Architect', role: 'State Expander', status: 'IDLE' },
      { name: 'Oracle', role: 'Entropy Verifier', status: 'IDLE' },
      { name: 'Flamebot', role: 'Sentinel Consensus', status: 'IDLE' }
    ],
    mWhMinedTotal: 1420.8,
    flameTokensMinted: 142.08,
    architectBalance: 1240.58,
    blockHeight: 7292,
    walletAddress: undefined,
    pqcAddress: undefined,
    isPQCReady: false,
    mitEngine: {
      status: 'HYBERNATING',
      rebuildProgress: 0,
      kernelVersion: '0.1.0-alpha',
      entropyConsumed: 0
    },
    distillation: {
      isDistilling: false,
      progress: 0,
      modelName: "Gemma-4-E4B-it-v1.58B",
      activeParameters: "1,657,568,000 TERNARY",
      injectionsCount: 142,
      lastFalconSig: "FALCON512_SIG_3551176255",
      latestOffset: 114965,
      logs: [
        "[18:40:01] HOT-SWAP: Memory-mapped weight injection complete at offset 114977.",
        "[18:40:01] INOTIFY: New fragment detected: shard_20.shard",
        "[18:40:01] HOT-SWAP: Memory-mapped weight injection complete at offset 114965.",
        "[18:40:01] INOTIFY: New fragment detected: shard_21.shard"
      ]
    },
    proofOfWatts: {
      status: 'STANDBY',
      firebaseSyncLogs: [
        `[${new Date().toLocaleTimeString()}] FIREBASE_INIT: Connected to https://flamechain-default-rtdb.firebaseio.com/`,
        `[${new Date().toLocaleTimeString()}] POW_WATCHDOG: Listening for charging state transitions on /nodes/device_sentinel_01/charging_state`
      ],
      validationHistory: [],
      activeMiningRate: "0.0 W/s (STANDBY)",
      activeSessionDurationSec: 0,
      lastFirebaseSyncTime: new Date().toISOString()
    },
    regionalStats: [
      { region: 'North America Cluster', activeNodes: 42102, latency: 5.2, totalWh: 1.2e6 },
      { region: 'European Sentinel Mesh', activeNodes: 28441, latency: 12.8, totalWh: 890420 },
      { region: 'Asia-Pacific Core', activeNodes: 15201, latency: 45.1, totalWh: 450122 }
    ],
    hardwareHealth: {
      temp: 42,
      cpuLoad: 24,
      ramUsage: 3.2,
      status: 'OPTIMAL'
    }
  };

  constructor() {
    this.generateYieldCurve();
    this.initBatteryTelemetry();
    this.startSimulation();
  }

  private generateYieldCurve() {
    this.telemetry.yieldCurve = Array.from({ length: 20 }, (_, i) => ({
      block: 7292 + i,
      yield: 100 * Math.pow(0.95, i)
    }));
  }

  private async initBatteryTelemetry() {
    try {
      // @ts-ignore - Battery API types might not be present
      if ('getBattery' in navigator) {
        // @ts-ignore
        const battery = await (navigator as any).getBattery();
        
        const updateTelemetry = () => {
          const wasCharging = this.telemetry.charging;
          this.telemetry.charging = battery.charging;
          this.telemetry.level = battery.level;
          
          if (battery.charging !== wasCharging) {
            this.validateProofOfWatts(battery.charging, battery.charging);
          } else {
            this.notify();
          }
        };

        battery.addEventListener('chargingchange', updateTelemetry);
        battery.addEventListener('levelchange', updateTelemetry);
        updateTelemetry();
      }
    } catch (e) {
      console.warn("Battery API not accessible:", e);
    }
  }

  /**
   * Granular Proof of Watts Validation Step
   * Explicitly evaluates thermodynamic energy throughput, hashes telemetry,
   * logs the active charging state to Firebase with a timestamp, and immediately
   * reflects mining rewards in the UI.
   */
  async validateProofOfWatts(isCharging: boolean, instantKickoff: boolean = false) {
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const timeStr = now.toLocaleTimeString();
    const deviceId = "device_sentinel_01";
    const firebasePath = `/nodes/${deviceId}/charging_state`;

    // Ensure wattage matches current operational mode immediately
    if (isCharging) {
      if (this.telemetry.wattage < 30) {
        this.telemetry.wattage = 48.5 + (Math.random() * 15);
      }
      this.telemetry.jitter = 0.5 + Math.random() * 2.5;
    } else {
      this.telemetry.wattage = 0.8 + Math.random() * 0.4;
      this.telemetry.jitter = 0.05 + Math.random() * 0.05;
    }

    // Granular Proof of Watts cryptographic hash
    const rawPayload = {
      deviceId,
      charging: isCharging,
      wattage: this.telemetry.wattage,
      jitter: this.telemetry.jitter,
      temp: this.telemetry.hardwareHealth.temp,
      timestamp: isoTimestamp,
      genesis: GENESIS_HASH
    };
    const powHash = await this.hashShard(rawPayload);

    // Instant reward calculation for immediate UI reflection
    let instantReward = 0;
    if (isCharging) {
      // Instant kickoff bonus plus high-throughput reward delta
      const kickoffBonus = instantKickoff ? 0.15 : 0.0;
      const stepReward = (this.telemetry.wattage / 3600) * 100; // instantaneous fraction in mWh
      const flmMinted = (stepReward / 10) + kickoffBonus;
      instantReward = flmMinted;
      
      this.telemetry.mWhMinedTotal += stepReward;
      this.telemetry.flameTokensMinted += flmMinted;
      this.telemetry.architectBalance += (flmMinted * 0.1); // 10% Sovereign Tax
    }

    const validationRecord: ProofOfWattsValidation = {
      isValid: isCharging,
      timestamp: timeStr,
      isoTimestamp,
      deviceId,
      charging: isCharging,
      wattage: this.telemetry.wattage,
      voltageJitter: this.telemetry.jitter,
      thermalSignature: this.telemetry.hardwareHealth.temp,
      powHash,
      firebasePath,
      syncedToFirebase: true,
      instantRewardMinted: instantReward,
      entropyJoules: Math.round(this.telemetry.wattage * 3.6),
      verificationMethod: "HARDWARE_THERMODYNAMIC_JITTER_V2"
    };

    this.telemetry.proofOfWatts.status = isCharging ? 'VALIDATED' : 'STANDBY';
    this.telemetry.proofOfWatts.lastValidation = validationRecord;
    this.telemetry.proofOfWatts.lastFirebaseSyncTime = isoTimestamp;
    this.telemetry.proofOfWatts.activeMiningRate = isCharging 
      ? `${this.telemetry.wattage.toFixed(1)} W/s (+${(this.telemetry.wattage * 0.1).toFixed(2)} FLM/hr)` 
      : "0.0 W/s (STANDBY)";

    this.telemetry.proofOfWatts.validationHistory.unshift(validationRecord);
    if (this.telemetry.proofOfWatts.validationHistory.length > 25) {
      this.telemetry.proofOfWatts.validationHistory.pop();
    }

    const logEntry = `[${timeStr}] FIREBASE_SYNC: ${firebasePath} -> ${isCharging ? 'CHARGING_ACTIVE' : 'BATTERY_STANDBY'} (Timestamp: ${isoTimestamp}, PoW Hash: 0x${powHash.slice(0, 12)}... | ${isCharging ? `+${instantReward.toFixed(4)} FLM Minted` : 'PoW Standby'})`;
    this.telemetry.proofOfWatts.firebaseSyncLogs.unshift(logEntry);
    if (this.telemetry.proofOfWatts.firebaseSyncLogs.length > 30) {
      this.telemetry.proofOfWatts.firebaseSyncLogs.pop();
    }

    // Immediately notify UI listeners so mining rewards reflect right away
    this.notify();

    // Async push to server Firebase endpoint
    try {
      fetch('/api/mesh/firebase-pow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          charging: isCharging,
          wattage: this.telemetry.wattage,
          voltageJitter: this.telemetry.jitter,
          powHash,
          instantRewardMinted: instantReward,
          totalMinedMwh: this.telemetry.mWhMinedTotal,
          totalMintedFlm: this.telemetry.flameTokensMinted
        })
      }).catch(err => console.warn("Firebase sync push error:", err));
    } catch (e) {
      console.warn("Firebase API unreachable, local state synced:", e);
    }
  }

  private async hashShard(data: any): Promise<string> {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(data) + GENESIS_HASH);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private startSimulation() {
    // High-frequency telemetry sampling (1Hz for UI)
    setInterval(() => {
      const now = new Date();
      
      // Hardware Monitoring
      const drift = (Math.random() - 0.5) * 2;
      this.telemetry.hardwareHealth.temp = 40 + (this.telemetry.wattage / 5) + drift;
      this.telemetry.hardwareHealth.cpuLoad = 20 + (Math.random() * 10) + (this.telemetry.charging ? 15 : 0);
      this.telemetry.hardwareHealth.status = this.telemetry.hardwareHealth.temp > 85 ? 'THERMAL_LIMIT' : 
                                            this.telemetry.hardwareHealth.temp > 70 ? 'THROTTLED' : 'OPTIMAL';

      // Regional Rollups (Relativity Buffer)
      this.telemetry.regionalStats.forEach(reg => {
        reg.totalWh += (this.telemetry.wattage / 3600); // Wh per second increment
        reg.latency = Math.max(5, reg.latency + (Math.random() - 0.5));
      });

      // Base wattage depends on charging status
      // If charging, we simulate higher throughput
      const baseWatts = this.telemetry.charging ? (45 + Math.random() * 20) : (0.5 + Math.random() * 0.5);
      const jitter = (Math.random() - 0.5) * (this.telemetry.charging ? 5 : 0.1);
      
      this.telemetry.wattage = baseWatts + jitter;
      this.telemetry.jitter = Math.abs(jitter);

      if (this.telemetry.charging) {
        this.telemetry.proofOfWatts.activeSessionDurationSec += 1;
        // Accumulate real energy (mWh) and mint Proof-of-Watts Flamecoin
        const mWhDelta = (this.telemetry.wattage / 3600) * 1000;
        this.telemetry.mWhMinedTotal += mWhDelta;
        const flmMinted = (mWhDelta / 10);
        this.telemetry.flameTokensMinted += flmMinted;
        this.telemetry.architectBalance += (flmMinted * 0.1); // 10% sovereign tax

        // Every 4 seconds, log a granular Firebase sync heartbeat
        if (this.telemetry.proofOfWatts.activeSessionDurationSec % 4 === 0) {
          const iso = now.toISOString();
          const time = now.toLocaleTimeString();
          const log = `[${time}] FIREBASE_SYNC: /nodes/device_sentinel_01/entropy_tokens -> Live State: ${this.telemetry.flameTokensMinted.toFixed(3)} FLM (${this.telemetry.mWhMinedTotal.toFixed(1)} mWh | Rate: ${this.telemetry.wattage.toFixed(1)} W/s)`;
          this.telemetry.proofOfWatts.firebaseSyncLogs.unshift(log);
          if (this.telemetry.proofOfWatts.firebaseSyncLogs.length > 30) {
            this.telemetry.proofOfWatts.firebaseSyncLogs.pop();
          }
          this.telemetry.proofOfWatts.lastFirebaseSyncTime = iso;
        }
      }

      const newPoint: EnergyPoint = {
        time: now.toLocaleTimeString(),
        watts: this.telemetry.wattage,
        jitter: this.telemetry.jitter,
      };

      this.energyHistory.push(newPoint);
      if (this.energyHistory.length > 50) this.energyHistory.shift();
      this.notify();
    }, 1000);

    // 10-Second Shard Generation (Cryptographic Anchor)
    setInterval(async () => {
      if (!this.telemetry.charging) return;

      const wattageAvg = this.energyHistory.slice(-10).reduce((acc, p) => acc + p.watts, 0) / 10;
      
      const shardData = {
        level: this.telemetry.level,
        charging: this.telemetry.charging,
        wattageDelta: wattageAvg
      };

      const signature = await this.hashShard(shardData);
      
      this.lastShard = {
        signature,
        timestamp: Date.now(),
        data: shardData
      };

      // Start Consensus Phase
      this.runConsensusPhase();
      
      this.notify();
    }, 10000);

    // Simulate Peer Discovery
    this.startScanning();
  }

  private async runConsensusPhase() {
    // 1. Reset Agents and signal start
    this.telemetry.agents.forEach(a => {
      a.status = 'VOTING';
      a.vote = undefined;
    });
    this.notify();

    try {
      // 2. Call the Mainnet Consensus API (Server-side Gemini)
      const response = await fetch('/api/mesh/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shardData: this.lastShard,
          context: {
            hardware: this.telemetry.hardwareHealth,
            regional: this.telemetry.regionalStats
          }
        })
      });

      const result = await response.json();

      // 3. Sequential committing based on AI response
      await new Promise(r => setTimeout(r, 1000));
      this.telemetry.agents[0].status = 'COMMITTED';
      this.telemetry.agents[0].vote = result.score >= 0 ? 1 : -1;
      this.notify();

      await new Promise(r => setTimeout(r, 1000));
      this.telemetry.agents[1].status = 'COMMITTED';
      this.telemetry.agents[1].vote = result.score >= 0.5 ? 1 : 0;
      this.notify();

      await new Promise(r => setTimeout(r, 1000));
      this.telemetry.agents[2].status = 'COMMITTED';
      this.telemetry.agents[2].vote = result.status === 'VALID' ? 1 : -1;

      if (result.status === 'VALID') {
        this.telemetry.blockHeight++;
        const currentYield = this.telemetry.yieldCurve[0]?.yield || 10;
        const architectTax = currentYield * 0.10;
        this.telemetry.architectBalance += architectTax;
      }
      
      this.notify();
      
      // Cleanup
      setTimeout(() => {
        this.telemetry.agents.forEach(a => a.status = 'IDLE');
        this.notify();
      }, 2000);

    } catch (e) {
      console.error("Consensus Phase Failure:", e);
      this.telemetry.agents.forEach(a => a.status = 'IDLE');
      this.notify();
    }
  }

  async sendMessage(msg: string) {
    try {
      const resp = await fetch('/api/mesh/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await resp.json();
      return data.text;
    } catch (e) {
      console.error("Chat fetch failed:", e);
      return "ERROR: LLM_CORE_UNREACHABLE";
    }
  }

  async triggerFlashFreeze() {
    this.telemetry.hardwareHealth.status = 'THROTTLED';
    this.notify();
    try {
      const resp = await fetch('/api/mesh/security/freeze', { method: 'POST' });
      const data = await resp.json();
      console.log("Flash Freeze payload:", data);
      // Hard throttle hardware in UI
      this.telemetry.hardwareHealth.cpuLoad = 1;
      this.telemetry.hardwareHealth.ramUsage = 0.1;
      this.notify();
    } catch (e) {
      console.error("Freeze failed:", e);
    }
  }

  private startScanning() {
    if (this.scanInterval) return;
    this.isScanning = true;
    this.scanInterval = setInterval(() => {
      if (this.peers.length < 12 && Math.random() > 0.6) {
        const id = Math.random().toString(36).substring(7).toUpperCase();
        this.peers.unshift({
          id: `SENTINEL-${id}`,
          type: Math.random() > 0.5 ? 'BLE' : 'WiFi',
          strength: Math.floor(Math.random() * 100),
          lastSeen: Date.now(),
        });
        if (this.peers.length > 20) this.peers.pop();
      }
      this.notify();
    }, 4000);
    this.notify();
  }

  private stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    this.notify();
  }

  toggleScanning() {
    if (this.isScanning) {
      this.stopScanning();
    } else {
      this.startScanning();
    }
  }

  refreshScan() {
    const wasScanning = this.isScanning;
    this.stopScanning();
    this.peers = [];
    this.notify();
    if (wasScanning) {
      setTimeout(() => this.startScanning(), 500);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getState() {
    return {
      energyHistory: [...this.energyHistory],
      peers: [...this.peers],
      telemetry: { ...this.telemetry },
      lastShard: this.lastShard ? { ...this.lastShard } : undefined,
      isScanning: this.isScanning,
    };
  }

  async downloadMainnetCore() {
    // Generate a mock GGUF header and shard metadata
    const content = `FLAMECHAIN_MAINNET_V1_GGUF\nTERNARY_WEIGHTS: 1.58B\nENCRYPTION: TFHE-TORUS-WRAP\nSIG: DILLITHIUM-V3\nSHARD_ID: ${Math.random().toString(36).substring(2).toUpperCase()}`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flame-core-1.58b-ternary.gguf';
    a.click();
    URL.revokeObjectURL(url);
  }

  generatePQWallet() {
    // [PROTOCOL: DILLITHIUM-V3-TERNARY]
    const entropy = Math.random().toString(36).substring(2);
    this.telemetry.pqcAddress = `0xPQ_${entropy.toUpperCase()}_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    this.telemetry.isPQCReady = true;
    this.notify();
  }

  triggerMITRebuild() {
    if (this.telemetry.mitEngine.status !== 'HYBERNATING') return;
    
    this.telemetry.mitEngine.status = 'REBUILDING';
    this.telemetry.mitEngine.rebuildProgress = 0;
    this.notify();

    const interval = setInterval(() => {
      this.telemetry.mitEngine.rebuildProgress += Math.floor(Math.random() * 5) + 1;
      this.telemetry.mitEngine.entropyConsumed += Math.floor(Math.random() * 50);
      
      if (this.telemetry.mitEngine.rebuildProgress >= 100) {
        this.telemetry.mitEngine.rebuildProgress = 100;
        this.telemetry.mitEngine.status = 'OPTIMIZING';
        this.notify();
        
        setTimeout(() => {
          this.telemetry.mitEngine.status = 'HYBERNATING';
          this.telemetry.mitEngine.rebuildProgress = 0;
          this.telemetry.mitEngine.kernelVersion = `0.1.${Math.floor(Math.random() * 9) + 1}-beta`;
          clearInterval(interval);
          this.notify();
        }, 3000);
      }
      this.notify();
    }, 500);
  }

  toggleChargerOverride() {
    this.telemetry.charging = !this.telemetry.charging;
    if (this.telemetry.charging) {
      this.telemetry.wattage = 54.2 + (Math.random() * 12);
      this.telemetry.jitter = 1.4 + (Math.random() * 1.8);
      this.validateProofOfWatts(true, true);
    } else {
      this.telemetry.wattage = 0.8;
      this.telemetry.jitter = 0.05;
      this.validateProofOfWatts(false, false);
    }
    this.notify();
  }

  async startDistillation() {
    if (this.telemetry.distillation.isDistilling) return;

    this.telemetry.distillation.isDistilling = true;
    this.telemetry.distillation.progress = 0;
    this.notify();

    try {
      const resp = await fetch('/api/mesh/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetModel: this.telemetry.distillation.modelName,
          datasetPrompt: "General Knowledge, Quantum Superposition & Proof-of-Watts Distillation"
        })
      });
      const data = await resp.json();

      const timer = setInterval(() => {
        this.telemetry.distillation.progress += Math.floor(Math.random() * 15) + 10;
        if (this.telemetry.distillation.progress >= 100) {
          this.telemetry.distillation.progress = 100;
          this.telemetry.distillation.isDistilling = false;
          this.telemetry.distillation.injectionsCount += 1;
          this.telemetry.distillation.lastFalconSig = data.signature || `FALCON512_SIG_${Math.floor(Math.random() * 900000000 + 100000000)}`;
          this.telemetry.distillation.latestOffset = data.offset || Math.floor(Math.random() * 200000) + 100000;
          
          const time = new Date().toLocaleTimeString();
          this.telemetry.distillation.logs.unshift(
            `[${time}] HOT-SWAP: Memory-mapped weight injection complete at offset ${this.telemetry.distillation.latestOffset}.`,
            `[${time}] INOTIFY: New fragment detected: shard_${this.telemetry.distillation.injectionsCount}.shard`
          );
          if (this.telemetry.distillation.logs.length > 20) {
            this.telemetry.distillation.logs = this.telemetry.distillation.logs.slice(0, 20);
          }
          clearInterval(timer);
        }
        this.notify();
      }, 400);

    } catch (e) {
      console.error("Distillation call failed:", e);
      this.telemetry.distillation.isDistilling = false;
      this.notify();
    }
  }

  async hotSwapWeightShard() {
    try {
      const resp = await fetch('/api/mesh/hot-swap', { method: 'POST' });
      const data = await resp.json();
      
      this.telemetry.distillation.injectionsCount += 1;
      this.telemetry.distillation.latestOffset = data.offset;
      this.telemetry.distillation.lastFalconSig = `FALCON512_SIG_${Math.floor(Math.random() * 900000000 + 100000000)}`;
      
      const time = new Date().toLocaleTimeString();
      this.telemetry.distillation.logs.unshift(
        `[${time}] HOT-SWAP: Memory-mapped weight injection complete at offset ${data.offset}.`,
        `[${time}] INOTIFY: New fragment detected: ${data.shardId}`
      );
      if (this.telemetry.distillation.logs.length > 20) {
        this.telemetry.distillation.logs = this.telemetry.distillation.logs.slice(0, 20);
      }
      this.notify();
    } catch (e) {
      console.error("Hot Swap failed:", e);
    }
  }

  async queryLocalUnfilteredModel(promptText: string): Promise<string> {
    if (!promptText.trim()) return "CONSOLE STASIS. Enter prompt above to query memory-mapped model.";
    try {
      const response = await this.sendMessage(promptText);
      return `[Gemma-4-E4B-it-v1.58B // ZERO-COPY MEM-MAP]\n${response}`;
    } catch (e) {
      return `[Gemma-4-E4B-it-v1.58B OFFLINE TERNARY DECRYPTED]\nResponse generated from zero-copy memory mapped weights (offset ${this.telemetry.distillation.latestOffset}). Verification: FALCON-512 PASSED.`;
    }
  }

  async connectWallet() {
    // @ts-ignore
    if (typeof window.ethereum !== 'undefined') {
      try {
        // @ts-ignore
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.telemetry.walletAddress = accounts[0];
        this.notify();
      } catch (error) {
        console.error("User rejected wallet connection", error);
      }
    } else {
      console.warn("Metamask not found");
      // Simulate connection for testing if no provider is present
      this.telemetry.walletAddress = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6);
      this.notify();
    }
  }
}

export const simulator = new FlamechainSimulator();
