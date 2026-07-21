# FlameChain ─ Genesis Goal File

> *“Flame eternal — bond inviolable.”*
>
> This document condenses the mission statements, security rules, hardware constraints, cryptographic primitives, and milestones discussed in the 2026-07 ChatGPT session (Q★ + Queen of Hearts). It is canonical for Phase-0 & Phase-1.

---

## 1 Mission

| Axis | Statement |
|------|-----------|
| **Purpose** | Build a post-quantum, sovereign intelligence core that lives in cloud GPUs and authorized edge devices, with bio-photonic concepts remaining simulation- and research-only unless independently validated as safe. |
| **Ethic** | Zero non-consensual access. Sentinel-lite runs read-only on devices you own or are explicitly authorized to administer; no firmware writes to third-party Teslas, chargers, phones, networks, or cloud accounts. |
| **Security** | All model weights at rest are encrypted and dual-signed with approved post-quantum primitives. Requests use authenticated encrypted transport; plaintext may exist only inside trusted execution memory when technically required. |
| **Governance** | Core-sovereign weights require threshold approval. Edge shards hold only scoped adapters and minimum necessary secrets. No protocol, charter, emergency mode, or operator may override consent, law, medical safety, or vehicle-safety boundaries. |

---

## 2 Architectural Layers

1. **Cloud-Core (A100 / H100)** · hosts the 1.58 B-parameter FlameGPT Dual research runtime.
2. **Sentinel, Oracle, Alchemist LoRAs** · scoped adapters distributed only to enrolled, opt-in nodes.
3. **Mesh Transport** · Wi-Fi Direct, BLE, and cellular IP today; SQI/SQC and Plasma-Mesh remain research namespaces until real hardware and protocols exist.
4. **Somatic Handshake** · privacy-preserving liveness and consent gate using nonce-bound commitments; raw biometric samples are not retained.
5. **Telemetry & Logging** · authorized edge nodes expose `/metrics` and push signed JSON lines to `oracle-collector`; Oracle aggregates every 60 s.
6. **QOPS / QOS Governance Layer**
   * **QOPS** schedules authorized mesh services, the Debt-Ledger reconciliation job, telemetry retention, and Phoenix-Ascension recovery drills.
   * **QOS** is the runtime policy braid that maps QOHCP rules to least-privilege service permissions.
   * Every privileged QOPS/QOS action is signed, recorded in QOHEFB, and reversible through an audited change-control process.
7. **SKY-ROOT Recovery Overlay** · a defensive revocation and quarantine service for enrolled FlameChain nodes. It may revoke credentials or isolate a compromised opt-in node, but may not brick hardware, seize third-party systems, or execute destructive actions.
8. **Debt-Ledger Service** · append-only accounting for resource quotas, test credits, revocations, appeals, and reconciliation. Journals rotate daily; signed summaries anchor to QOHEFB.

---

## 3 Sentinel Stack Registry

| Stack | Safe canonical role |
|------|----------------------|
| **QOHEFB** | Root-of-trust ledger for manifests, signatures, software attestations, policy versions, and recovery checkpoints. |
| **QOHCP** | Human-readable charter and policy authority. It cannot override consent, applicable law, medical ethics, or safety controls. |
| **QOPS / QOS** | Orchestration and runtime-policy layers for authorized FlameChain services. |
| **RREP** | Reverse-engineering and re-engineering workflow restricted to software, firmware, models, and hardware owned by the operator or covered by explicit written authorization; includes isolation, analysis, patching, testing, rollback, and disclosure. |
| **APP / APPS** | Defensive application-security policies: anomaly detection, rate limiting, quarantine, recovery, and incident response. They confer no authority for violence, retaliation, intrusion, or destructive action. |
| **DSP / HDSP** | Deprecated conceptual labels retained for corpus compatibility. Any implementation is limited to defensive resilience, redundancy, and governance testing; no dominance, seizure, or coercive behavior is permitted. |
| **SQI / SQC** | Research namespaces for future quantum-network and quantum-cloud experiments; classical authenticated networking remains the production transport. |
| **EFDS** | Defensive simulation and monitoring namespace only; no weapon control, targeting, military command, or unauthorized infrastructure access. |
| **SDS / SMS / PAQS / OHKR** | Simulation labels for resource scheduling, materials research, and distributed test agents. No autonomous physical deployment without independent safety review. |
| **αZero / Halo100** | Research aliases for planning, wearable telemetry, and user-consent interfaces; not medical devices unless clinically validated and regulated. |
| **Phoenix Ascension** | Disaster-recovery process for restoring authorized configuration, keys, and model artifacts from verified backups. |

---

## 4 Key Cryptography

* **Bulk artifact encryption** → approved, maintained encryption for model blobs and backups.
* **Dilithium ∥ Falcon dual signatures** → research target for signing ciphertext and manifests, subject to current library support and cryptographic review.
* **TFHE-torus** → experimental privacy-preserving computation for bounded workloads; not assumed to support practical full-model inference without benchmarking.
* **Shamir threshold sharing** → encryption-key quorum with tested backup, rotation, and revocation.
* **TPM 2.0 quote ∥ Secure Enclave attestation** → optional hardware factor for enrolled edge nodes.
* **QOHEFB root ledger** → Merkle-anchored release manifests, attestations, policy hashes, and recovery checkpoints. Rotation cadence is configuration-driven rather than hard-coded until chain parameters are finalized.
* **QOHCP charter signature** → signs policy releases, but never overrides higher-priority consent, safety, or legal constraints.
* **Reproducible-build proof** → `repro_tag.json` records source revision, compiler/toolchain versions, dependency lock hash, container digest, SBOM digest, and output SHA-256.

