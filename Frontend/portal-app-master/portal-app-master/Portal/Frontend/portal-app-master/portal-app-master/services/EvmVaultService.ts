import type {
  EvmDemoRunResult,
  EvmDemoStep,
  EvmFraudAssessment,
  EvmPolicyAlert,
  EvmRecommendation,
  EvmRebalanceMetric,
  EvmTrackOverview,
  EvmTxExecution,
  EvmTxIntent,
} from '@/models/EvmVault';
import evmSignerService from '@/services/EvmSignerService';

type EvmDemoReportInput = {
  overview: EvmTrackOverview;
  demoRunResult: EvmDemoRunResult | null;
  lastIntent: EvmTxIntent | null;
  lastExecution: EvmTxExecution | null;
  walletConnected: boolean;
  walletAddress: string | null;
};

type EvmDemoReportPayload = {
  generatedAtIso: string;
  chain: EvmTrackOverview['chain'];
  wallet: {
    connected: boolean;
    address: string | null;
  };
  snapshot: EvmTrackOverview['snapshot'];
  policy: EvmTrackOverview['policy'];
  recommendation: EvmTrackOverview['recommendation'];
  alerts: EvmTrackOverview['alerts'];
  rebalanceMetrics: EvmTrackOverview['rebalanceMetrics'];
  fraudAssessment: EvmTrackOverview['fraudAssessment'];
  lastIntent: EvmTxIntent | null;
  lastExecution: EvmTxExecution | null;
  demoRun: EvmDemoRunResult | null;
};

type EvmDemoReadinessCheck = {
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
};

type EvmDemoReadinessInput = {
  overview: EvmTrackOverview;
  walletConnected: boolean;
  demoRunResult: EvmDemoRunResult | null;
  lastExecution: EvmTxExecution | null;
};

type EvmDemoReadinessResult = {
  score: number;
  verdict: 'ready' | 'almost-ready' | 'not-ready';
  checks: EvmDemoReadinessCheck[];
};

const DEFAULT_EVM_RPC_URL = 'https://rpc.polkadot.io';
const DEFAULT_CHAIN_NAME = 'Polkadot Hub EVM';
const ERC4626_TOTAL_ASSETS_SELECTOR = '0x01e1d114';
const VERIFY_ATTESTATION_SELECTOR = '0x0f4ee0b2';
const DEFAULT_FRAUD_ORACLE_SCORE_SELECTOR = '0x9e82e310';

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || {};

