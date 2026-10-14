import os
import sys
import time
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

from sys_metrics import TermuxMetrics
from micro_doppler import QuadratureMicroDopplerEngine
from state_engine import GenesisProtectionEngine

STATE_PATH = os.path.expanduser("~/.flamechain/data/node_state.json")
KEY_PATH = os.path.expanduser("~/.flamechain/keys/node_identity.key")

class SingularityHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        engine = GenesisProtectionEngine(STATE_PATH, KEY_PATH)
        state = engine.load_state()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        if self.path == "/api/v1/metrics":
            ram = TermuxMetrics.get_mem_available_mb()
            power = TermuxMetrics.get_power_metrics()
            metrics = {"available_ram_mb": ram, "power": power}
            self.wfile.write(json.dumps(metrics, indent=2).encode('utf-8'))
        else:
            self.wfile.write(json.dumps(state, indent=2).encode('utf-8'))

def start_http_gateway(port: int = 8080):
    server = HTTPServer(('127.0.0.1', port), SingularityHTTPHandler)
    server.serve_forever()

def run_singularity_loop():
    print("[*] Starting FlameChain Singularity Execution Daemon...")
    engine = GenesisProtectionEngine(STATE_PATH, KEY_PATH)
    radar = QuadratureMicroDopplerEngine(carrier_freq_ghz=60.0)

    # Launch HTTP Gateway thread
    gateway_thread = threading.Thread(target=start_http_gateway, args=(8080,), daemon=True)
    gateway_thread.start()
    print("[*] Embedded Gateway API active at http://127.0.0.1:8080/")

    cycle = 0
    try:
        while True:
            cycle += 1
            ram = TermuxMetrics.get_mem_available_mb()
            power = TermuxMetrics.get_power_metrics()
            doppler = radar.process_doppler_biometrics()
            mcdi = doppler["mcdi_score"]
            wh = power["watt_hours"]

            shard_id = f"shard_agi_multimodal_block_{cycle:06d}"

            # Evaluate Ternary Proof
            if ram < 150.0:
                trit = 0
                reason = f"DEFERRED: RAM memory limit reached ({ram:.1f} MB)"
            elif mcdi < 0.30:
                trit = -1
                reason = f"SLASHED: Biometric Phase Disruption Detected (MCDI={mcdi:.2f})"
            else:
                trit = 1
                reason = f"VALID: Multimodal AGI Block Verified (MCDI={mcdi:.2f})"

            proof = engine.append_signed_proof(
                shard_id=shard_id,
                trit=trit,
                reason=reason,
                ram_mb=ram,
                watt_hours=wh,
                mcdi_score=mcdi
            )

            trit_str = {1: "[+1] REWARD", 0: "[ 0] HALT", -1: "[-1] SLASH"}[trit]
            print(f"[{time.strftime('%H:%M:%S')}] Proof #{proof['proof_index']} {trit_str} | Yield: {proof['cumulated_yield']:.4f} FLAME | Hash: {proof['block_hash'][:12]}...")

            time.sleep(3)

    except KeyboardInterrupt:
        print("\n[!] Shutting down Singularity Execution Daemon gracefully.")
        sys.exit(0)

if __name__ == "__main__":
    run_singularity_loop()
