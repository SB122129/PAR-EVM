# EVM Track 1 Current State (March 10, 2026)

## Scope
This report summarizes the current state of the mobile EVM implementation for:
- Track 1: EVM Smart Contract Track
- Focus areas: DeFi/stablecoin dapps and AI-powered decentralized applications

## Current Features Implemented

### 1. Core Track 1 EVM Foundation
- Dedicated `Vault` tab in the React Native app.
- EVM service/model layer with typed contracts for chain, policy, recommendation, transaction, demo, and fraud data.
- Live RPC integration via `eth_chainId`, `eth_blockNumber`, and optional `eth_call` for ERC-4626 TVL (`totalAssets`).
- Fallback mock behavior when RPC is unavailable.

### 2. DeFi and Stablecoin Flows
- Vault snapshot in app UI (TVL, APY, user deposit, risk, confidence, strategy split).
- Deposit and withdraw intent builders.
- Transaction execution flow with statuses (`submitting`, `pending`, `confirmed`, `failed`).
- Explorer URL support and transaction diagnostics.

### 3. Wallet and Signing
- WalletConnect integration for EVM signer sessions.
- External raw signer path for production-style `eth_sendRawTransaction` flow.
- Optional unlocked RPC fallback for dev/test (`eth_sendTransaction`) controlled by env flag.
- Wallet session diagnostics visible in app.

### 4. AI-Powered dapp Capability
- AI recommendation endpoint integration with local Gemini-backed server (`/api/recommendation`).
- Display of rationale, risk score, confidence, source, recommendation hash.
- Onchain attestation verification support via configurable registry selector.

### 5. Track 1 Fraud Detection (Integrated)
- Track 1 fraud assessment in mobile app with:
  - aggregate score (0-100)
  - status (`clear`, `monitor`, `blocked`)
  - signal-level evidence
- Inputs merged into fraud scoring:
  - onchain fraud oracle score (`eth_call`)
  - chain source integrity
  - attestation state
  - risk score and AI confidence
  - policy/critical alerts
- Fraud enforcement in service layer:
  - write transaction execution is blocked when status is `blocked`.
- Judge-facing fraud panel available in UI and included in demo evidence output.

### 6. Demo and Evidence Hardening
- Run script, readiness score, auto-fix hints, fix-first panel.
- Copy, save JSON, and share demo report artifacts.
- Persisted last successful demo proof.
- Presenter mode and runbook for under-10-minute execution.

## Suitability Level for Track 1

### Current Suitability: High (8.5/10)
Why:
- Strong alignment with EVM smart-contract usage in mobile app (reads, writes, wallet, optional oracle and attestation contracts).
- Clear DeFi/stablecoin product surface (vault flows, policy/metrics).
- AI capability is integrated and tied to onchain verification paths.
- Fraud/risk controls are visible and enforceable.

### What keeps it from 10/10 right now
- Live production contract addresses and selectors must be finalized and validated end-to-end.
- Fraud oracle should be configured and returning stable live values in judged environment.
- Some UI still reads as diagnostics-heavy demo tooling rather than polished user flow.
- Full production pass for edge UX states and chain/network mismatch handling can be improved.

## UI Work Still Needed (React Native)

### Priority 1 (must-do)
- Add a compact top summary card with:
  - Track 1 status
  - chain health
  - fraud status
  - one primary action
- Improve blocked transaction UX:
  - clearer reason mapping from flagged fraud signals
  - direct remediation CTA(s)
- Add empty/error/skeleton states for all major cards (chain, AI, fraud, tx).

### Priority 2 (should-do)
- Improve visual hierarchy:
  - reduce text density in `Vault` tab
  - group advanced diagnostics behind collapsible sections
- Add explicit "live vs mock" badges on all critical data points.
- Add short in-app tooltips for fraud signals and attestation statuses.

### Priority 3 (polish)
- Add dedicated history list for recent transaction attempts + fraud status at attempt time.
- Add clearer success/failure toasts and persistent banners for critical issues.
- Improve responsive spacing and card density for small-screen devices.

## What Is Needed to Run on Expo

## 1. Tooling and dependencies
- Bun installed (project uses `bun` scripts).
- Expo CLI available through project scripts.
- Dependencies installed in app folder.

## 2. Environment variables (`.env`)
Minimum recommended for meaningful Track 1 runs:
- `EXPO_PUBLIC_EVM_RPC_URL`
- `EXPO_PUBLIC_EVM_CHAIN_NAME`
- `EXPO_PUBLIC_EVM_CHAIN_ID`
- `EXPO_PUBLIC_EVM_VAULT_ADDRESS` (for live vault reads/writes)
- `EXPO_PUBLIC_EVM_AI_RECOMMENDATION_URL`
- `GEMINI_API_KEY` (used by local AI recommendation server)
- `GEMINI_MODEL` (default `gemini-1.5-flash`)
- `EXPO_PUBLIC_EVM_ATTESTATION_REGISTRY_ADDRESS`
- `EXPO_PUBLIC_EVM_ATTESTATION_SELECTOR`
- `EXPO_PUBLIC_EVM_FRAUD_ORACLE_ADDRESS`
- `EXPO_PUBLIC_EVM_FRAUD_SCORE_SELECTOR`
- `EXPO_PUBLIC_EVM_FRAUD_MONITOR_SCORE`
- `EXPO_PUBLIC_EVM_FRAUD_BLOCK_SCORE`
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID`

## 3. Startup commands
From app root (`Portal/Frontend/portal-app-master/portal-app-master`):

```powershell
bun run ai:server
```

In another terminal:

```powershell
bun run start:expo
```

Gemini-backed recommendation endpoint is served by:

```powershell
bun run ai:server
```

It reads `GEMINI_API_KEY` and `GEMINI_MODEL` from `.env`.

Notes:
- `bun run start:expo -- --help` is currently working in this environment.
- `bun run start` may still fail if lint/check gates fail; use `start:expo` for fast runtime validation.
- If Gemini API is unavailable, the local server falls back to deterministic mock recommendation output.

## 4. Device/emulator
- Launch with Expo Go or a dev client.
- Ensure wallet app is available for WalletConnect pairing if testing write flows.

## Current Readiness Summary
- Feature completeness for Track 1: strong.
- Demo readiness: strong.
- Production readiness: moderate-to-strong, pending final live contract/env hardening and UI flow polish.

## Runtime Validation (March 10, 2026)
- `GET /health` on local AI server reports:
  - `model: gemini-1.5-flash`
  - `geminiConfigured: true`
- `GET /api/recommendation` returns valid app schema:
  - `id`, `rationale`, `hash`, `createdAtIso`, `riskScore`, `confidence`
- If Gemini response parsing fails or the model call is unavailable, the endpoint safely falls back to deterministic mock output.
