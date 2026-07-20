# PROJECT FLAME — Stage 1 Safe Distillation Scaffold

This package preserves the distillation architecture while keeping it lab-only.

It includes:
- `terms.json`
- `instruction_bank.jsonl`
- `negative_examples.jsonl`
- `ternary_quantizer.py`
- `handshake_bridge.py`
- `sharding_manifest.safe.json`

No real model weights were trained or encrypted here. The manifest uses placeholders for the final encrypted blobs.
Do not write shards to Tesla BMS, MCU, Autopilot, or Charging Controller. Use simulated lab nodes or non-safety-critical storage.
