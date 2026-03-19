# EVM Track Implementation Plan (Polkadot Hub)

## Goal
Integrate an EVM-native feature directly into the existing Portal mobile app that targets:
- DeFi + stablecoin-enabled dapps
- AI-powered decentralized applications

## Product
HB Vault: an AI-assisted stablecoin vault on Polkadot Hub EVM with onchain policy guardrails.

## Phase 1: In-App Foundation (Now)
Status: Done

### Scope
- Add a new `Vault` tab in the mobile app.
- Add EVM feature models and service contracts.
- Add UI to display vault metrics, policy status, and implementation progress.
- Wire actions to service layer with mock responses.
- Add Track 1 fraud detection panel with score/status and signal-level evidence.

### Acceptance Criteria
- `Vault` tab is visible and navigable in the existing app.
- Service returns typed data consumed by UI.
- Fraud status is evaluated and visible in-app before any write transaction.

## Phase 2: Read-Only Onchain Integration
Status: Done

### Scope
- Connect to Polkadot Hub EVM RPC endpoint.
- Read vault contract data (TVL, APY, user balance, policy params).
- Display recommendation hash and latest rebalance metadata.
- Read optional fraud-oracle contract score over `eth_call` and merge it into fraud gating.

### Current Progress
- Connected app service to RPC probing using `eth_chainId` and `eth_blockNumber`.
- Exposed chain connectivity, chain ID, and latest block in the Vault tab.
- Added fallback to mock mode when RPC is unavailable.
- Added optional `eth_call` support for ERC-4626 `totalAssets()` using `EXPO_PUBLIC_EVM_VAULT_ADDRESS`.

### Environment Variables
- `EXPO_PUBLIC_EVM_RPC_URL`: JSON-RPC endpoint for Polkadot Hub EVM.
- `EXPO_PUBLIC_EVM_CHAIN_NAME`: Display name shown in the app.
- `EXPO_PUBLIC_EVM_VAULT_ADDRESS`: Optional ERC-4626 vault contract address.
- `EXPO_PUBLIC_EVM_STABLECOIN_DECIMALS`: Decimals used to scale `totalAssets` into display USD.
- `EXPO_PUBLIC_EVM_FRAUD_ORACLE_ADDRESS`: Optional fraud-oracle contract address for Track 1 detection.
- `EXPO_PUBLIC_EVM_FRAUD_SCORE_SELECTOR`: 4-byte selector for fraud score getter (returns uint256 0-100).

### Acceptance Criteria
- App can query live contract state.
- Data refresh works manually and on screen focus.

## Phase 3: Write Transactions
Status: Done

### Scope
- Add deposit/withdraw transaction flows.
- Add wallet/provider abstraction for signing.
- Add optimistic UI + transaction state handling.

### Current Progress
- Added typed deposit/withdraw transaction intent builders in service layer.
- Added signer service abstraction that supports mock execution and RPC-backed `eth_sendTransaction` mode.
- Added transaction lifecycle handling (`submitting` -> `pending` -> `confirmed`/`failed`) with receipt polling.
- Added Vault UI actions to submit deposit/withdraw flows and display tx status, hash, and errors.
- Added external raw signer adapter path that prefers `eth_sendRawTransaction` for production-oriented flow.
- Added explicit config guard so unlocked-node `eth_sendTransaction` fallback is opt-in only.
- Added WalletConnect EVM service (`@walletconnect/ethereum-provider`) with connect/disconnect flow.
- Added automatic registration of WalletConnect signer bridge into `EvmSignerService` after wallet connection.
- Added in-app signer diagnostics for WalletConnect initialization, address, chain ID, and pairing URI.
- Configured headless WalletConnect mode for React Native (`showQrModal: false`) and surfaced pairing URI in app diagnostics.

### Environment Variables
- `EXPO_PUBLIC_EVM_FROM_ADDRESS`: Sender address for RPC transaction mode.
- `EXPO_PUBLIC_EVM_GAS_LIMIT`: Hex gas limit used for `eth_sendTransaction`.
- `EXPO_PUBLIC_EVM_EXPLORER_TX_BASE_URL`: Optional transaction explorer URL prefix.
- `EXPO_PUBLIC_EVM_ALLOW_RPC_SEND_TRANSACTION`: Set `true` only for dev/test unlocked-RPC fallback.
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect Cloud project ID used for EVM signer session setup.
- `EXPO_PUBLIC_EVM_CHAIN_ID`: EVM chain ID used for WalletConnect session initialization.
- `EXPO_PUBLIC_APP_NAME`: WalletConnect app metadata name.
- `EXPO_PUBLIC_APP_DESCRIPTION`: WalletConnect app metadata description.
- `EXPO_PUBLIC_APP_URL`: WalletConnect app metadata URL.
- `EXPO_PUBLIC_APP_ICON_URL`: WalletConnect app metadata icon URL.

