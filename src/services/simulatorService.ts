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
    jitter: 0
  };

  constructor() {
    this.initBatteryTelemetry();
    this.startSimulation();
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
      
      this.notify();
    }, 10000);

    // Simulate Peer Discovery
    this.startScanning();
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

  private triggerConsensusEvent() {
    const scores: (-1 | 0 | 1)[] = [1, 1, 1, 0, -1];
    const score = scores[Math.floor(Math.random() * scores.length)];
    const statusMap = { '1': 'VALID', '0': 'PRUNED', '-1': 'REJECTED' } as const;

    this.events.unshift({
      id: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
      shardHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      score,
      status: statusMap[score.toString() as keyof typeof statusMap],
    });

    if (this.events.length > 50) this.events.pop();
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
}

export const simulator = new FlamechainSimulator();
