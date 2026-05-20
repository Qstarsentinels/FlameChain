import { EnergyPoint, Peer, RealityShard, TelemetryState, GENESIS_HASH } from '../constants';

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
    architectBalance: 1240.58,
    blockHeight: 7292,
    walletAddress: undefined
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
          this.telemetry.charging = battery.charging;
          this.telemetry.level = battery.level;
          this.notify();
        };

        battery.addEventListener('chargingchange', updateTelemetry);
        battery.addEventListener('levelchange', updateTelemetry);
        updateTelemetry();
      }
    } catch (e) {
      console.warn("Battery API not accessible:", e);
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
      
      // Base wattage depends on charging status
      // If charging, we simulate higher throughput
      const baseWatts = this.telemetry.charging ? (45 + Math.random() * 20) : (0.5 + Math.random() * 0.5);
      const jitter = (Math.random() - 0.5) * (this.telemetry.charging ? 5 : 0.1);
      
      this.telemetry.wattage = baseWatts + jitter;
      this.telemetry.jitter = Math.abs(jitter);

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

  private runConsensusPhase() {
    // 1. Reset Agents
    this.telemetry.agents.forEach(a => {
      a.status = 'VOTING';
      a.vote = undefined;
    });
    this.notify();

    // 2. Simulate Voting Sequence
    setTimeout(() => {
      this.telemetry.agents[0].vote = 1;
      this.telemetry.agents[0].status = 'COMMITTED';
      this.notify();
    }, 1500);

    setTimeout(() => {
      this.telemetry.agents[1].vote = 1;
      this.telemetry.agents[1].status = 'COMMITTED';
      this.notify();
    }, 3000);

    setTimeout(() => {
      this.telemetry.agents[2].vote = 1;
      this.telemetry.agents[2].status = 'COMMITTED';
      
      // 3. Commit Block & Distribute Yield
      this.telemetry.blockHeight++;
      const currentYield = this.telemetry.yieldCurve[0]?.yield || 10;
      const architectTax = currentYield * 0.10;
      this.telemetry.architectBalance += architectTax;
      
      this.notify();
      
      // Reset after brief delay
      setTimeout(() => {
        this.telemetry.agents.forEach(a => a.status = 'IDLE');
        this.notify();
      }, 2000);
    }, 4500);
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