### Integration Hook
- Register a real signer with `EvmSignerService.registerExternalRawSigner(...)` to sign transactions client-side and submit through `eth_sendRawTransaction`.

### Acceptance Criteria
- User can submit deposit/withdraw transactions from mobile flow.
- Transaction lifecycle and errors are surfaced clearly.

## Phase 4: AI + Keeper Integration
Status: Done

### Scope
- Integrate AI recommendation feed endpoint.
- Display risk score, confidence, rationale.
- Verify recommendation attestation hash against onchain registry.

### Current Progress
- Added AI recommendation fetch path using `EXPO_PUBLIC_EVM_AI_RECOMMENDATION_URL` with fallback to mock recommendations.
- Added onchain attestation check via configurable registry call (`eth_call`) and surfaced verification state.
- Added recommendation source and attestation diagnostics in the Vault screen.

### Environment Variables
- `EXPO_PUBLIC_EVM_AI_RECOMMENDATION_URL`: AI recommendation API endpoint returning recommendation payload.
- `EXPO_PUBLIC_EVM_ATTESTATION_REGISTRY_ADDRESS`: Onchain registry contract for attestation validation.
- `EXPO_PUBLIC_EVM_ATTESTATION_SELECTOR`: 4-byte method selector for `bytes32 -> bool` attestation check.

### Acceptance Criteria
- Recommendation shown in app is verifiable and linked to chain state.

## Phase 5: Demo Hardening
Status: Done

### Scope
- Circuit breaker and policy alerts in UI.
- Metrics page for before/after rebalance snapshots.
- Demo script and fallback mock mode.

### Current Progress
- Added in-app Phase 5 policy alerts for attestation status, RPC fallback status, risk threshold, and emergency pause readiness.
- Added rebalance before/after metrics snapshot in Vault UI with estimated net delta output.
- Added `EXPO_PUBLIC_EVM_DEMO_MODE` to produce deterministic demo-friendly alerting behavior.
- Added one-tap `Run Demo Script` flow that executes a deterministic showcase sequence and logs step-by-step outcomes in-app.
- Added `Copy Demo Report` action to export judge-ready summary text (chain, risk, AI/attestation, tx status, and demo steps).
- Added `Save Demo Report JSON` action to persist structured demo artifacts to device storage for judging handoff.
- Added `Share Demo Report` action using native share sheet for direct sending to judges.
- Added weighted `Demo Readiness Score` checklist (wallet, chain, AI source, attestation, tx flow, demo run) for pre-pitch validation.
- Added color-coded readiness verdict and a `Fix First` top-3 failed checks panel for fast live-demo recovery.
- Added `Run Auto Fix Hints` action that attempts mapped recovery steps and logs outcomes inline.
- Added persistence for last successful demo run proof (timestamp, chain snapshot, recommendation state, tx outcome) across app restarts.
- Added `Clear Proof` action to reset persisted demo evidence before a new judged run.
- Added top-level `Demo Control Center` card to expose script/fix/export/proof actions without scrolling.
- Added `Presenter Mode` toggle to keep only judge-facing controls and readiness/proof panels visible.
- Added reproducible demo runbook (`docs/EVM_DEMO_RUNBOOK.md`) for under-10-minute setup and execution.

### Environment Variables
- `EXPO_PUBLIC_EVM_DEMO_MODE`: Set `true` to enable demo hardening hints and stable showcase behavior.
- `EXPO_PUBLIC_EVM_FRAUD_MONITOR_SCORE`: Score threshold to move from `clear` to `monitor` state.
- `EXPO_PUBLIC_EVM_FRAUD_BLOCK_SCORE`: Score threshold to block deposit/withdraw execution.

### Acceptance Criteria
- End-to-end demo flow is reproducible in under 10 minutes.
- Track 1 fraud score and gate behavior are visible and reproducible in the mobile app.
