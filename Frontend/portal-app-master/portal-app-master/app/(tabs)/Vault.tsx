import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import type {
  EvmDemoRunResult,
  EvmTrackOverview,
  EvmTxExecution,
  EvmTxIntent,
} from '@/models/EvmVault';
import evmSignerService, { type EvmSignerSetupStatus } from '@/services/EvmSignerService';
import evmVaultService from '@/services/EvmVaultService';
import walletConnectEvmService, {
  type WalletConnectEvmStatus,
} from '@/services/WalletConnectEvmService';

const LAST_SUCCESSFUL_DEMO_KEY = 'evm_vault_last_successful_demo_proof';

type DemoProofSnapshot = {
  storedAtIso: string;
  demoRunResult: EvmDemoRunResult;
  lastIntent: EvmTxIntent | null;
  lastExecution: EvmTxExecution | null;
  chain: EvmTrackOverview['chain'];
  recommendation: EvmTrackOverview['recommendation'];
};

export default function VaultScreen() {
  const [overview, setOverview] = useState<EvmTrackOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [lastIntent, setLastIntent] = useState<EvmTxIntent | null>(null);
  const [lastExecution, setLastExecution] = useState<EvmTxExecution | null>(null);
  const [isRunningDemoScript, setIsRunningDemoScript] = useState(false);
  const [demoRunResult, setDemoRunResult] = useState<EvmDemoRunResult | null>(null);
  const [lastSuccessfulDemoProof, setLastSuccessfulDemoProof] = useState<DemoProofSnapshot | null>(
    null
  );
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixLogs, setAutoFixLogs] = useState<string[]>([]);
  const [savedReportUri, setSavedReportUri] = useState<string | null>(null);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [signerSetup, setSignerSetup] = useState<EvmSignerSetupStatus | null>(null);
  const [walletConnectStatus, setWalletConnectStatus] = useState<WalletConnectEvmStatus | null>(
    null
  );
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderPrimary = useThemeColor({}, 'borderPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');

  const load = useCallback(async () => {
    const data = await evmVaultService.getOverview();
    setOverview(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
        setSignerSetup(evmSignerService.getSetupStatus());
        setWalletConnectStatus(walletConnectEvmService.getStatus());

        const storedProofRaw = await AsyncStorage.getItem(LAST_SUCCESSFUL_DEMO_KEY);
        if (storedProofRaw) {
          try {
            setLastSuccessfulDemoProof(JSON.parse(storedProofRaw) as DemoProofSnapshot);
          } catch {
            await AsyncStorage.removeItem(LAST_SUCCESSFUL_DEMO_KEY);
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [load]);

  const refreshSignerStatus = useCallback(() => {
    setSignerSetup(evmSignerService.getSetupStatus());
    setWalletConnectStatus(walletConnectEvmService.getStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          const data = await evmVaultService.getOverview();
          if (active) {
            setOverview(data);
            refreshSignerStatus();
          }
        } catch {
          // Keep existing view state if refresh fails while navigating.
        }
      })();

      return () => {
        active = false;
      };
    }, [refreshSignerStatus])
  );

  const onConnectWallet = useCallback(async () => {
    if (isWalletConnecting) return;

    setIsWalletConnecting(true);
    try {
      await walletConnectEvmService.connect();
    } finally {
      refreshSignerStatus();
      setIsWalletConnecting(false);
    }
  }, [isWalletConnecting, refreshSignerStatus]);

  const onDisconnectWallet = useCallback(async () => {
    if (isWalletConnecting) return;

    setIsWalletConnecting(true);
    try {
      await walletConnectEvmService.disconnect();
    } finally {
      refreshSignerStatus();
      setIsWalletConnecting(false);
    }
  }, [isWalletConnecting, refreshSignerStatus]);

  const onRefresh = useCallback(async () => {
    if (!overview) return;

    setIsRefreshing(true);
    try {
      const recommendation = await evmVaultService.refreshRecommendation();
      setOverview((prev: EvmTrackOverview | null) => (prev ? { ...prev, recommendation } : prev));
    } finally {
      setIsRefreshing(false);
    }
  }, [overview]);

  const onSubmitDeposit = useCallback(async () => {
    if (isSubmittingTx) return;
    if (overview?.fraudAssessment.status === 'blocked') {
      Alert.alert(
        'Transaction Blocked',
        `Track 1 fraud gate is blocking writes (score ${overview.fraudAssessment.score}/100).`
      );
      return;
    }

    setIsSubmittingTx(true);
    try {
      const intent = await evmVaultService.buildDepositIntent(100);
      setLastIntent(intent);

      const execution = await evmVaultService.executeIntent(intent, state => {
        setLastExecution(state);
      });

      setLastExecution(execution);
    } finally {
      setIsSubmittingTx(false);
    }
  }, [isSubmittingTx, overview]);

  const onSubmitWithdraw = useCallback(async () => {
    if (isSubmittingTx) return;
    if (overview?.fraudAssessment.status === 'blocked') {
      Alert.alert(
        'Transaction Blocked',
        `Track 1 fraud gate is blocking writes (score ${overview.fraudAssessment.score}/100).`
      );
      return;
    }

    setIsSubmittingTx(true);
    try {
      const intent = await evmVaultService.buildWithdrawIntent(50);
      setLastIntent(intent);

      const execution = await evmVaultService.executeIntent(intent, state => {
        setLastExecution(state);
      });

      setLastExecution(execution);
    } finally {
      setIsSubmittingTx(false);
    }
  }, [isSubmittingTx, overview]);

  const onRunDemoScript = useCallback(async () => {
    if (isRunningDemoScript || isSubmittingTx) return;

    setIsRunningDemoScript(true);
    try {
      const result = await evmVaultService.runDemoScenario(state => {
        setLastExecution(state);
      });

      setDemoRunResult(result);
      if (result.lastIntent) {
        setLastIntent(result.lastIntent);
      }
      if (result.lastExecution) {
        setLastExecution(result.lastExecution);
      }

      if (result.success) {
        const refreshedOverview = await evmVaultService.getOverview();
        const proof: DemoProofSnapshot = {
          storedAtIso: new Date().toISOString(),
          demoRunResult: result,
          lastIntent: result.lastIntent,
          lastExecution: result.lastExecution,
          chain: refreshedOverview.chain,
          recommendation: refreshedOverview.recommendation,
        };

        await AsyncStorage.setItem(LAST_SUCCESSFUL_DEMO_KEY, JSON.stringify(proof));
        setLastSuccessfulDemoProof(proof);
      }

      await load();
    } finally {
      setIsRunningDemoScript(false);
    }
  }, [isRunningDemoScript, isSubmittingTx, load]);

  const onCopyDemoReport = useCallback(async () => {
    if (!overview) return;

    const report = evmVaultService.buildDemoReportText({
      overview,
      demoRunResult,
      lastIntent,
      lastExecution,
      walletConnected: Boolean(walletConnectStatus?.connected),
      walletAddress: walletConnectStatus?.address || null,
    });

    await Clipboard.setStringAsync(report);
    Alert.alert('Demo Report Copied', 'Report has been copied to your clipboard.');
  }, [overview, demoRunResult, lastIntent, lastExecution, walletConnectStatus]);

  const onSaveDemoReportJson = useCallback(async (): Promise<string | null> => {
    if (!overview) return null;

    if (!FileSystem.documentDirectory) {
      Alert.alert('Save Failed', 'Document directory is unavailable on this device.');
      return null;
    }

    const payload = evmVaultService.buildDemoReportPayload({
      overview,
      demoRunResult,
      lastIntent,
      lastExecution,
      walletConnected: Boolean(walletConnectStatus?.connected),
      walletAddress: walletConnectStatus?.address || null,
    });

    const fileName = `hb-demo-report-${Date.now()}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    setSavedReportUri(fileUri);

    Alert.alert('Demo Report Saved', `JSON file saved at:\n${fileUri}`);
    return fileUri;
  }, [overview, demoRunResult, lastIntent, lastExecution, walletConnectStatus]);

  const onShareDemoReport = useCallback(async () => {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Share Unavailable', 'Native sharing is not available on this platform.');
      return;
    }

    let fileUri = savedReportUri;
    if (!fileUri) {
      fileUri = await onSaveDemoReportJson();
    }

    if (!fileUri) {
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Share HB Vault Demo Report',
      UTI: 'public.json',
    });
  }, [savedReportUri, onSaveDemoReportJson]);

  const sortedPhases = useMemo(() => {
    if (!overview) return [];

    return [...overview.phases].sort((a, b) => a.id - b.id);
  }, [overview]);

  const demoReadiness = useMemo(() => {
    if (!overview) return null;

    return evmVaultService.getDemoReadiness({
      overview,
      walletConnected: Boolean(walletConnectStatus?.connected),
      demoRunResult,
      lastExecution,
    });
  }, [overview, walletConnectStatus, demoRunResult, lastExecution]);

  const fixFirstChecks = useMemo(() => {
    if (!demoReadiness) return [];

    return demoReadiness.checks
      .filter(check => !check.passed)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }, [demoReadiness]);

  const readinessVerdictColor = useMemo(() => {
    if (!demoReadiness) return Colors.primary;

    if (demoReadiness.verdict === 'ready') return '#41d18a';
    if (demoReadiness.verdict === 'almost-ready') return '#f2c46d';
    return '#ff8787';
  }, [demoReadiness]);

  const fraudStatusColor = useMemo(() => {
    if (!overview) return Colors.primary;
    if (overview.fraudAssessment.status === 'clear') return '#41d18a';
    if (overview.fraudAssessment.status === 'monitor') return '#f2c46d';
    return '#ff8787';
  }, [overview]);

  const showAdvancedSections = !isPresenterMode;

  const onRunAutoFix = useCallback(async () => {
    if (isAutoFixing || !demoReadiness) return;

    const failedChecks = demoReadiness.checks
      .filter(check => !check.passed)
      .sort((a, b) => b.weight - a.weight);

    if (failedChecks.length === 0) {
      setAutoFixLogs(['No failed checks. Demo setup is already healthy.']);
      return;
    }

    setIsAutoFixing(true);
    setAutoFixLogs([`Starting auto fix for ${failedChecks.length} failed checks...`]);

    const appendLog = (line: string): void => {
      setAutoFixLogs(prev => [...prev, line]);
    };

    try {
      for (const check of failedChecks) {
        try {
          if (check.label === 'Wallet connected') {
            appendLog('Attempting wallet connection...');
            await onConnectWallet();
            appendLog('Wallet connection attempt completed.');
            continue;
          }

          if (check.label === 'Live chain data') {
            appendLog('Refreshing chain overview...');
            await load();
            appendLog('Chain refresh completed.');
            continue;
          }

          if (
            check.label === 'AI recommendation available' ||
            check.label === 'Attestation verified'
          ) {
            appendLog('Refreshing AI recommendation and attestation check...');
            await onRefresh();
            await load();
            appendLog('AI refresh completed.');
            continue;
          }

          if (check.label === 'Transaction flow executed') {
            appendLog('Running fallback demo deposit transaction...');
            await onSubmitDeposit();
            appendLog('Transaction attempt completed.');
            continue;
          }

          if (check.label === 'Demo script success') {
            appendLog('Running demo script...');
            await onRunDemoScript();
            appendLog('Demo script run completed.');
            continue;
          }

          if (check.label === 'Track 1 fraud gate clear') {
            appendLog('Refreshing fraud assessment from latest chain/AI state...');
            await load();
            appendLog('Fraud assessment refresh completed.');
            continue;
          }

          appendLog(`No auto-fix action mapped for: ${check.label}`);
        } catch (error) {
          appendLog(
            `Action failed for ${check.label}: ${error instanceof Error ? error.message : 'unknown error'}`
          );
        }
      }

      appendLog('Auto fix sequence complete. Re-evaluate readiness score.');
    } finally {
      setIsAutoFixing(false);
      await load();
    }
  }, [
    isAutoFixing,
    demoReadiness,
    onConnectWallet,
    load,
    onRefresh,
    onSubmitDeposit,
    onRunDemoScript,
  ]);

  const onClearDemoProof = useCallback(async () => {
    await AsyncStorage.removeItem(LAST_SUCCESSFUL_DEMO_KEY);
    setLastSuccessfulDemoProof(null);
    Alert.alert('Demo Proof Cleared', 'Stored successful demo proof has been removed.');
  }, []);

  if (isLoading || !overview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
          <ThemedText style={styles.loadingText}>Loading EVM Vault...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBackground,
              borderColor: borderPrimary,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <ThemedText style={[styles.heroBadge, { color: buttonPrimary }]}>HB Vault</ThemedText>
            <ThemedText style={[styles.heroBadgeMuted, { color: textSecondary }]}>Track 1</ThemedText>
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            EVM Vault Control Center
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}> 
            Run demo flows, review policy checks, and manage live vault operations in one place.
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: cardBackground,
              borderColor: borderPrimary,
            },
          ]}
        >
          <ThemedText type="defaultSemiBold">Demo Control Center</ThemedText>
          <ThemedText style={styles.muted}>
            Presenter Mode: {isPresenterMode ? 'Enabled' : 'Disabled'}
          </ThemedText>
          <View style={styles.controlGrid}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: buttonPrimary },
                (isRunningDemoScript || isSubmittingTx) && styles.disabledButton,
              ]}
              onPress={onRunDemoScript}
              disabled={isRunningDemoScript || isSubmittingTx}
            >
              <ThemedText style={styles.actionButtonText}>Run Script</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: buttonPrimary }, isAutoFixing && styles.disabledButton]}
              onPress={onRunAutoFix}
              disabled={isAutoFixing}
            >
              <ThemedText style={styles.actionButtonText}>Auto Fix</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: buttonPrimary }]}
              onPress={onCopyDemoReport}
            >
              <ThemedText style={styles.actionButtonText}>Copy</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: buttonPrimary }]}
              onPress={onSaveDemoReportJson}
            >
              <ThemedText style={styles.actionButtonText}>Save JSON</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: buttonPrimary }]}
              onPress={onShareDemoReport}
            >
              <ThemedText style={styles.actionButtonText}>Share</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: buttonPrimary },
                !lastSuccessfulDemoProof && styles.disabledButton,
              ]}
              onPress={onClearDemoProof}
              disabled={!lastSuccessfulDemoProof}
            >
              <ThemedText style={styles.actionButtonText}>Clear Proof</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: buttonPrimary }]}
              onPress={() => setIsPresenterMode(prev => !prev)}
            >
              <ThemedText style={styles.actionButtonText}>
                {isPresenterMode ? 'Show Full UI' : 'Presenter Mode'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
          <ThemedText type="defaultSemiBold">Track 1 Fraud Detection</ThemedText>
          <ThemedText style={[styles.readinessVerdict, { color: fraudStatusColor }]}>
            Status: {overview.fraudAssessment.status.toUpperCase()} (
            {overview.fraudAssessment.score}/100)
          </ThemedText>
          <ThemedText>{overview.fraudAssessment.recommendedAction}</ThemedText>
          <ThemedText style={styles.muted}>
            Last Check: {new Date(overview.fraudAssessment.checkedAtIso).toLocaleString()}
          </ThemedText>
          {overview.fraudAssessment.signals.map(signal => (
            <View key={signal.id} style={styles.txStatusBox}>
              <ThemedText>
                [{signal.status === 'flagged' ? 'FLAG' : 'PASS'}] {signal.label}
              </ThemedText>
              <ThemedText style={styles.muted}>
                Severity: {signal.severity.toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.muted}>{signal.detail}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Chain Connectivity (Phase 2)</ThemedText>
            <ThemedText>Network: {overview.chain.name}</ThemedText>
            <ThemedText>Source: {overview.chain.source}</ThemedText>
            <ThemedText>Connected: {overview.chain.connected ? 'Yes' : 'No'}</ThemedText>
            <ThemedText>
              Chain ID: {overview.chain.chainId !== null ? overview.chain.chainId : 'Unavailable'}
            </ThemedText>
            <ThemedText>
              Latest Block:{' '}
              {overview.chain.latestBlock !== null
                ? overview.chain.latestBlock.toLocaleString()
                : 'Unavailable'}
            </ThemedText>
            <ThemedText style={styles.muted}>RPC: {overview.chain.rpcUrl}</ThemedText>
            <ThemedText style={styles.muted}>
              Synced: {new Date(overview.chain.lastSyncIso).toLocaleString()}
            </ThemedText>
          </ThemedView>
        ) : null}

        {signerSetup && showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Signer Setup (Phase 3)</ThemedText>
            <ThemedText>
              WalletConnect Project ID:{' '}
              {signerSetup.walletConnectProjectIdConfigured ? 'Configured' : 'Missing'}
            </ThemedText>
            <ThemedText style={styles.muted}>
              ID: {signerSetup.walletConnectProjectIdPreview}
            </ThemedText>
            <ThemedText>
              External Signer Registered: {signerSetup.externalSignerRegistered ? 'Yes' : 'No'}
            </ThemedText>
            <ThemedText>
              Unlocked RPC Fallback:{' '}
              {signerSetup.unlockedRpcFallbackEnabled ? 'Enabled' : 'Disabled'}
            </ThemedText>
            <ThemedText>
              From Address Set: {signerSetup.fromAddressConfigured ? 'Yes' : 'No'}
            </ThemedText>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, isWalletConnecting && styles.disabledButton]}
                onPress={onConnectWallet}
                disabled={isWalletConnecting}
              >
                <ThemedText style={styles.actionButtonText}>Connect WalletConnect</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, isWalletConnecting && styles.disabledButton]}
                onPress={onDisconnectWallet}
                disabled={isWalletConnecting}
              >
                <ThemedText style={styles.actionButtonText}>Disconnect Wallet</ThemedText>
              </TouchableOpacity>
            </View>

            {walletConnectStatus ? (
              <View style={styles.txStatusBox}>
                <ThemedText>
                  WC Initialized: {walletConnectStatus.initialized ? 'Yes' : 'No'}
                </ThemedText>
                <ThemedText>
                  WC Connected: {walletConnectStatus.connected ? 'Yes' : 'No'}
                </ThemedText>
                <ThemedText>
                  Wallet Address:{' '}
                  {walletConnectStatus.address
                    ? `${walletConnectStatus.address.slice(0, 8)}...${walletConnectStatus.address.slice(-4)}`
                    : 'Unavailable'}
                </ThemedText>
                <ThemedText>
                  Wallet Chain ID:{' '}
                  {walletConnectStatus.chainId !== null
                    ? walletConnectStatus.chainId
                    : 'Unavailable'}
                </ThemedText>
                {walletConnectStatus.pendingUri ? (
                  <ThemedText style={styles.muted}>
                    Pending Pair URI: {walletConnectStatus.pendingUri.slice(0, 40)}...
                  </ThemedText>
                ) : null}
                {walletConnectStatus.lastError ? (
                  <ThemedText style={styles.errorText}>{walletConnectStatus.lastError}</ThemedText>
                ) : null}
              </View>
            ) : null}
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Vault Snapshot</ThemedText>
            <ThemedText>TVL: ${overview.snapshot.tvlUsd.toLocaleString()}</ThemedText>
            <ThemedText>APY: {overview.snapshot.apyPercent}%</ThemedText>
            <ThemedText>
              User Deposit: ${overview.snapshot.userDepositUsd.toLocaleString()}
            </ThemedText>
            <ThemedText>Risk Score: {overview.snapshot.riskScore}/100</ThemedText>
            <ThemedText>Confidence: {(overview.snapshot.confidence * 100).toFixed(0)}%</ThemedText>
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Policy Guardrails</ThemedText>
            <ThemedText>
              Max Allocation/Strategy: {overview.policy.maxAllocationPerStrategy}%
            </ThemedText>
            <ThemedText>Rebalance Cooldown: {overview.policy.rebalanceCooldownHours}h</ThemedText>
            <ThemedText>
              Emergency Pause: {overview.policy.emergencyPauseEnabled ? 'Enabled' : 'Disabled'}
            </ThemedText>
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Phase 5 Policy Alerts</ThemedText>
            {overview.alerts.length === 0 ? (
              <ThemedText style={styles.muted}>No active alerts.</ThemedText>
            ) : (
              overview.alerts.map(alert => (
                <View key={alert.id} style={styles.txStatusBox}>
                  <ThemedText>
                    [{alert.severity.toUpperCase()}] {alert.title}
                  </ThemedText>
                  <ThemedText>{alert.detail}</ThemedText>
                  <ThemedText style={styles.muted}>
                    {new Date(alert.createdAtIso).toLocaleString()}
                  </ThemedText>
                </View>
              ))
            )}
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Phase 5 Rebalance Metrics</ThemedText>
            {overview.rebalanceMetrics.map(metric => (
              <View key={metric.id} style={styles.txStatusBox}>
                <ThemedText>{metric.label}</ThemedText>
                <ThemedText style={styles.muted}>
                  Before: risk {metric.before.riskScore}/100, APY {metric.before.apyPercent}%,
                  stable {metric.before.stableExposurePercent}%
                </ThemedText>
                <ThemedText style={styles.muted}>
                  After: risk {metric.after.riskScore}/100, APY {metric.after.apyPercent}%, stable{' '}
                  {metric.after.stableExposurePercent}%
                </ThemedText>
                <ThemedText>
                  Estimated Net Delta: ${metric.estimatedNetDeltaUsd.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.muted}>
                  Snapshot: {new Date(metric.createdAtIso).toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Phase 5 Demo Script</ThemedText>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isRunningDemoScript || isSubmittingTx) && styles.disabledButton,
              ]}
              onPress={onRunDemoScript}
              disabled={isRunningDemoScript || isSubmittingTx}
            >
              <ThemedText style={styles.actionButtonText}>Run Demo Script</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onCopyDemoReport}>
              <ThemedText style={styles.actionButtonText}>Copy Demo Report</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onSaveDemoReportJson}>
              <ThemedText style={styles.actionButtonText}>Save Demo Report JSON</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onShareDemoReport}>
              <ThemedText style={styles.actionButtonText}>Share Demo Report</ThemedText>
            </TouchableOpacity>

            {savedReportUri ? (
              <ThemedText style={styles.muted}>Saved Report: {savedReportUri}</ThemedText>
            ) : null}

            {isRunningDemoScript ? (
              <View style={styles.txPendingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Running scripted demo flow...</ThemedText>
              </View>
            ) : null}

            {demoRunResult ? (
              <View style={styles.txStatusBox}>
                <ThemedText>Result: {demoRunResult.success ? 'Success' : 'Failed'}</ThemedText>
                <ThemedText style={styles.muted}>
                  Started: {new Date(demoRunResult.startedAtIso).toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.muted}>
                  Finished: {new Date(demoRunResult.finishedAtIso).toLocaleString()}
                </ThemedText>
                {demoRunResult.steps.map(step => (
                  <ThemedText key={step.id} style={styles.muted}>
                    [{step.status.toUpperCase()}] {step.label}: {step.detail}
                  </ThemedText>
                ))}
              </View>
            ) : null}
          </ThemedView>
        ) : null}

        {demoReadiness ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Demo Readiness Score</ThemedText>
            <ThemedText>
              Score: {demoReadiness.score}/100 ({demoReadiness.verdict})
            </ThemedText>
            <ThemedText style={[styles.readinessVerdict, { color: readinessVerdictColor }]}>
              Verdict: {demoReadiness.verdict.toUpperCase()}
            </ThemedText>
            <TouchableOpacity
              style={[styles.actionButton, isAutoFixing && styles.disabledButton]}
              onPress={onRunAutoFix}
              disabled={isAutoFixing}
            >
              <ThemedText style={styles.actionButtonText}>Run Auto Fix Hints</ThemedText>
            </TouchableOpacity>
            {isAutoFixing ? (
              <View style={styles.txPendingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Running auto-fix actions...</ThemedText>
              </View>
            ) : null}
            {fixFirstChecks.length > 0 ? (
              <View style={styles.txStatusBox}>
                <ThemedText type="defaultSemiBold">Fix First</ThemedText>
                {fixFirstChecks.map(check => (
                  <ThemedText key={check.label} style={styles.muted}>
                    {check.label} ({check.weight}%): {check.detail}
                  </ThemedText>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.muted}>No blockers detected.</ThemedText>
            )}
            {autoFixLogs.length > 0 ? (
              <View style={styles.txStatusBox}>
                <ThemedText type="defaultSemiBold">Auto Fix Log</ThemedText>
                {autoFixLogs.map((line, idx) => (
                  <ThemedText key={`${line}-${idx}`} style={styles.muted}>
                    {line}
                  </ThemedText>
                ))}
              </View>
            ) : null}
            {demoReadiness.checks.map(check => (
              <ThemedText key={check.label} style={styles.muted}>
                [{check.passed ? 'PASS' : 'FAIL'}] {check.label} ({check.weight}%): {check.detail}
              </ThemedText>
            ))}
          </ThemedView>
        ) : null}

        {lastSuccessfulDemoProof ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Last Successful Demo Proof</ThemedText>
            <ThemedText style={styles.muted}>
              Stored: {new Date(lastSuccessfulDemoProof.storedAtIso).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.muted}>
              Demo Finished:{' '}
              {new Date(lastSuccessfulDemoProof.demoRunResult.finishedAtIso).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.muted}>
              Chain: {lastSuccessfulDemoProof.chain.name} ({lastSuccessfulDemoProof.chain.source})
            </ThemedText>
            <ThemedText style={styles.muted}>
              Recommendation: {lastSuccessfulDemoProof.recommendation.source} / attestation{' '}
              {lastSuccessfulDemoProof.recommendation.attestation.status}
            </ThemedText>
            <ThemedText style={styles.muted}>
              Last Tx: {lastSuccessfulDemoProof.lastExecution?.status || 'n/a'}
            </ThemedText>
            <TouchableOpacity style={styles.actionButton} onPress={onClearDemoProof}>
              <ThemedText style={styles.actionButtonText}>Clear Proof</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Phase 3 Transaction Flow</ThemedText>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, isSubmittingTx && styles.disabledButton]}
                onPress={onSubmitDeposit}
                disabled={isSubmittingTx}
              >
                <ThemedText style={styles.actionButtonText}>Submit Deposit ($100)</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, isSubmittingTx && styles.disabledButton]}
                onPress={onSubmitWithdraw}
                disabled={isSubmittingTx}
              >
                <ThemedText style={styles.actionButtonText}>Submit Withdraw ($50)</ThemedText>
              </TouchableOpacity>
            </View>

            {isSubmittingTx ? (
              <View style={styles.txPendingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Submitting transaction...</ThemedText>
              </View>
            ) : null}

            {lastIntent ? (
              <ThemedText style={styles.muted}>
                Last Intent: {lastIntent.type} ${lastIntent.amountUsd} ({lastIntent.mode})
              </ThemedText>
            ) : null}

            {lastExecution ? (
              <View style={styles.txStatusBox}>
                <ThemedText>Status: {lastExecution.status}</ThemedText>
                <ThemedText>Mode: {lastExecution.mode}</ThemedText>
                {lastExecution.txHash ? (
                  <ThemedText style={styles.muted}>
                    Tx: {lastExecution.txHash.slice(0, 18)}...
                  </ThemedText>
                ) : null}
                {lastExecution.explorerUrl ? (
                  <ThemedText style={styles.muted}>
                    Explorer: {lastExecution.explorerUrl}
                  </ThemedText>
                ) : null}
                {lastExecution.error ? (
                  <ThemedText style={styles.errorText}>{lastExecution.error}</ThemedText>
                ) : null}
                <ThemedText style={styles.muted}>
                  Updated: {new Date(lastExecution.updatedAtIso).toLocaleString()}
                </ThemedText>
              </View>
            ) : null}
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <View style={styles.rowBetween}>
              <ThemedText type="defaultSemiBold">AI Recommendation</ThemedText>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={Colors.almostWhite} />
                ) : (
                  <RefreshCw size={14} color={Colors.almostWhite} />
                )}
                <ThemedText style={styles.refreshText}>Refresh</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText>{overview.recommendation.rationale}</ThemedText>
            <ThemedText style={styles.muted}>ID: {overview.recommendation.id}</ThemedText>
            <ThemedText style={styles.muted}>Source: {overview.recommendation.source}</ThemedText>
            <ThemedText style={styles.muted}>
              Hash: {overview.recommendation.hash.slice(0, 18)}...
            </ThemedText>
            <ThemedText style={styles.muted}>
              Attestation: {overview.recommendation.attestation.status}
            </ThemedText>
            {overview.recommendation.attestation.registryAddress ? (
              <ThemedText style={styles.muted}>
                Registry: {overview.recommendation.attestation.registryAddress}
              </ThemedText>
            ) : null}
            {overview.recommendation.attestation.error ? (
              <ThemedText style={styles.errorText}>
                {overview.recommendation.attestation.error}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.muted}>
              Updated: {new Date(overview.recommendation.createdAtIso).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.muted}>
              Checked:{' '}
              {new Date(overview.recommendation.attestation.lastCheckedIso).toLocaleString()}
            </ThemedText>
          </ThemedView>
        ) : null}

        {showAdvancedSections ? (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: borderPrimary }]}> 
            <ThemedText type="defaultSemiBold">Implementation Phases</ThemedText>
            {sortedPhases.map((phase: EvmTrackOverview['phases'][number]) => (
              <View key={phase.id} style={styles.phaseRow}>
                <ThemedText>
                  {phase.id}. {phase.title}
                </ThemedText>
                <ThemedText style={styles.phaseStatus}>{phase.status}</ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  heroBadge: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroBadgeMuted: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  heroTitle: {
    textAlign: 'left',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  phaseStatus: {
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  muted: {
    opacity: 0.82,
    fontSize: 12,
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshText: {
    color: Colors.almostWhite,
    fontSize: 12,
  },
  actionRow: {
    gap: 10,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.almostWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 102,
  },
  disabledButton: {
    opacity: 0.65,
  },
  txPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txStatusBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 10,
    gap: 4,
  },
  errorText: {
    color: '#ff8787',
    fontSize: 12,
  },
  loadingText: {
    opacity: 0.85,
  },
  readinessVerdict: {
    fontSize: 12,
    fontWeight: '700',
  },
});
