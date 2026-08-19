export const GENESIS_HASH = "5721582c9690d6c7407ae7976486e906bb5a07090ab83a5dfa0f1ba6f6ab504bc10360b0d097d14b9c7729eaa7bfb7d5";

export interface EnergyPoint {
  time: string;
  watts: number;
  jitter: number;
}

export interface Peer {
  id: string;
  type: 'BLE' | 'WiFi';
  strength: number;
  lastSeen: number;
}

export interface RealityShard {
  signature: string;
  timestamp: number;
  data: {
    level: number;
    charging: boolean;
    wattageDelta: number;
  };
}

export interface QuantumMetric {
  label: string;
  value: string;
  unit: string;
  trend: number;
}

export interface YieldPoint {
  block: number;
  yield: number;
}

export interface Agent {
  name: string;
  role: string;
  status: 'IDLE' | 'VOTING' | 'COMMITTED';
  vote?: -1 | 0 | 1;
}

export interface RegionalStats {
  region: string;
  activeNodes: number;
  latency: number;
  totalWh: number;
}

export interface HardwareHealth {
  temp: number;
  cpuLoad: number;
  ramUsage: number;
  status: 'OPTIMAL' | 'THERMAL_LIMIT' | 'THROTTLED';
}

export interface MITEngineState {
  status: 'HYBERNATING' | 'REBUILDING' | 'OPTIMIZING';
  rebuildProgress: number;
  kernelVersion: string;
  entropyConsumed: number;
}

export interface DistillationState {
  isDistilling: boolean;
  progress: number;
  modelName: string;
  activeParameters: string;
  injectionsCount: number;
  lastFalconSig: string;
  latestOffset: number;
  logs: string[];
}

export interface ProofOfWattsValidation {
  isValid: boolean;
  timestamp: string;
  isoTimestamp: string;
  deviceId: string;
  charging: boolean;
  wattage: number;
  voltageJitter: number;
  thermalSignature: number;
  powHash: string;
  firebasePath: string;
  syncedToFirebase: boolean;
  instantRewardMinted: number;
  entropyJoules: number;
  verificationMethod: string;
}

export interface ProofOfWattsState {
  status: 'VALIDATED' | 'VALIDATING' | 'STANDBY';
  lastValidation?: ProofOfWattsValidation;
  firebaseSyncLogs: string[];
  validationHistory: ProofOfWattsValidation[];
  activeMiningRate: string;
  activeSessionDurationSec: number;
  lastFirebaseSyncTime?: string;
}

export interface TelemetryState {
  charging: boolean;
  level: number;
  wattage: number;
  jitter: number;
  mWhMinedTotal: number;
  flameTokensMinted: number;
  lastShard?: RealityShard;
  yieldCurve: YieldPoint[];
  quantumProfile: QuantumMetric[];
  agents: Agent[];
  architectBalance: number;
  blockHeight: number;
  walletAddress?: string;
  pqcAddress?: string;
  isPQCReady: boolean;
  mitEngine: MITEngineState;
  distillation: DistillationState;
  proofOfWatts: ProofOfWattsState;
  regionalStats: RegionalStats[];
  hardwareHealth: HardwareHealth;
}
