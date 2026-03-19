# EVM Go-Live Requirements (Full Live Mode)

## Purpose
This document defines exactly what is still required to run the HB Vault feature in full live mode (not fallback/mock mode).

## 1. Environment Configuration
All required environment variables must be set in `.env` for the mobile app runtime.

### Core Chain + Vault
- `EXPO_PUBLIC_EVM_RPC_URL`
- `EXPO_PUBLIC_EVM_CHAIN_NAME`
- `EXPO_PUBLIC_EVM_CHAIN_ID`
- `EXPO_PUBLIC_EVM_VAULT_ADDRESS`
- `EXPO_PUBLIC_EVM_STABLECOIN_DECIMALS`
- `EXPO_PUBLIC_EVM_EXPLORER_TX_BASE_URL`

### Transaction + Signer
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `EXPO_PUBLIC_EVM_FROM_ADDRESS`
- `EXPO_PUBLIC_EVM_GAS_LIMIT`
- `EXPO_PUBLIC_EVM_ALLOW_RPC_SEND_TRANSACTION=false` (production expectation)

### WalletConnect App Metadata
- `EXPO_PUBLIC_APP_NAME`
- `EXPO_PUBLIC_APP_DESCRIPTION`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_APP_ICON_URL`

### AI + Attestation
- `EXPO_PUBLIC_EVM_AI_RECOMMENDATION_URL`
- `EXPO_PUBLIC_EVM_ATTESTATION_REGISTRY_ADDRESS`
- `EXPO_PUBLIC_EVM_ATTESTATION_SELECTOR`

### Demo Flag
- `EXPO_PUBLIC_EVM_DEMO_MODE`
- Set `false` for full live behavior.

## 2. Wallet + Signing Requirements
A compatible EVM wallet path must be functional in mobile runtime.

### Required
- WalletConnect session can connect from device to chosen wallet app.
- Wallet returns a valid account for `eth_accounts`.
- Transaction signing path works for your wallet/provider implementation.

### Verify
- `Signer Setup (Phase 3)` panel shows:
- `WalletConnect Project ID: Configured`
- `External Signer Registered: Yes` after connect
- `WC Connected: Yes`

### Notes
- Wallet support differs for `eth_signTransaction`; if unsupported, use a signing fallback implementation before production rollout.

## 3. Onchain Contract Requirements
Live contract endpoints must be deployed and correct.

### Vault Contract
- `EXPO_PUBLIC_EVM_VAULT_ADDRESS` points to deployed vault contract.
- `eth_call` with selector `0x01e1d114` (`totalAssets`) returns valid data.

### Attestation Registry Contract
- `EXPO_PUBLIC_EVM_ATTESTATION_REGISTRY_ADDRESS` points to deployed registry.
- `EXPO_PUBLIC_EVM_ATTESTATION_SELECTOR` corresponds to the real method signature used by registry.
- Registry call must return ABI bool result (`0x...01` for verified).

## 4. AI Recommendation Service Requirements
The recommendation API must be reachable from mobile runtime and return valid JSON.

### Required JSON Shape
```json
{
  "id": "rec_...",
  "rationale": "...",
  "hash": "0x<64-hex>",
  "createdAtIso": "2026-03-10T00:00:00.000Z",
  "riskScore": 31,
  "confidence": 0.89
}
```

### Required Rules
- `hash` must be valid bytes32 hex (`0x` + 64 hex chars).
- Endpoint returns HTTP 200 and `application/json`.
- Latency is stable enough for mobile UX.

## 5. Runtime/Device Requirements
- Expo app runs on target device or emulator.
- Device has network connectivity to:
- RPC endpoint
- AI endpoint
- WalletConnect relay
- Wallet app installed on test device for WalletConnect pairing.

## 6. Security and Production Behavior
- `EXPO_PUBLIC_EVM_ALLOW_RPC_SEND_TRANSACTION` must remain `false` in production.
- Do not rely on unlocked RPC account flow for production.
- Use wallet-backed signing flow only.
- Verify that no sensitive keys are persisted outside secure wallet paths.

## 7. Go-Live Validation Checklist
Run and verify all items below:

1. Wallet connected and account visible in Vault signer diagnostics.
2. Chain status shows `source=live-rpc`, valid chain ID, and increasing block height.
3. AI recommendation source shows `live-api`.
4. Attestation status resolves to expected live result (ideally `verified`).
5. Deposit/withdraw transaction reaches `pending` and then `confirmed`.
6. Explorer link opens correctly for transaction hash.
7. Demo script finishes with success.
8. Demo readiness score is acceptable for presentation.
9. Report export works:
- Copy
- Save JSON
- Share
10. App restart still loads last successful demo proof.

## 8. Final Acceptance Definition
The feature is considered fully live when:
- No critical path depends on mock fallback.
- Wallet signing, onchain reads/writes, AI feed, and attestation checks all operate with real endpoints.
- Demo runbook completes within 10 minutes on a clean session.
