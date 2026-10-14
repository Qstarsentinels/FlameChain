import os
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from state_engine import GenesisProtectionEngine

STATE_PATH = os.path.expanduser("~/.flamechain/data/node_state.json")
KEY_PATH = os.path.expanduser("~/.flamechain/keys/node_identity.key")

class GatewayHTTPRequestHandler(BaseHTTPRequestHandler):
    """Serves local HTTP API endpoint for local front-end dashboard and gateway queries."""

    def log_message(self, format, *args):
        pass  # Suppress default HTTP server logging output

    def do_GET(self):
        engine = GenesisProtectionEngine(STATE_PATH, KEY_PATH)
        state = engine.load_state()

        if self.path == "/api/v1/state" or self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(state, indent=2).encode('utf-8'))

        elif self.path == "/api/v1/yield":
            yield_data = {
                "node_id": state["node_id"],
                "balance_flame": state["balance_flame"],
                "cumulated_minted_yield": state["cumulated_minted_yield"],
                "proof_count": state["proof_count"],
                "last_proof_hash": state["last_proof_hash"]
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(yield_data, indent=2).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

def run_gateway_server(port: int = 8080):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, GatewayHTTPRequestHandler)
    print(f"[*] Gateway Daemon Active on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Shutting down Gateway Daemon server.")

if __name__ == "__main__":
    run_gateway_server()
