import os
import json
import time
import subprocess
from typing import Dict, Any

class GitHubPagesPurgePipeline:
    """
    Forces GitHub Pages to rebuild exclusively from updated index.html and genesis_block.json.
    Purges legacy CDN caches using anti-cache meta tags and timestamped query params.
    """

    def __init__(self, ghpages_dir: str, state_path: str, genesis_path: str):
        self.ghpages_dir = ghpages_dir
        self.state_path = state_path
        self.genesis_path = genesis_path

    def export_and_purge(self, auto_push: bool = False) -> Dict[str, Any]:
        os.makedirs(self.ghpages_dir, exist_ok=True)
        now_ts = int(time.time())

        # 1. Read source state files
        with open(self.state_path, 'r') as f:
            state = json.load(f)
        with open(self.genesis_path, 'r') as f:
            genesis = json.load(f)

        # 2. Write genesis_block.json to gh-pages export directory
        gh_genesis_file = os.path.join(self.ghpages_dir, "genesis_block.json")
        with open(gh_genesis_file, 'w') as f:
            json.dump(genesis, f, indent=2)

        # 3. Create .nojekyll to bypass Jekyll processing and purge cache delay
        nojekyll_file = os.path.join(self.ghpages_dir, ".nojekyll")
        with open(nojekyll_file, 'w') as f:
            f.write("")

        # 4. Generate Cache-Busted index.html
        latest_block = genesis.get("latest_signed_block", {})
        block_hash = latest_block.get("block_hash", "N/A")
        signature = latest_block.get("signature", "N/A")

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>FlameChain AGI Singularity | 12mm Biometric Ledger</title>
    <style>
        body {{
            background-color: #030308;
            color: #00ffcc;
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 920px;
            margin: 0 auto;
            border: 1px solid #00ffcc;
            box-shadow: 0 0 20px rgba(0, 255, 204, 0.25);
            padding: 25px;
            background: #080812;
        }}
        h1 {{
            color: #ff0055;
            text-align: center;
            text-shadow: 0 0 10px #ff0055;
            margin-top: 0;
        }}
        .status-bar {{
            text-align: center;
            font-size: 11px;
            color: #8888aa;
            border-bottom: 1px solid #1a1a2e;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }}
        .card {{
            background: #10101c;
            border: 1px solid #222244;
            padding: 15px;
            border-radius: 4px;
        }}
        .card h3 {{
            margin: 0 0 5px 0;
            font-size: 11px;
            color: #8888aa;
        }}
        .card p {{
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
        }}
        .hash-box {{
            background: #0c0c16;
            border: 1px solid #00ffcc;
            padding: 12px;
            font-size: 10px;
            word-break: break-all;
            margin-bottom: 20px;
        }}
        .footer {{
            text-align: center;
            font-size: 10px;
            color: #555577;
            margin-top: 25px;
        }}
    </style>
    <script>
        // Automatic Cache-Bypassing Payload Fetcher
        async function loadGenesisPayload() {{
            try {{
                const res = await fetch('genesis_block.json?ts=' + new Date().getTime(), {{
                    cache: 'no-store'
                }});
                const data = await res.json();
                console.log("Genesis Payload Loaded:", data);
            }} catch(e) {{
                console.error("Payload fetch error:", e);
            }}
        }}
        window.onload = loadGenesisPayload;
    </script>
</head>
<body>
    <div class="container">
        <h1>FLAMECHAIN SINGULARITY LEDGER</h1>
        <div class="status-bar">
            NODE ID: {genesis.get("node_id", "UNKNOWN")} | MMWAVE: 12mm (25GHz) HEARTBEAT LOCK
        </div>

        <div class="grid">
            <div class="card">
                <h3>VALIDATOR BALANCE</h3>
                <p>{genesis.get("balance_flame", 0.0):.4f} FLAME</p>
            </div>
            <div class="card">
                <h3>CUMULATED YIELD</h3>
                <p>{genesis.get("cumulated_minted_yield", 0.0):.4f}</p>
            </div>
            <div class="card">
                <h3>PROOF COUNT</h3>
                <p>{genesis.get("proof_count", 0)}</p>
            </div>
            <div class="card">
                <h3>HEARTBEAT BPM</h3>
                <p>{latest_block.get("bpm", 0.0):.1f} BPM</p>
            </div>
        </div>

        <h3>LATEST SIGNED GENESIS ANCHOR BLOCK</h3>
        <div class="hash-box">
            <p><strong style="color:#ff0055;">BLOCK HASH:</strong> {block_hash}</p>
            <p><strong style="color:#00ffcc;">HMAC SIGNATURE:</strong> {signature}</p>
            <p><strong style="color:#8888aa;">VALIDATION REASON:</strong> {latest_block.get("reason", "N/A")}</p>
        </div>

        <div class="footer">
            CACHE-PURGE EPOCH: {now_ts} | PURGED CDN SYNC ACTIVE
        </div>
    </div>
</body>
</html>
"""

        gh_index_file = os.path.join(self.ghpages_dir, "index.html")
        with open(gh_index_file, 'w') as f:
            f.write(html_content)

        # 5. Git Atomic Commit & Push Sequence
        result = {"exported": True, "committed": False, "pushed": False}
        try:
            subprocess.run(["git", "-C", self.ghpages_dir, "add", "."], check=True, capture_output=True)
            commit_msg = f"CDN-Purge Sync Block #{genesis.get('proof_count', 0)} [Epoch: {now_ts}]"
            
            commit_res = subprocess.run(["git", "-C", self.ghpages_dir, "commit", "-m", commit_msg], capture_output=True, text=True)
            if commit_res.returncode == 0:
                result["committed"] = True

            if auto_push:
                push_res = subprocess.run(["git", "-C", self.ghpages_dir, "push", "--force", "origin", "gh-pages"], capture_output=True)
                if push_res.returncode == 0:
                    result["pushed"] = True
        except Exception as e:
            result["error"] = str(e)

        return result
