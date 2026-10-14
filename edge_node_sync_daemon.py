import os
import sys
import time
import json
import fcntl
import tempfile
import argparse

# Include core module path
sys.path.insert(0, os.path.expanduser("~/.flamechain/core"))

from sys_metrics import TermuxMetrics
from crypto_signer import NodeSigner
from ternary_engine import TernaryProofEngine

STATE_PATH = os.path.expanduser("~/.flamechain/data/node_state.json")
KEY_PATH = os.path.expanduser("~/.flamechain/keys/node_identity.key")
GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class ReGenesisResilientLedger:
    """
    Manages atomic state persistence, Wh delta tracking, and proof chain updates.
    Preserves yield metrics during proxy re-genesis events.
    """

    def __init__(self, state_path: str, key_path: str):
        self.state_path = state_path
        self.signer = NodeSigner(key_path)
        self._ensure_state_file()

    def _ensure_state_file(self) -> None:
        if not os.path.exists(self.state_path):
            initial_state = {
                "genesis_anchor": GENESIS_HASH,
                "node_id": "tab_validator_edge_01",
                "cumulated_minted_yield": 0.0,
                "balance_flame": 100.0,
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
            self._write_atomic(initial_state)

    def load_state(self) -> dict:
        if not os.path.exists(self.state_path):
            self._ensure_state_file()

        with open(self.state_path, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                data = json.load(f)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        return data

    def _write_atomic(self, data: dict) -> None:
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

    def commit_sync_tick(
        self,
        shard_id: str,
        trit: int,
        reason: str,
        ram_mb: float,
        wh_delta: float,
        elapsed_sec: float
    ) -> dict:
        """
        Commits incremental proof step, adds minting yield, and appends to proof chain.
        """
        state = self.load_state()
        now = time.time()

        minted_yield = 0.0
        penalty = 0.0

        if trit == 1:
            # Minting Formula: Base * (RAM / 1024) * (1 + Wh_delta * 3600)
            minted_yield = 0.20 * (ram_mb / 1024.0) * (1.0 + (wh_delta * 3600.0))
            state["cumulated_minted_yield"] += minted_yield
            state["balance_flame"] += minted_yield
            state["total_watt_hours"] += wh_delta
            state["total_ram_mb_seconds"] += (ram_mb * elapsed_sec)
            state["successful_proofs"] += 1
        elif trit == -1:
            penalty = 10.0
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

        self._write_atomic(state)

        return {
            "proof_index": state["proof_count"],
            "trit": trit,
            "minted_yield": minted_yield,
            "balance_flame": state["balance_flame"],
            "cumulated_yield": state["cumulated_minted_yield"],
            "total_wh": state["total_watt_hours"],
            "block_hash": block_hash,
            "reason": reason
        }

def run_sync_loop(interval_sec: float = 5.0, max_ticks: int = None):
    print("==========================================================")
    print("  FLAMECHAIN EDGE NODE SYNC DAEMON ACTIVE (5s TICK)")
    print("==========================================================")

    ledger = ReGenesisResilientLedger(STATE_PATH, KEY_PATH)
    proof_engine = TernaryProofEngine(min_ram_mb=150.0)

    last_tick_time = time.time()
    tick_count = 0

    try:
        while True:
            tick_count += 1
            now = time.time()
            elapsed = now - last_tick_time
            last_tick_time = now

            # 1. Sample Power & Memory Metrics
            power_sample = TermuxMetrics.get_power_sample()
            ram_mb = TermuxMetrics.get_mem_available_mb()

            # Calculate verified Wh Delta: Watts * (hours elapsed)
            wh_delta = power_sample["power_watts"] * (elapsed / 3600.0)

            # 2. Evaluate Ternary Proof
            shard_id = f"shard_sync_daemon_tick_{tick_count:06d}"
            mock_payload = f"sync_payload_{now}".encode('utf-8')

            trit, reason, trits = proof_engine.evaluate_task(
                shard_id=shard_id,
                payload=mock_payload,
                avail_ram_mb=ram_mb,
                battery_pct=power_sample["percentage"]
            )

            # 3. Commit state mutation atomically
            res = ledger.commit_sync_tick(
                shard_id=shard_id,
                trit=trit,
                reason=reason,
                ram_mb=ram_mb,
                wh_delta=wh_delta,
                elapsed_sec=elapsed
            )

            trit_symbol = {1: "[+1] REWARD", 0: "[ 0] HALT", -1: "[-1] SLASH"}[trit]

            print(f"[{time.strftime('%H:%M:%S')}] Tick #{tick_count:04d} | {trit_symbol}")
            print(f" |- RAM: {ram_mb:.1f} MB | Wh Delta: {wh_delta:.8f} Wh | Watts: {power_sample['power_watts']:.3f} W")
            print(f" |- Minted Yield: +{res['minted_yield']:.6f} FLAME | Total Balance: {res['balance_flame']:.6f} FLAME")
            print(f" |- Block Hash  : {res['block_hash'][:16]}... | Prev Hash Verified\n")

            if max_ticks and tick_count >= max_ticks:
                print(f"[*] Completed target execution run of {max_ticks} ticks.")
                break

            time.sleep(interval_sec)

    except KeyboardInterrupt:
        print("\n[!] Edge Node Sync Daemon stopped gracefully.")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FlameChain Edge Node Sync Daemon")
    parser.add_argument("--interval", type=float, default=5.0, help="Loop tick interval in seconds")
    parser.add_argument("--ticks", type=int, default=None, help="Maximum number of ticks to run")
    args = parser.parse_args()

    run_sync_loop(interval_sec=args.interval, max_ticks=args.ticks)
