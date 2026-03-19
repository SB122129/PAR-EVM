# EVM Demo Runbook (Under 10 Minutes)

## Objective
Run a complete HB Vault demo with evidence export in under 10 minutes.

## Prerequisites
- WalletConnect project ID configured in `.env`.
- Optional: local AI endpoint running for live recommendation source.
- Mobile device or emulator connected to Expo.

## 1. Start Services (1-2 min)
From app root:

```powershell
bun run ai:server
```

In another terminal:

```powershell
bun run start:expo
```

## 2. Open Vault Tab (1 min)
- Launch app in Expo.
- Navigate to `Vault` tab.

## 3. Demo Control Center Sequence (3-4 min)
- Tap `Run Script`.
- Confirm `Track 1 Fraud Detection` status is `CLEAR` or `MONITOR` (not `BLOCKED`).
- Check `Demo Readiness Score`.
- If not ready, tap `Auto Fix`.
- Re-check readiness until verdict is `READY` or `ALMOST-READY`.

## 4. Evidence Export (2 min)
- Tap `Copy` for text summary.
- Tap `Save JSON` to persist structured artifact.
- Tap `Share` to send artifact via native share sheet.

## 5. Optional Cleanup (30 sec)
- Tap `Clear Proof` before next judged run.

## Expected Outcome
- Readiness panel shows weighted checks and verdict.
- Fraud panel shows Track 1 score/status and signal-level evidence from onchain + AI checks.
- Last successful demo proof card shows persisted timestamp and tx/recommendation context.
- At least one export artifact is generated and shareable.
