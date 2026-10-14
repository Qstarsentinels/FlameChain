import os
import hmac
import hashlib
import binascii

class NodeSigner:
    def __init__(self, key_path: str):
        self.key_path = key_path
        self.secret_key = self._load_or_create_key()

    def _load_or_create_key(self) -> bytes:
        if os.path.exists(self.key_path):
            with open(self.key_path, 'rb') as f:
                return f.read().strip()
        new_key = binascii.hexlify(os.urandom(32))
        os.makedirs(os.path.dirname(self.key_path), exist_ok=True)
        with open(self.key_path, 'wb') as f:
            f.write(new_key)
        return new_key

    def sign_payload(self, message: str) -> str:
        return hmac.new(self.secret_key, message.encode('utf-8'), hashlib.sha256).hexdigest()

    @staticmethod
    def compute_block_hash(prev_hash: str, timestamp: float, shard_id: str, trit: int, yield_minted: float) -> str:
        raw = f"{prev_hash}:{timestamp:.4f}:{shard_id}:{trit}:{yield_minted:.6f}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