type JsonRpcResponse<T> = {
  id: number;
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

type AiRecommendationResponse = {
  id?: string;
  rationale?: string;
  hash?: string;
  createdAtIso?: string;
  riskScore?: number;
  confidence?: number;
};

/**
 * Phase 1 service uses deterministic mock data so the feature can ship in-app
 * while contract and signer integration is built in later phases.
 */
export class EvmVaultService {
  private readonly rpcUrl = env.EXPO_PUBLIC_EVM_RPC_URL || DEFAULT_EVM_RPC_URL;

  private readonly chainName = env.EXPO_PUBLIC_EVM_CHAIN_NAME || DEFAULT_CHAIN_NAME;

  private readonly vaultAddress = env.EXPO_PUBLIC_EVM_VAULT_ADDRESS || '';

  private readonly stablecoinDecimals = Number.parseInt(
    env.EXPO_PUBLIC_EVM_STABLECOIN_DECIMALS || '6',
    10
  );

  private readonly aiRecommendationUrl = env.EXPO_PUBLIC_EVM_AI_RECOMMENDATION_URL || '';

  private readonly attestationRegistryAddress = env.EXPO_PUBLIC_EVM_ATTESTATION_REGISTRY_ADDRESS || '';

  private readonly attestationSelector =
    env.EXPO_PUBLIC_EVM_ATTESTATION_SELECTOR || VERIFY_ATTESTATION_SELECTOR;

  private readonly demoMode = env.EXPO_PUBLIC_EVM_DEMO_MODE === 'true';

  private readonly fraudOracleAddress = env.EXPO_PUBLIC_EVM_FRAUD_ORACLE_ADDRESS || '';

  private readonly fraudOracleScoreSelector =
    env.EXPO_PUBLIC_EVM_FRAUD_SCORE_SELECTOR || DEFAULT_FRAUD_ORACLE_SCORE_SELECTOR;

  private readonly fraudBlockScore = Number.parseInt(env.EXPO_PUBLIC_EVM_FRAUD_BLOCK_SCORE || '60', 10);

  private readonly fraudMonitorScore = Number.parseInt(
    env.EXPO_PUBLIC_EVM_FRAUD_MONITOR_SCORE || '30',
    10
  );

  private async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC HTTP error: ${response.status}`);
    }

    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error) {
      throw new Error(`RPC error ${payload.error.code}: ${payload.error.message}`);
    }

    if (payload.result === undefined) {
      throw new Error('RPC returned no result');
    }

    return payload.result;
  }

  private static hexToNumber(value: string): number {
    return Number.parseInt(value.replace(/^0x/, ''), 16);
  }

  private static isAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private static hexToBigInt(value: string): bigint {
    return BigInt(value);
  }

  private static isBytes32(value: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(value);
  }

  private static scaleDown(value: bigint, decimals: number): number {
    if (decimals <= 0) {
      return Number(value);
    }

    const base = 10n ** BigInt(decimals);
    const integer = value / base;
    const fraction = value % base;

    const fractionDigits = fraction.toString().padStart(decimals, '0').slice(0, 2);
    const composed = `${integer.toString()}.${fractionDigits || '00'}`;

    return Number.parseFloat(composed);
  }

  private async readVaultTvlUsd(): Promise<number | null> {
    if (!EvmVaultService.isAddress(this.vaultAddress)) {
      return null;
    }

    try {
      const result = await this.rpc<string>('eth_call', [
        {
          to: this.vaultAddress,
          data: ERC4626_TOTAL_ASSETS_SELECTOR,
        },
        'latest',
      ]);

      const rawAssets = EvmVaultService.hexToBigInt(result);
      return EvmVaultService.scaleDown(rawAssets, this.stablecoinDecimals);
    } catch {
      return null;
    }
  }

  private async getChainSnapshot(): Promise<EvmTrackOverview['chain']> {
    try {
      const [chainIdHex, latestBlockHex] = await Promise.all([
        this.rpc<string>('eth_chainId'),
        this.rpc<string>('eth_blockNumber'),
      ]);

      return {
        name: this.chainName,
        rpcUrl: this.rpcUrl,
        connected: true,
        chainId: EvmVaultService.hexToNumber(chainIdHex),
        latestBlock: EvmVaultService.hexToNumber(latestBlockHex),
        source: 'live-rpc',
        lastSyncIso: new Date().toISOString(),
      };
    } catch {
      return {
        name: this.chainName,
        rpcUrl: this.rpcUrl,
        connected: false,
        chainId: null,
        latestBlock: null,
        source: 'mock',
        lastSyncIso: new Date().toISOString(),
      };
    }
  }

  private async fetchAiRecommendation(): Promise<AiRecommendationResponse | null> {
    if (!this.aiRecommendationUrl) {
      return null;
    }

    try {
      const response = await fetch(this.aiRecommendationUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`AI endpoint HTTP ${response.status}`);
      }

      return (await response.json()) as AiRecommendationResponse;
    } catch {
      return null;
    }
  }

  private async verifyAttestation(hash: string): Promise<EvmRecommendation['attestation']> {
    const now = new Date().toISOString();

    if (
      !EvmVaultService.isAddress(this.attestationRegistryAddress) ||
      !EvmVaultService.isBytes32(hash) ||
      !/^0x[a-fA-F0-9]{8}$/.test(this.attestationSelector)
    ) {
      return {
        status: 'not-configured',
        registryAddress: EvmVaultService.isAddress(this.attestationRegistryAddress)
          ? this.attestationRegistryAddress
          : null,
        lastCheckedIso: now,
        error: null,
      };
    }

    try {
      const data = `${this.attestationSelector}${hash.slice(2)}`;
      const result = await this.rpc<string>('eth_call', [
        {
          to: this.attestationRegistryAddress,
          data,
        },
        'latest',
      ]);

      const normalized = result.toLowerCase();
      const boolVerified = /^0x0{63}1$/.test(normalized);

      return {
        status: boolVerified ? 'verified' : 'unverified',
        registryAddress: this.attestationRegistryAddress,
        lastCheckedIso: now,
        error: null,
      };
    } catch (error) {
      return {
        status: 'unavailable',
        registryAddress: this.attestationRegistryAddress,
        lastCheckedIso: now,
        error: error instanceof Error ? error.message : 'Attestation check failed',
      };
    }
  }

  private buildPolicyAlerts(
    snapshot: EvmTrackOverview['snapshot'],
    policy: EvmTrackOverview['policy'],
    recommendation: EvmRecommendation,
    chain: EvmTrackOverview['chain']
  ): EvmPolicyAlert[] {
    const now = new Date().toISOString();
    const alerts: EvmPolicyAlert[] = [];

    if (chain.source === 'mock') {
      alerts.push({
        id: `alert_chain_mock_${Date.now()}`,
        severity: 'warning',
        title: 'RPC Fallback Active',
        detail: 'Chain connectivity is in mock mode. Demo metrics may not reflect live state.',
        createdAtIso: now,
      });
    }

    if (recommendation.attestation.status !== 'verified') {
      alerts.push({
        id: `alert_attestation_${Date.now()}`,
        severity: 'warning',
        title: 'Recommendation Not Verified',
        detail:
          'Latest AI recommendation attestation is not verified. Keep allocation changes within conservative limits.',
        createdAtIso: now,
      });
    }

    if (snapshot.riskScore >= 65) {
      alerts.push({
        id: `alert_risk_${Date.now()}`,
        severity: 'critical',
        title: 'Risk Threshold Exceeded',
        detail: `Risk score is ${snapshot.riskScore}. Consider reducing volatile strategy exposure immediately.`,
        createdAtIso: now,
      });
    }

    if (!policy.emergencyPauseEnabled) {
      alerts.push({
        id: `alert_pause_${Date.now()}`,
        severity: 'info',
        title: 'Emergency Pause Disabled',
        detail: 'Enable emergency pause for demo hardening before final presentation.',
        createdAtIso: now,
      });
    }

    if (this.demoMode) {
      alerts.push({
        id: `alert_demo_${Date.now()}`,
        severity: 'info',
        title: 'Demo Mode Enabled',
        detail: 'Demo mode is active. Use this run for consistent showcase behavior.',
        createdAtIso: now,
      });
    }

    return alerts;
  }

  private buildRebalanceMetrics(snapshot: EvmTrackOverview['snapshot']): EvmRebalanceMetric[] {
    const beforeRiskScore = Math.min(100, snapshot.riskScore + 7);
    const beforeApyPercent = Math.max(0, Number.parseFloat((snapshot.apyPercent - 1.1).toFixed(2)));
    const beforeStableExposure = 68;

    const afterStableExposure = 76;
    const estimatedNetDeltaUsd = Number.parseFloat((snapshot.tvlUsd * 0.0012).toFixed(2));

    return [
      {
        id: `metric_rebalance_${Date.now()}`,
        label: 'Primary Rebalance Window',
        before: {
          riskScore: beforeRiskScore,
          apyPercent: beforeApyPercent,
          stableExposurePercent: beforeStableExposure,
        },
        after: {
          riskScore: snapshot.riskScore,
          apyPercent: snapshot.apyPercent,
          stableExposurePercent: afterStableExposure,
        },
        estimatedNetDeltaUsd,
        createdAtIso: new Date().toISOString(),
      },
    ];
  }

  private async readFraudOracleScore(): Promise<number | null> {
    if (!EvmVaultService.isAddress(this.fraudOracleAddress)) {
      return null;
    }

    if (!/^0x[a-fA-F0-9]{8}$/.test(this.fraudOracleScoreSelector)) {
      return null;
    }

    try {
      const result = await this.rpc<string>('eth_call', [
        {
          to: this.fraudOracleAddress,
          data: this.fraudOracleScoreSelector,
        },
        'latest',
      ]);

      // Accept uint256 response and clamp to 0-100 for consistent UI scoring.
      const parsed = Number(EvmVaultService.hexToBigInt(result));
      if (!Number.isFinite(parsed)) {
        return null;
      }

      return Math.max(0, Math.min(100, Math.round(parsed)));
    } catch {
      return null;
    }
  }

  private buildFraudAssessment(
    snapshot: EvmTrackOverview['snapshot'],
    recommendation: EvmRecommendation,
    policy: EvmTrackOverview['policy'],
    chain: EvmTrackOverview['chain'],
    alerts: EvmPolicyAlert[],
    onchainFraudScore: number | null
  ): EvmFraudAssessment {
    const signals: EvmFraudAssessment['signals'] = [];
    let score = 0;

    const pushSignal = (
      label: string,
      severity: EvmFraudAssessment['signals'][number]['severity'],
      flagged: boolean,
      detail: string,
      weight: number
    ): void => {
      if (flagged) {
        score += weight;
      }

      signals.push({
        id: `fraud_signal_${signals.length + 1}`,
        label,
        severity,
        status: flagged ? 'flagged' : 'pass',
        detail,
      });
    };

    pushSignal(
      'Onchain fraud oracle score',
      'critical',
      typeof onchainFraudScore === 'number' ? onchainFraudScore >= this.fraudBlockScore : true,
      typeof onchainFraudScore === 'number'
        ? `Fraud oracle returned ${onchainFraudScore}/100.`
        : 'Fraud oracle is not configured or unavailable.',
      typeof onchainFraudScore === 'number' ? Math.min(25, Math.round(onchainFraudScore / 4)) : 5
    );

    pushSignal(
      'Chain source integrity',
      'warning',
      chain.source !== 'live-rpc' || !chain.connected,
      chain.source === 'live-rpc' && chain.connected
        ? 'Live RPC source is healthy.'
        : 'Using fallback/mock chain data. Fraud confidence is reduced.',
      20
    );

    pushSignal(
      'Recommendation attestation',
      'critical',
      recommendation.attestation.status !== 'verified',
      `Attestation state is ${recommendation.attestation.status}.`,
      25
    );

    pushSignal(
      'Portfolio risk level',
      'critical',
      snapshot.riskScore >= 70,
      `Risk score is ${snapshot.riskScore}/100.`,
      30
    );

    pushSignal(
      'AI confidence floor',
      'warning',
      snapshot.confidence < 0.6,
      `Confidence is ${(snapshot.confidence * 100).toFixed(0)}%.`,
      10
    );

    pushSignal(
      'Emergency pause readiness',
      'warning',
      !policy.emergencyPauseEnabled,
      policy.emergencyPauseEnabled
        ? 'Emergency pause is available.'
        : 'Emergency pause is disabled, reducing incident response capacity.',
      10
    );

    const criticalAlertCount = alerts.filter((alert) => alert.severity === 'critical').length;
    pushSignal(
      'Critical policy alerts',
      'critical',
      criticalAlertCount > 0,
      criticalAlertCount > 0
        ? `${criticalAlertCount} critical policy alert(s) active.`
        : 'No active critical policy alerts.',
      Math.min(20, criticalAlertCount * 10)
    );

    const normalizedScore = Math.max(
      0,
      Math.min(
        100,
        typeof onchainFraudScore === 'number' ? Math.max(score, onchainFraudScore) : score
      )
    );
    let status: EvmFraudAssessment['status'] = 'clear';
    if (normalizedScore >= this.fraudBlockScore) {
      status = 'blocked';
    } else if (normalizedScore >= this.fraudMonitorScore) {
      status = 'monitor';
    }

    const recommendedAction =
      status === 'blocked'
        ? 'Block write transactions and resolve critical fraud signals first.'
        : status === 'monitor'
          ? 'Allow only limited flows and keep manual review active.'
          : 'Fraud posture is healthy. Standard transaction flow can proceed.';

    return {
      track: 'Track 1',
      status,
      score: normalizedScore,
      recommendedAction,
      checkedAtIso: new Date().toISOString(),
      signals,
    };
  }

  async getOverview(): Promise<EvmTrackOverview> {
    const [chain, liveTvlUsd, apiRecommendation, onchainFraudScore] = await Promise.all([
      this.getChainSnapshot(),
      this.readVaultTvlUsd(),
      this.fetchAiRecommendation(),
      this.readFraudOracleScore(),
    ]);

    const recommendationHash = EvmVaultService.isBytes32(apiRecommendation?.hash || '')
      ? (apiRecommendation?.hash as string)
      : '0x6cb1b8c18e9fd95a7f8a0a6b3e60ef38d922b03a7d98ec4cc6b40705dddb1a0e';

    const attestation = await this.verifyAttestation(recommendationHash);

    const snapshot = {
      tvlUsd: liveTvlUsd ?? 125400.42,
      apyPercent: 8.2,
      userDepositUsd: 0,
      riskScore:
        typeof apiRecommendation?.riskScore === 'number' ? apiRecommendation.riskScore : 28,
      confidence:
        typeof apiRecommendation?.confidence === 'number' ? apiRecommendation.confidence : 0.87,
      strategySplit: [
        { name: 'Conservative LP', allocationPercent: 55 },
        { name: 'Delta Neutral Yield', allocationPercent: 30 },
        { name: 'Liquidity Buffer', allocationPercent: 15 },
      ],
    };

    const policy = {
      maxAllocationPerStrategy: 60,
      rebalanceCooldownHours: 12,
      emergencyPauseEnabled: false,
    };

    const recommendation: EvmRecommendation = {
      id: apiRecommendation?.id || 'rec_2026_03_10_001',
      rationale:
        apiRecommendation?.rationale ||
        'Lower volatility window detected. Keep conservative majority while increasing neutral yield allocation.',
      hash: recommendationHash,
      createdAtIso: apiRecommendation?.createdAtIso || new Date().toISOString(),
      source: apiRecommendation ? 'live-api' : 'mock',
      attestation,
    };

    const alerts = this.buildPolicyAlerts(snapshot, policy, recommendation, chain);
    const rebalanceMetrics = this.buildRebalanceMetrics(snapshot);
    const fraudAssessment = this.buildFraudAssessment(
      snapshot,
      recommendation,
      policy,
      chain,
      alerts,
      onchainFraudScore
    );

    return {
      phases: [
        { id: 1, title: 'In-App Foundation', status: 'done' },
        { id: 2, title: 'Read-Only Onchain Integration', status: 'done' },
        { id: 3, title: 'Write Transactions', status: 'done' },
        { id: 4, title: 'AI + Keeper Integration', status: 'done' },
        { id: 5, title: 'Demo Hardening', status: 'done' },
      ],
      chain,
      snapshot,
      policy,
      recommendation,
      alerts,
      rebalanceMetrics,
      fraudAssessment,
    };
  }

  async refreshRecommendation(): Promise<EvmRecommendation> {
    const now = new Date().toISOString();
    const apiRecommendation = await this.fetchAiRecommendation();

    const recommendationHash = EvmVaultService.isBytes32(apiRecommendation?.hash || '')
      ? (apiRecommendation?.hash as string)
      : '0x31c9fca6c6dd0f036e17542131aab28f31d9fc56f7e2fdf177b6e7839dd03fd2';

    const attestation = await this.verifyAttestation(recommendationHash);

    return {
      id: apiRecommendation?.id || `rec_${Date.now()}`,
      rationale:
        apiRecommendation?.rationale ||
        'Phase 4 refresh completed. AI feed or attestation endpoint is unavailable, fallback recommendation applied.',
      hash: recommendationHash,
      createdAtIso: apiRecommendation?.createdAtIso || now,
      source: apiRecommendation ? 'live-api' : 'mock',
      attestation,
    };
  }

  async buildDepositIntent(amountUsd: number): Promise<EvmTxIntent> {
    const chain = await this.getChainSnapshot();

    return {
      type: 'deposit',
      amountUsd,
      chainId: chain.chainId,
      to: EvmVaultService.isAddress(this.vaultAddress)
        ? this.vaultAddress
        : '0x0000000000000000000000000000000000000000',
      data: '0x',
      value: '0x0',
      mode: EvmVaultService.isAddress(this.vaultAddress) ? 'ready' : 'mock',
    };
  }

  async buildWithdrawIntent(amountUsd: number): Promise<EvmTxIntent> {
    const chain = await this.getChainSnapshot();

    return {
      type: 'withdraw',
      amountUsd,
      chainId: chain.chainId,
      to: EvmVaultService.isAddress(this.vaultAddress)
        ? this.vaultAddress
        : '0x0000000000000000000000000000000000000000',
      data: '0x',
      value: '0x0',
      mode: EvmVaultService.isAddress(this.vaultAddress) ? 'ready' : 'mock',
    };
  }

  async executeIntent(
    intent: EvmTxIntent,
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmTxExecution> {
    const overview = await this.getOverview();
    if (overview.fraudAssessment.status === 'blocked') {
      const blockedExecution: EvmTxExecution = {
        status: 'failed',
        mode: intent.mode === 'ready' ? 'rpc' : 'mock',
        txHash: null,
        explorerUrl: null,
        error: `Track 1 fraud gate blocked execution (${overview.fraudAssessment.score}/100).`,
        updatedAtIso: new Date().toISOString(),
      };

      if (onProgress) {
        onProgress(blockedExecution);
      }

      return blockedExecution;
    }

    return evmSignerService.executeIntent(intent, onProgress);
  }

  async submitDeposit(
    amountUsd: number,
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmTxExecution> {
    const intent = await this.buildDepositIntent(amountUsd);
    return this.executeIntent(intent, onProgress);
  }

  async submitWithdraw(
    amountUsd: number,
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmTxExecution> {
    const intent = await this.buildWithdrawIntent(amountUsd);
    return this.executeIntent(intent, onProgress);
  }

  async runDemoScenario(
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmDemoRunResult> {
    const startedAtIso = new Date().toISOString();
    const steps: EvmDemoStep[] = [];
    let lastIntent: EvmTxIntent | null = null;
    let lastExecution: EvmTxExecution | null = null;

    const pushStep = (
      label: string,
      status: EvmDemoStep['status'],
      detail: string
    ): void => {
      steps.push({
        id: `demo_step_${steps.length + 1}_${Date.now()}`,
        label,
        status,
        detail,
        atIso: new Date().toISOString(),
      });
    };

    try {
      const chain = await this.getChainSnapshot();
      pushStep(
        'Load Chain State',
        'done',
        `source=${chain.source}, chainId=${chain.chainId ?? 'n/a'}, block=${chain.latestBlock ?? 'n/a'}`
      );

      const recommendation = await this.refreshRecommendation();
      pushStep(
        'Refresh AI Recommendation',
        'done',
        `source=${recommendation.source}, attestation=${recommendation.attestation.status}`
      );

      const baseIntent = await this.buildDepositIntent(100);
      lastIntent = this.demoMode ? { ...baseIntent, mode: 'mock' } : baseIntent;
      pushStep(
        'Prepare Deposit Intent',
        'done',
        `mode=${lastIntent.mode}${this.demoMode ? ' (forced for demo mode)' : ''}`
      );

      lastExecution = await this.executeIntent(lastIntent, onProgress);
      pushStep(
        'Execute Demo Transaction',
        lastExecution.status === 'failed' ? 'failed' : 'done',
        lastExecution.error || `status=${lastExecution.status}, mode=${lastExecution.mode}`
      );

      const overview = await this.getOverview();
      pushStep(
        'Collect Hardening Metrics',
        'done',
        `alerts=${overview.alerts.length}, metricSnapshots=${overview.rebalanceMetrics.length}`
      );

      return {
        success: !steps.some(step => step.status === 'failed'),
        startedAtIso,
        finishedAtIso: new Date().toISOString(),
        steps,
        lastIntent,
        lastExecution,
      };
    } catch (error) {
      pushStep(
        'Demo Flow Aborted',
        'failed',
        error instanceof Error ? error.message : 'Unknown demo script error'
      );

      return {
        success: false,
        startedAtIso,
        finishedAtIso: new Date().toISOString(),
        steps,
        lastIntent,
        lastExecution,
      };
    }
  }

  buildDemoReportText(input: EvmDemoReportInput): string {
    const { overview, demoRunResult, lastIntent, lastExecution, walletConnected, walletAddress } = input;

    const lines: string[] = [];
    lines.push('HB Vault Demo Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(`Chain: ${overview.chain.name}`);
    lines.push(`Chain source: ${overview.chain.source}`);
    lines.push(`Chain ID: ${overview.chain.chainId ?? 'n/a'}`);
    lines.push(`Latest block: ${overview.chain.latestBlock ?? 'n/a'}`);
    lines.push('');
    lines.push(`Wallet connected: ${walletConnected ? 'yes' : 'no'}`);
    lines.push(`Wallet address: ${walletAddress || 'n/a'}`);
    lines.push('');
    lines.push(`Risk score: ${overview.snapshot.riskScore}`);
    lines.push(`Confidence: ${overview.snapshot.confidence}`);
    lines.push(`AI source: ${overview.recommendation.source}`);
    lines.push(`Attestation status: ${overview.recommendation.attestation.status}`);
    lines.push(`Alerts: ${overview.alerts.length}`);
    lines.push(`Rebalance metrics: ${overview.rebalanceMetrics.length}`);
    lines.push(
      `Track 1 fraud: ${overview.fraudAssessment.status} (${overview.fraudAssessment.score}/100)`
    );
    lines.push('');

    if (lastIntent) {
      lines.push(`Last intent: ${lastIntent.type} $${lastIntent.amountUsd} mode=${lastIntent.mode}`);
    } else {
      lines.push('Last intent: n/a');
    }

    if (lastExecution) {
      lines.push(`Last tx status: ${lastExecution.status} (${lastExecution.mode})`);
      lines.push(`Last tx hash: ${lastExecution.txHash || 'n/a'}`);
      lines.push(`Last tx error: ${lastExecution.error || 'n/a'}`);
    } else {
      lines.push('Last tx status: n/a');
    }

    lines.push('');
    lines.push('Demo script:');
    if (!demoRunResult) {
      lines.push('- not run');
    } else {
      lines.push(`- success: ${demoRunResult.success}`);
      lines.push(`- started: ${demoRunResult.startedAtIso}`);
      lines.push(`- finished: ${demoRunResult.finishedAtIso}`);
      demoRunResult.steps.forEach((step: EvmDemoStep) => {
        lines.push(`- [${step.status}] ${step.label}: ${step.detail}`);
      });
    }

    return lines.join('\n');
  }

  buildDemoReportPayload(input: EvmDemoReportInput): EvmDemoReportPayload {
    const { overview, demoRunResult, lastIntent, lastExecution, walletConnected, walletAddress } = input;

    return {
      generatedAtIso: new Date().toISOString(),
      chain: overview.chain,
      wallet: {
        connected: walletConnected,
        address: walletAddress,
      },
      snapshot: overview.snapshot,
      policy: overview.policy,
      recommendation: overview.recommendation,
      alerts: overview.alerts,
      rebalanceMetrics: overview.rebalanceMetrics,
      fraudAssessment: overview.fraudAssessment,
      lastIntent,
      lastExecution,
      demoRun: demoRunResult,
    };
  }

  getDemoReadiness(input: EvmDemoReadinessInput): EvmDemoReadinessResult {
    const { overview, walletConnected, demoRunResult, lastExecution } = input;

    const checks: EvmDemoReadinessCheck[] = [
      {
        label: 'Wallet connected',
        passed: walletConnected,
        weight: 20,
        detail: walletConnected ? 'Wallet session active.' : 'Connect WalletConnect before demo.',
      },
      {
        label: 'Live chain data',
        passed: overview.chain.source === 'live-rpc' && overview.chain.connected,
        weight: 20,
        detail:
          overview.chain.source === 'live-rpc'
            ? 'Using live RPC data.'
            : 'RPC is in mock fallback mode.',
      },
      {
        label: 'AI recommendation available',
        passed: overview.recommendation.source === 'live-api',
        weight: 15,
        detail:
          overview.recommendation.source === 'live-api'
            ? 'Live AI recommendation loaded.'
            : 'Recommendation using mock fallback.',
      },
      {
        label: 'Attestation verified',
        passed: overview.recommendation.attestation.status === 'verified',
        weight: 15,
        detail: `Attestation status is ${overview.recommendation.attestation.status}.`,
      },
      {
        label: 'Transaction flow executed',
        passed:
          lastExecution !== null &&
          (lastExecution.status === 'confirmed' || lastExecution.status === 'pending'),
        weight: 15,
        detail:
          lastExecution === null
            ? 'Run a deposit/withdraw or demo script transaction.'
            : `Latest tx status: ${lastExecution.status}.`,
      },
      {
        label: 'Track 1 fraud gate clear',
        passed: overview.fraudAssessment.status !== 'blocked',
        weight: 10,
        detail:
          overview.fraudAssessment.status === 'blocked'
            ? `Fraud score ${overview.fraudAssessment.score}/100 is blocking writes.`
            : `Fraud status: ${overview.fraudAssessment.status}.`,
      },
      {
        label: 'Demo script success',
        passed: Boolean(demoRunResult?.success),
        weight: 5,
        detail: demoRunResult?.success
          ? 'Scripted flow completed successfully.'
          : 'Run Demo Script and ensure it passes.',
      },
    ];

    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const earnedWeight = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    let verdict: EvmDemoReadinessResult['verdict'] = 'not-ready';
    if (score >= 85) {
      verdict = 'ready';
    } else if (score >= 60) {
      verdict = 'almost-ready';
    }

    return {
      score,
      verdict,
      checks,
    };
  }
}

export default new EvmVaultService();
