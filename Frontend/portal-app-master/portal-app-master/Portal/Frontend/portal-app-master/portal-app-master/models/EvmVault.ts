export type ImplementationPhaseStatus = 'done' | 'in-progress' | 'planned';

export interface ImplementationPhase {
  id: number;
  title: string;
  status: ImplementationPhaseStatus;
}

export interface EvmVaultSnapshot {
  tvlUsd: number;
  apyPercent: number;
  userDepositUsd: number;
  riskScore: number;
  confidence: number;
  strategySplit: Array<{
    name: string;
    allocationPercent: number;
  }>;
}

export interface EvmPolicyStatus {
  maxAllocationPerStrategy: number;
  rebalanceCooldownHours: number;
  emergencyPauseEnabled: boolean;
}

export interface EvmRecommendation {
  id: string;
  rationale: string;
  hash: string;
  createdAtIso: string;
  source: 'live-api' | 'mock';
  attestation: {
    status: 'verified' | 'unverified' | 'not-configured' | 'unavailable';
    registryAddress: string | null;
    lastCheckedIso: string;
    error: string | null;
  };
}

export interface EvmPolicyAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  createdAtIso: string;
}

export interface EvmRebalanceMetricSnapshot {
  riskScore: number;
  apyPercent: number;
  stableExposurePercent: number;
}

export interface EvmRebalanceMetric {
  id: string;
  label: string;
  before: EvmRebalanceMetricSnapshot;
  after: EvmRebalanceMetricSnapshot;
  estimatedNetDeltaUsd: number;
  createdAtIso: string;
}

export interface EvmFraudSignal {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'pass' | 'flagged';
  detail: string;
}

export interface EvmFraudAssessment {
  track: 'Track 1';
  status: 'clear' | 'monitor' | 'blocked';
  score: number;
  recommendedAction: string;
  checkedAtIso: string;
  signals: EvmFraudSignal[];
}

export interface EvmTrackOverview {
  phases: ImplementationPhase[];
  chain: {
    name: string;
    rpcUrl: string;
    connected: boolean;
    chainId: number | null;
    latestBlock: number | null;
    source: 'live-rpc' | 'mock';
    lastSyncIso: string;
  };
  snapshot: EvmVaultSnapshot;
  policy: EvmPolicyStatus;
  recommendation: EvmRecommendation;
  alerts: EvmPolicyAlert[];
  rebalanceMetrics: EvmRebalanceMetric[];
  fraudAssessment: EvmFraudAssessment;
}

export interface EvmTxIntent {
  type: 'deposit' | 'withdraw';
  amountUsd: number;
  chainId: number | null;
  to: string;
  data: string;
  value: string;
  mode: 'mock' | 'ready';
}

export type EvmTxExecutionStatus =
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed';

export interface EvmTxExecution {
  status: EvmTxExecutionStatus;
  mode: 'mock' | 'rpc';
  txHash: string | null;
  explorerUrl: string | null;
  error: string | null;
  updatedAtIso: string;
}

export interface EvmDemoStep {
  id: string;
  label: string;
  status: 'done' | 'failed' | 'skipped';
  detail: string;
  atIso: string;
}

export interface EvmDemoRunResult {
  success: boolean;
  startedAtIso: string;
  finishedAtIso: string;
  steps: EvmDemoStep[];
  lastIntent: EvmTxIntent | null;
  lastExecution: EvmTxExecution | null;
}
