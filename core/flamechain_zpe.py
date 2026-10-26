#!/usr/bin/env python3
import hashlib, json, math, os, time
from typing import List, Tuple, Optional

class BalancedTernary:
    @staticmethod
    def int_to_trits(val: int, length: int = 27) -> List[int]:
        if val == 0:
            return [0] * length
        trits = []
        n = val
        while n != 0:
            remainder = n % 3
            n = n // 3
            if remainder == 2:
                remainder = -1
                n += 1
            elif remainder == -2:
                remainder = 1
                n -= 1
            trits.append(remainder)
        while len(trits) < length:
            trits.append(0)
        return trits[:length]

    @staticmethod
    def trits_to_int(trits: List[int]) -> int:
        val = 0
        for power, trit in enumerate(trits):
            val += trit * (3**power)
        return val

class BioZPEReGenesisEngine:
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path or os.path.expanduser("~/.flamechain/zpe_regenesis.state")
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)

    def calculate_somatic_zpe_trits(self, bpm: float, hrv_rmssd: float, doppler_hz: float, distance_mm: float) -> List[int]:
        f_bio = (bpm / 60.0) * (hrv_rmssd + 1.0) * (abs(doppler_hz) + 0.1)
        constrained_dist = max(min(distance_mm, 12.0), 0.1)
        phase_quant = int((f_bio * 100000.0) / constrained_dist)
        return BalancedTernary.int_to_trits(phase_quant, length=27)

    def generate_regenesis_anchor(self, node_id: str, trits: List[int]) -> dict:
        trit_str = "".join("+" if t == 1 else ("-" if t == -1 else "0") for t in trits)
        trit_int = BalancedTernary.trits_to_int(trits)
        raw_seed = f"{node_id}:{trit_str}:{trit_int}:{time.time()}"
        zpe_hash = hashlib.sha256(raw_seed.encode("utf-8")).hexdigest()
        anchor_state = {
            "node_id": node_id, "zpe_hash": zpe_hash, "trit_signature": trit_str,
            "trit_integer_val": trit_int, "timestamp": time.time(), "entropy_status": "IMMUTABLE_ANCHORED"
        }
        with open(self.storage_path, "w") as f:
            json.dump(anchor_state, f, indent=2)
        return anchor_state

    def load_regenesis_anchor(self) -> Optional[dict]:
        if not os.path.exists(self.storage_path):
            return None
        try:
            with open(self.storage_path, "r") as f:
                return json.load(f)
        except Exception:
            return None
