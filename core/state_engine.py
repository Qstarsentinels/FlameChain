import os
import json
import time
import fcntl
import tempfile
from typing import Dict, Any
from crypto_signer import NodeSigner

class GenesisProtectionEngine:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, state_path: str, key_path: str):
        self.state_path = state_path
        self.signer = NodeSigner(key_path)
        self._ensure_state_file()

    def _ensure_state_file(self) -> None:
        if not os.path.exists(self.state_path):
            initial_state = {
                "genesis_anchor": self.GENESIS_HASH,
                "node_id": "galaxy_tab_singularity_01",
                "cumulated_minted_yield": 0.0,
                "balance_flame": 1000.0,
                "total_watt_hours": 0.0,
                "total_ram_mb_seconds": 0.0,
                "proof_count": 0,
                "last_proof_hash": self.GENESIS_HASH,
                "last_updated": time.time(),
                "proof_chain": []
            }
            self._write_state_locked(initial_state)

    def load_state(self) -> Dict[str, Any]:
        with open(self.state_path, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                data = json.load(f)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        return data

    def _write_state_locked(self, data: Dict[str, Any]) -> None:
        dir_name = os.path.dirname(self.state_path)
        with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False) as tf:
            json.dump(data, tf, indent=2)
            temp_name = tf.name

        lock_file_path = self.state_path + ".lock"
        with open(lock_file_path, 'w') as lock_f:
            fcntl.flock(lock_f.fileno(), fcntl.LOCK_EX)
            try:
                os.replace(temp_name, self.state_path)
            finally:
                fcntl.flock(lock_f.fileno(), fcntl.LOCK_UN)

    def append_signed_proof(
        self,
        shard_id: str,
        trit: int,
        reason: str,
        ram_mb: float,
        watt_hours: float,
        mcdi_score: float
    ) -> Dict[str, Any]:
        state = self.load_state()
        now = time.time()

        minted_yield = 0.0
        penalty = 0.0

        if trit == 1:
            minted_yield = 1.25 * (ram_mb / 1024.0) * (1.0 + watt_hours) * (0.5 + mcdi_score)
            state["cumulated_minted_yield"] += minted_yield
            state["balance_flame"] += minted_yield
            state["total_watt_hours"] += watt_hours
            state["total_ram_mb_seconds"] += ram_mb
        elif trit == -1:
            penalty = 25.0
            state["balance_flame"] = max(0.0, state["balance_flame"] - penalty)

        state["proof_count"] += 1
        prev_hash = state.get("last_proof_hash", self.GENESIS_HASH)

        block_hash = NodeSigner.compute_block_hash(
            prev_hash=prev_hash,
            timestamp=now,
            shard_id=shard_id,
            trit=trit,
            yield_minted=minted_yield
        )

        sig_payload = f"{block_hash}:{shard_id}:{trit}:{minted_yield:.6f}"
        signature = self.signer.sign_payload(sig_payload)

        proof_entry = {
            "index": state["proof_count"],
            "timestamp": now,
            "shard_id": shard_id,
            "trit": trit,
            "mcdi_score": mcdi_score,
            "yield_minted": minted_yield,
            "penalty_applied": penalty,
            "watt_hours": watt_hours,
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

        self._write_state_locked(state)

        return {
            "node_id": state["node_id"],
            "balance_flame": state["balance_flame"],
            "cumulated_yield": state["cumulated_minted_yield"],
            "proof_index": state["proof_count"],
            "block_hash": block_hash,
            "signature": signature,
            "trit": trit
        }
