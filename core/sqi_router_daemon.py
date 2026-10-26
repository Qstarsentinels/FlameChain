#!/usr/bin/env python3
import asyncio, base64, hashlib, json, os, struct, sys, time
from pathlib import Path

FLAME_ROOT = Path(os.getenv("FLAME_ROOT", os.path.expanduser("~/.flamechain"))).resolve()
CORE_DIR = FLAME_ROOT / "core"
DATA_DIR = FLAME_ROOT / "data"
sys.path.insert(0, str(CORE_DIR))
sys.path.insert(0, str(FLAME_ROOT))

from flamechain_zpe import BioZPEReGenesisEngine
from sqc_cloud import TermuxHardwareMonitor

class NonVolatileShardBuffer:
    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.buffer = self._load_from_disk()

    def _load_from_disk(self):
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def push_state(self, shard_state: dict):
        self.buffer.append(shard_state)
        self._flush_to_disk()

    def pop_pending(self, batch_size: int = 50):
        batch = self.buffer[:batch_size]
        self.buffer = self.buffer[batch_size:]
        self._flush_to_disk()
        return batch

    def _flush_to_disk(self):
        try:
            with open(self.storage_path, "w") as f:
                json.dump(self.buffer, f, indent=2)
        except Exception:
            pass

    @property
    def pending_count(self):
        return len(self.buffer)

class SQIRouterDaemon:
    def __init__(self, host: str = "0.0.0.0", port: int = 8546):
        self.host = host
        self.port = port
        self.node_id = os.getenv("SQI_NODE_ID", hashlib.sha256(f"{time.time()}".encode()).hexdigest()[:16])
        self.master_treasury = os.getenv("MASTER_TREASURY", "FLAME_ARCHITECT_MASTER_TREASURY_QSTAR_X_Q")
        self.buffer = NonVolatileShardBuffer(DATA_DIR / "shard_sync_buffer.json")
        self.zpe_engine = BioZPEReGenesisEngine()
        self.active_clients = set()
        self.server = None
        self.is_running = False

    async def start(self):
        self.is_running = True
        self.server = await asyncio.start_server(self._handle_client_connection, self.host, self.port)
        print(f"[✓] [SQI Router Daemon] Active on ws://{self.host}:{self.port}")
        asyncio.create_task(self._shard_sync_loop())

    async def _handle_client_connection(self, reader, writer):
        self.active_clients.add(writer)
        try:
            header_bytes = await reader.read(2048)
            header_str = header_bytes.decode('utf-8', errors='ignore')

            if "Sec-WebSocket-Key" in header_str:
                for line in header_str.split("\r\n"):
                    if line.startswith("Sec-WebSocket-Key:"):
                        ws_key = line.split(":")[1].strip()
                        magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                        accept_key = base64.b64encode(hashlib.sha1((ws_key + magic).encode()).digest()).decode()
                        resp = f"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {accept_key}\r\n\r\n"
                        writer.write(resp.encode())
                        await writer.drain()
                        break

            while self.is_running:
                data = await reader.read(4096)
                if not data:
                    break
        except Exception:
            pass
        finally:
            self.active_clients.discard(writer)
            writer.close()
            await writer.wait_closed()

    async def _shard_sync_loop(self):
        while self.is_running:
            await asyncio.sleep(3)
            if self.buffer.pending_count > 0:
                self.buffer.pop_pending(10)

            ram_mb = TermuxHardwareMonitor.get_available_ram_mb()
            trits = self.zpe_engine.calculate_somatic_zpe_trits(72.0, 42.0, 1.2, 8.2)
            anchor = self.zpe_engine.generate_regenesis_anchor(self.node_id, trits)

            sync_manifest = {
                "type": "ROUTER_WS_PULSE",
                "node_id": self.node_id,
                "master_treasury": self.master_treasury,
                "ram_mb": round(ram_mb, 2),
                "zpe_hash": anchor["zpe_hash"],
                "buffer_pending": self.buffer.pending_count,
                "active_ws_connections": len(self.active_clients),
                "timestamp": int(time.time())
            }

            with open(FLAME_ROOT / "sqi_cloud" / "backbone_state.json", "w") as f:
                json.dump(sync_manifest, f, indent=2)

if __name__ == "__main__":
    async def main():
        daemon = SQIRouterDaemon()
        await daemon.start()
        while True:
            await asyncio.sleep(3600)
    asyncio.run(main())
