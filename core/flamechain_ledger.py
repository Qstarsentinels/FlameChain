#!/usr/bin/env python3
import hashlib, json, os, time
from typing import List, Dict, Optional

class Block:
    def __init__(self, index: int, transactions: List[dict], shard_proofs: List[dict], previous_hash: str, ram_committed_mb: float, watt_hours_spent: float, nonce: int = 0, timestamp: Optional[float] = None):
        self.index = index
        self.transactions = transactions
        self.shard_proofs = shard_proofs
        self.previous_hash = previous_hash
        self.ram_committed_mb = ram_committed_mb
        self.watt_hours_spent = watt_hours_spent
        self.nonce = nonce
        self.timestamp = timestamp or time.time()
        self.hash = self.compute_hash()

    def compute_hash(self) -> str:
        block_string = json.dumps({
            "index": self.index, "transactions": self.transactions, "shard_proofs": self.shard_proofs,
            "previous_hash": self.previous_hash, "ram_committed_mb": self.ram_committed_mb,
            "watt_hours_spent": self.watt_hours_spent, "nonce": self.nonce, "timestamp": self.timestamp
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

class FlameLedger:
    def __init__(self, difficulty: int = 1, master_treasury: Optional[str] = None):
        self.chain: List[Block] = []
        self.pending_transactions: List[dict] = []
        self.pending_shard_proofs: List[dict] = []
        self.difficulty = difficulty
        self.master_treasury = master_treasury or os.getenv("MASTER_TREASURY", "FLAME_ARCHITECT_MASTER_TREASURY_QSTAR_X_Q")
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis_tx = {"from": "0x00_GENESIS", "to": self.master_treasury, "amount": 1000000000.0, "type": "GENESIS_MINT"}
        self.chain.append(Block(0, [genesis_tx], [], "0"*64, 0.0, 0.0))

    @property
    def last_block(self) -> Block:
        return self.chain[-1]

    def add_shard_proof(self, shard_id: str, node_id: str, execution_time_ms: float, bytes_processed: int):
        self.pending_shard_proofs.append({
            "shard_id": shard_id, "node_id": node_id,
            "execution_time_ms": execution_time_ms, "bytes_processed": bytes_processed, "timestamp": time.time()
        })

    def mine_pending_block(self, miner_address: str, ram_committed_mb: float, watt_hours_spent: float) -> Block:
        reward = (watt_hours_spent * 10.0) + (ram_committed_mb * 0.05)
        tithe = reward * 0.10
        txs = list(self.pending_transactions) + [
            {"from": "NETWORK_MINT", "to": miner_address, "amount": reward, "type": "OPERATOR_REWARD"},
            {"from": "NETWORK_MINT", "to": self.master_treasury, "amount": tithe, "type": "TREASURY_TITHE"}
        ]
        block = Block(len(self.chain), txs, list(self.pending_shard_proofs), self.last_block.hash, ram_committed_mb, watt_hours_spent)
        target = "0" * self.difficulty
        while not block.hash.startswith(target):
            block.nonce += 1
            block.hash = block.compute_hash()
        self.chain.append(block)
        self.pending_transactions, self.pending_shard_proofs = [], []
        return block
