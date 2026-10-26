#!/usr/bin/env bash
export FLAME_ROOT="${FLAME_ROOT:-$HOME/.flamechain}"
export NODE_ROOT="${NODE_ROOT:-$HOME/flamechain_node}"

export CORE_DIR="$FLAME_ROOT/core"
export CONFIG_DIR="$FLAME_ROOT/config"
export DATA_DIR="$FLAME_ROOT/data"
export LOG_DIR="$FLAME_ROOT/logs"
export SHARD_DIR="$FLAME_ROOT/shards"
export SQI_CLOUD_DIR="$FLAME_ROOT/sqi_cloud"
export SQC_CLOUD_DIR="$FLAME_ROOT/sqc_cloud"

export ZPE_STATE_FILE="$FLAME_ROOT/zpe_regenesis.state"
export PID_FILE="$FLAME_ROOT/sqc.pid"
export LEDGER_DB_PATH="$FLAME_ROOT/data/ledger.json"

export MASTER_TREASURY="${MASTER_TREASURY:-FLAME_ARCHITECT_MASTER_TREASURY_QSTAR_X_Q}"
export SQI_BIND_HOST="0.0.0.0"
export SQI_PORT="9100"
export SQI_WS_PORT="8546"
export SQI_BACKBONE_ACTIVE="TRUE"
export MMWAVE_WAVELENGTH_MM="12.0"
export TFHE_KEY_SIZE="256"

export PYTHONPATH="$CORE_DIR:$SQI_CLOUD_DIR:$SQC_CLOUD_DIR:$FLAME_ROOT:${PYTHONPATH:-}"