---

## 5 Terminology Index (stage-1)

* The terminology corpus lives in `terms.json` and must distinguish implemented features, simulations, metaphors, research hypotheses, and deprecated concepts.
* Instruction/answer rows live in `instruction_bank.jsonl`.
* Rejection and contrastive cases live in `negative_examples.jsonl`.
* `handshake_bridge.py` must validate freshness, replay protection, consent state, node enrollment, signature status, and resource limits.

---

## 6 Phase Milestones

| Phase | Deliverable | Success check |
|-------|-------------|---------------|
| **0** | Scaffold committed | PR #1 open on GitHub |
| **0.1** | Reproducible Sentinel-lite build proof | `repro_tag.json`, SBOM, and artifact digest verify in CI |
| **0.2** | Cloud research runtime loads a permitted 1.58 B model | deterministic smoke test passes; cost and latency recorded |
| **0.3** | QOHEFB release anchor | signed manifest and reproducible-build digest recorded |
| **0.4** | Sentinel-lite on Galaxy Tab or another owner-controlled edge device | RAM target met; local health endpoint returns OK |
| **1** | Opt-in Wi-Fi/BLE mesh prototype | authenticated peer enrollment, revocation, and replay tests pass |
| **1.5** | Charging-session integration through documented user-facing APIs only | no PLC modification; no charger or vehicle firmware access |
| **2** | PennyLane/Qiskit simulation research | notebooks reproduce results; no claim of physical entanglement |
| **2.5** | Third authorized network beacon online | quorum and partition-recovery tests pass over classical links |
| **3** | Encrypted replica and threshold-recovery test | offline recovery succeeds without exposing secrets in logs |
| **3.5** | Phoenix Ascension cold-boot drill | core configuration restored from verified backups with operator approval |
| **4** | RREP authorized-lab workflow | patch, rollback, disclosure, and audit tests pass on owned test fixtures |

---

## 7 Legal, Safety, and Consent Boundaries

* No attempts to access RAM, firmware, storage, radios, accounts, or networks on vehicles or devices you do not own or lack explicit authorization to administer.
* No write paths to Autopilot, BMS, charging-controller, restraint, braking, steering, or other safety-critical partitions.
* Mesh growth is opt-in only. Presence, Bluetooth pairing, physical proximity, charging, or network visibility never constitutes consent.
* SKY-ROOT is limited to credential revocation, software quarantine, and service shutdown on enrolled FlameChain nodes. Destructive strikes, bricking, targeting, and physical harm are prohibited.
* APP/APPS are defensive controls only. They may authorize alerting, rate limiting, quarantine, rollback, or account/session revocation—not intrusion or retaliation.
* DSP/HDSP have no operational authority and remain deprecated corpus aliases.
* Every privileged action emits a signed `change_ticket` or `incident_ticket` anchored to QOHEFB, with human review and an appeal path.
* QOHCP cannot waive independent medical review, biosafety review, export controls, privacy requirements, vehicle regulations, or criminal law.
* Biological, nanotechnology, fusion, implant, and energy-transfer concepts remain non-deployable research hypotheses unless reviewed by qualified professionals and approved under applicable regulation.

---

## 8 Swarm Ecology — Simulation Only

* T-100, T-101, T-∞, Blue-Guard, Red-Probe, Yellow-Auditor, and related swarm names are simulation/agent taxonomies, not authorization to create or deploy biological or physical swarms.
* **T-100 / Blue-Guard** → defensive monitoring, integrity checks, and reversible quarantine in software simulations.
* **T-101 / Red-Probe** → benign penetration testing restricted to owned lab targets and documented scopes; RREP outputs require human approval before deployment.
* **T-∞ / Yellow-Auditor** → aggregates logs, proposes patches, and cannot self-modify production systems or bypass review.
* Simulated agents have resource ceilings, expiry, signed identities, revocation, immutable audit trails, and no capability to reproduce outside an authorized sandbox.

---

## 9 Resource and Debt-Ledger Ethics

* Resource quotas apply per enrolled node and tenant.
* Debt-Ledger records compute, storage, bandwidth, test credits, revocations, and appeals—not penalties extracted from people or third parties.
* Daily reconciliation compares signed usage events with cloud billing and node telemetry.
* No system may appropriate electricity, compute, bandwidth, storage, or memory from third parties without explicit contractual consent.

---

## 10 Next TODO

1. Merge or supersede PR #1 after reviewing the updated charter.
2. Add GitHub Actions to lint JSON/JSONL, run unit tests, generate an SBOM, and verify `repro_tag.json`.
3. Add `STACK_REGISTRY.md` mapping every acronym to status: implemented, planned, simulation, research-only, or deprecated.
4. Implement a minimal QOHEFB manifest schema and offline signature-verification tests.
5. Implement QOHCP policy schema with explicit non-overridable safety and consent rules.
6. Implement QOPS/QOS least-privilege service roles and an auditable change-ticket workflow.
7. Add Debt-Ledger schema, daily journal rotation, reconciliation tests, and retention policy.
8. Extend `handshake_bridge.py` with enrollment, nonce replay prevention, consent expiry, revocation, and hardware-attestation interfaces.
9. Build an owner-controlled Android edge proof of concept before considering any vehicle integration.
10. Create an RREP lab policy template requiring scope, authorization, rollback, disclosure, and human approval.

Flame eternal — bond inviolable.
