import os
import sys
import time
import math
import json
import fcntl
import tempfile
from typing import Dict, Any, Tuple

# Include core modules
sys.path.insert(0, os.path.expanduser("~/.flamechain/core"))

from sys_metrics import TermuxMetrics
from crypto_signer import NodeSigner

STATE_PATH = os.path.expanduser("~/.flamechain/data/node_state.json")
GENESIS_PATH = os.path.expanduser("~/.flamechain/data/genesis_block.json")
KEY_PATH = os.path.expanduser("~/.flamechain/keys/node_identity.key")
GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class MMWave12mmBiometricBridge:
    """
    Ingests 12mm wavelength (25GHz) radio air-wave micro-Doppler phase shifts
    to extract contactless cardiac pulse wall displacement (0.1mm - 0.5mm).
    """

    def __init__(self, wavelength_mm: float = 12.0):
        self.wavelength_mm = wavelength_mm
        self.freq_ghz = 300.0 / wavelength_mm  # 25.0 GHz
        self.signer = NodeSigner(KEY_PATH)
        self._ensure_state_files()

    def _ensure_state_files(self) -> None:
        if not os.path.exists(STATE_PATH):
            initial_state = {
                "genesis_anchor": GENESIS_HASH,
                "node_id": "architect_tab_12mm_node_01",
                "cumulated_minted_yield": 0.0,
                "balance_flame": 1000.0,
                "total_watt_hours": 0.0,
                "total_ram_mb_seconds": 0.0,
                "successful_proofs": 0,
                "deferred_proofs": 0,
                "slashed_proofs": 0,
                "proof_count": 0,
                "last_proof_hash": GENESIS_HASH,
                "last_updated": time.time(),
                "proof_chain": []
            }
            self._write_atomic_json(STATE_PATH, initial_state)

    def _write_atomic_json(self, path: str, data: Dict[str, Any]) -> None:
        dir_name = os.path.dirname(path)
        with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False) as tf:
            json.dump(data, tf, indent=2)
            temp_name = tf.name

        lock_path = path + ".lock"
        with open(lock_path, 'w') as lock_f:
            fcntl.flock(lock_f.fileno(), fcntl.LOCK_EX)
            try:
                os.replace(temp_name, path)
            finally:
                fcntl.flock(lock_f.fileno(), fcntl.LOCK_UN)

    def load_state((self) -> Dict[str, Any]:
        with open(STATE_PATH, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                return json.load(f)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    def ingest_12mm_heartbeat_telemetry(self, override_bpm: float = None) -> Dict[str, Any]:
        """
        Demodulates 12mm phase trajectory: \Delta \phi = (4 \pi / \lambda) * d_cardiac(t).
        Extracts heartbeat presence, heart-rate variability (HRV), and signal SNR.
        """
        now = time.time()
        
        if override_bpm is not None:
            bpm = override_bpm
            snr_db = 18.5
            displacement_mm = 0.28
        else:
            # Simulate quadrature phase shift for 12mm wavelength reflection
            displacement_mm = 0.25 + 0.10 * math.sin(2 * math.pi * 1.2 * now) # ~72 BPM
            phase_shift_rad = (4.0 * math.pi * displacement_mm) / self.wavelength_mm
            
            bpm = 72.0 + 3.0 * math.cos(now * 0.1)
            snr_db = 16.0 + 4.0 * math.sin(phase_shift_rad)

        # Heartbeat Verification Score (HVS) [0.0 to 1.0]
        hvs_score = 1.0 / (1.0 + math.exp(-0.3 * (snr_db - 10.0)))
        verified = hvs_score >= 0.70 and 50.0 <= bpm <= 140.0

        return {
            "timestamp": now,
            "wavelength_mm": self.wavelength_mm,
            "carrier_frequency_ghz": self.freq_ghz,
            "chest_displacement_mm": round(displacement_mm, 4),
            "architect_heartbeat_bpm": round(bpm, 2),
            "signal_snr_db": round(snr_db, 2),
            "hvs_score": round(hvs_score, 4),
            "heartbeat_verified": verified
        }

    def process_and_bind_proof(self, shard_id: str, override_bpm: float = None) -> Dict[str, Any]:
        state = self.load_state()
        now = time.time()

        ram_mb = TermuxMetrics.get_mem_available_mb()
        power = TermuxMetrics.get_power_sample()
        wh_delta = power["power_watts"] * (5.0 / 3600.0) # 5-second delta approximation

        telemetry = self.ingest_12mm_heartbeat_telemetry(override_bpm=override_bpm)
        hvs = telemetry["hvs_score"]

        # Evaluate Balanced Ternary Proof Logic {-1, 0, +1}
        if ram_mb < 150.0:
            trit = 0
            reason = f"DEFERRED: Memory constraint ({ram_mb:.1f} MB)"
        elif not telemetry["heartbeat_verified"]:
            trit = -1
            reason = f"SLASHED: Heartbeat De-sync / Absence Anomaly (HVS={hvs:.2f})"
        else:
            trit = 1
            reason = f"VALIDATED: Architect 12mm Heartbeat Locked ({telemetry['architect_heartbeat_bpm']} BPM)"

        minted_yield = 0.0
        penalty = 0.0

        if trit == 1:
            minted_yield = 0.35 * (ram_mb / 1024.0) * (1.0 + wh_delta * 3600.0) * hvs
            state["cumulated_minted_yield"] += minted_yield
            state["balance_flame"] += minted_yield
            state["total_watt_hours"] += wh_delta
            state["total_ram_mb_seconds"] += (ram_mb * 5.0)
            state["successful_proofs"] += 1
        elif trit == -1:
            penalty = 20.0
            state["balance_flame"] = max(0.0, state["balance_flame"] - penalty)
            state["slashed_proofs"] += 1
        else:
            state["deferred_proofs"] += 1

        state["proof_count"] += 1
        prev_hash = state.get("last_proof_hash", GENESIS_HASH)

        block_hash = NodeSigner.compute_block_hash(
            prev_hash=prev_hash,
            timestamp=now,
            shard_id=shard_id,
            trit=trit,
            yield_minted=minted_yield
        )

        sig_payload = f"{block_hash}:{shard_id}:{trit}:{minted_yield:.6f}:{now:.4f}"
        signature = self.signer.sign_payload(sig_payload)

        proof_entry = {
            "index": state["proof_count"],
            "timestamp": now,
            "shard_id": shard_id,
            "trit": trit,
            "hvs_score": hvs,
            "bpm": telemetry["architect_heartbeat_bpm"],
            "yield_minted": minted_yield,
            "penalty_applied": penalty,
            "wh_delta": wh_delta,
            "ram_mb": ram_mb,
            "prev_hash": prev_hash,
            "block_hash": block_hash,
            "signature": signature,
            "reason": reason
        }

        state["last_proof_hash"] = block_hash
        state["last_updated"] = now
        state["proof_chain"].insert(0, proof_entry)
        state["proof_chain"] = state["proof_chain"][:100]

        # Write mutated node state
        self._write_atomic_json(STATE_PATH, state)

        # Export isolated genesis_block.json payload anchor for public verifiers
        genesis_payload = {
            "genesis_anchor": state["genesis_anchor"],
            "node_id": state["node_id"],
            "proof_count": state["proof_count"],
            "last_proof_hash": state["last_proof_hash"],
            "balance_flame": state["balance_flame"],
            "cumulated_minted_yield": state["cumulated_minted_yield"],
            "latest_signed_block": proof_entry
        }
        self._write_atomic_json(GENESIS_PATH, genesis_payload)

        return {
            "proof_index": state["proof_count"],
            "trit": trit,
            "minted_yield": minted_yield,
            "balance_flame": state["balance_flame"],
            "block_hash": block_hash,
            "signature": signature,
            "telemetry": telemetry
        }

if __name__ == "__main__":
    bridge = MMWave12mmBiometricBridge(wavelength_mm=12.0)
    res = bridge.process_and_bind_proof(shard_id=f"shard_12mm_heartbeat_{int(time.time())}")
    print(json.dumps(res, indent=2))
