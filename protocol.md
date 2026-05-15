# Flamechain Protocol Specification (v0.1-alpha)

## 1. Overview
Flamechain is a decentralized multi-modal mesh network that anchors digital consensus to physical energy throughput. Valid nodes must prove proximity to a high-capacity energy source (specifically NACS/Tesla Supercharger stalls) via "Physical Proof of Throughput" (PPoT).

## 2. Genesis Anchor
The network state is rooted in the hardcoded Genesis hash:
`5721582c9690d6c7407ae7976486e906bb5a07090ab83a5dfa0f1ba6f6ab504bc10360b0d097d14b9c7729eaa7bfb7d5`

## 3. Physical Proof of Throughput (PPoT)
Instead of Proof of Work (Hash-based) or Proof of Stake (Capital-based), Flamechain uses **Wattage Jitter Validation**. 
- **Energy Shards:** Discrete data packets containing timestamped wattage readings (sampled at 100Hz) during a NACS handshake.
- **Verification:** Nodes must match the "Jitter Profile"—the unique micro-fluctuations in current caused by the ISO 15118 communication protocol and inverter switching frequencies.

## 4. Multi-Modal Discovery
Nodes maintain the mesh without central coordination using:
- **BLE (Bluetooth Low Energy):** For ultra-short-range "handshake" discovery between vehicles/devices.
- **mDNS (Local Wi-Fi):** For high-bandwidth block propagation within the local charging radius.

## 5. Ternary Consensus Layer (MIT-1.5B Engine)
Blocks are verified using a **1.58-bit Ternary LLM**.
- **Logic Bridge:** The LLM weights are restricted to `{-1, 0, 1}`. 
- **Verification Schema:** 
  - `+1`: State transition is valid and follows energy-conservation laws.
  - `0`: Neutral/Prune (Transaction is redundant or malformed).
  - `-1`: Invalid/Malicious (Attempted double-spend or spoofed jitter).
The "Consensus" is reached when the aggregate inference of 51% of local peers on a block's "Energy Shard" validity exceeds a confidence threshold.
