import hashlib
from typing import List, Tuple

class TernaryProofEngine:
    """
    Balanced Ternary Proof Engine evaluating tasks into strict {-1, 0, +1} trits.
    """

    def __init__(self, min_ram_mb: float = 200.0):
        self.min_ram_mb = min_ram_mb

    @staticmethod
    def int_to_balanced_ternary(n: int) -> List[int]:
        if n == 0:
            return [0]
        trits = []
        while n > 0:
            rem = n % 3
            n //= 3
            if rem == 2:
                rem = -1
                n += 1
            trits.append(rem)
        return trits

    def evaluate_task(
        self,
        shard_id: str,
        payload: bytes,
        avail_ram_mb: float,
        battery_pct: int
    ) -> Tuple[int, str, List[int]]:
        sha = hashlib.sha256(shard_id.encode('utf-8') + payload).digest()
        int_val = int.from_bytes(sha[:8], byteorder='big')
        trit_vec = self.int_to_balanced_ternary(int_val)
        trit_sum = sum(trit_vec)

        # 1. RAM Resource Guard -> Trit 0 (Defer)
        if avail_ram_mb < self.min_ram_mb:
            return 0, f"DEFERRED: Insufficient RAM ({avail_ram_mb:.1f} MB < {self.min_ram_mb} MB)", trit_vec

        # 2. Critical Power Guard -> Trit -1 (Slash)
        if battery_pct < 3 and trit_sum % 2 != 0:
            return -1, "SLASHED: Parity mismatch during low-voltage thermal condition", trit_vec

        # 3. Successful Validation -> Trit +1 (Reward)
        return 1, f"VALIDATED: Proof bound cleanly (Sum={trit_sum})", trit_vec
