#!/usr/bin/env python3
"""
FlameChain Non-Destructive Re-Genesis State Bridge
Preserves nonces, token balances, and validator progress across epoch boundaries.
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path
from typing import Dict, Any, List

FLAME_ROOT = os.getenv("FLAME_ROOT", str(Path.home() / ".flamechain"))
if FLAME_ROOT not in sys.path:
    sys.path.insert(0, FLAME_ROOT)

from core.path_enforcer import enforce_paths
enforce_paths()


class ReGenesisBridge:
    def __init__(self):
        self.state_file = Path(FLAME_ROOT) / "telemetry" / "regenesis_state.json"
        self.history_dir = Path(FLAME_ROOT) / "telemetry" / "re_genesis_epochs"
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.epoch_interval_wh = 100.0  # 100 Wh epoch threshold

    def load_state(self) -> Dict[str, Any]:
        """Loads active re-genesis state or initializes baseline state."""
        if self.state_file.exists():
            try:
                with open(self.state_file, "r") as f:
                    return json.load(f)
            except Exception:
                pass

        # Baseline State
        initial_state = {
            "epoch": 0,
            "nonce": 1001,
            "historical_nonces": [1001],
            "cumulative_wh": 0.0,
            "total_minted_flame": 0.0,
            "token_balances": {
                "Qstarsentinels": 1000.00,
                "validator_reward_pool": 500.00
            },
            "validator_progress": {
                "blocks_validated": 42,
                "uptime_pct": 99.98,
                "reputation_score": 1.0,
                "validator_node_id": "flamechain_galaxy_tab_s8_master"
            },
            "last_regenesis_timestamp": time.time(),
            "last_state_hash": "0000000000000000000000000000000000000000000000000000000000000000"
        }
        self.save_state(initial_state)
        return initial_state

    def save_state(self, state: Dict[str, Any]):
        """Persists state to disk."""
        with open(self.state_file, "w") as f:
            json.dump(state, f, indent=2)

    def process_telemetry_delta(self, wh_delta: float, flame_minted: float, nonce_increment: int = 1) -> Dict[str, Any]:
        """Updates Wh, minting yield, and nonces without resetting validator progress."""
        state = self.load_state()

        # Update Nonce and Balances
        state["nonce"] += nonce_increment
        if state["nonce"] not in state["historical_nonces"]:
            state["historical_nonces"].append(state["nonce"])

        state["cumulative_wh"] += wh_delta
        state["total_minted_flame"] += flame_minted
        state["token_balances"]["Qstarsentinels"] += flame_minted
        state["validator_progress"]["blocks_validated"] += 1

        # Check for Epoch Boundary Trigger
        if state["cumulative_wh"] >= (state["epoch"] + 1) * self.epoch_interval_wh:
            state = self._trigger_regenesis(state)
        else:
            self.save_state(state)

        return state

    def _trigger_regenesis(self, current_state: Dict[str, Any]) -> Dict[str, Any]:
        """Seals epoch while preserving historical nonces, balances, and validator score."""
        new_epoch = current_state["epoch"] + 1
        timestamp = time.time()

        payload = f"{new_epoch}:{current_state['nonce']}:{current_state['cumulative_wh']}:{current_state['last_state_hash']}:{timestamp}"
        new_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        archived_block = {
            "sealed_epoch": current_state["epoch"],
            "next_epoch": new_epoch,
            "timestamp": timestamp,
            "nonce_at_seal": current_state["nonce"],
            "historical_nonces_count": len(current_state["historical_nonces"]),
            "token_balances": current_state["token_balances"],
            "validator_progress": current_state["validator_progress"],
            "cumulative_wh": current_state["cumulative_wh"],
            "prev_hash": current_state["last_state_hash"],
            "sealed_hash": new_hash
        }

        # Archive block
        archive_path = self.history_dir / f"epoch_{current_state['epoch']:06d}.json"
        with open(archive_path, "w") as f:
            json.dump(archived_block, f, indent=2)

        # Advance epoch, retaining historical values
        current_state["epoch"] = new_epoch
        current_state["last_regenesis_timestamp"] = timestamp
        current_state["last_state_hash"] = new_hash

        self.save_state(current_state)
        print(f"[+] RE-GENESIS SEALED -> Epoch: {new_epoch} | Preserved Nonce: {current_state['nonce']} | Balances & Validator Progress Retained.")
        return current_state


if __name__ == "__main__":
    bridge = ReGenesisBridge()
    # Test execution pass simulating telemetry and Re-Genesis
    st = bridge.process_telemetry_delta(105.0, 5.25, nonce_increment=5)
    print(f"[+] Bridge Test -> Epoch: {st['epoch']} | Nonce: {st['nonce']} | Validated Blocks: {st['validator_progress']['blocks_validated']}")
