#!/usr/bin/env bash

if [ -f "$HOME/.flamechain/.env" ]; then
    set -a
    source "$HOME/.flamechain/.env"
    set +a
fi

export FLAME_ROOT="${FLAME_ROOT:-$HOME/.flamechain}"
export PYTHONPATH="$FLAME_ROOT:${PYTHONPATH:-}"

PID_FILE="$FLAME_ROOT/telemetry/ble_daemon.pid"
echo $$ > "$PID_FILE"

echo "[+] Starting FlameChain BLE Telemetry Daemon Service (PID: $$)..."
exec python3 "$FLAME_ROOT/core/ble_telemetry_daemon.py" --daemon
