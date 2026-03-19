import type { EvmTxExecution, EvmTxIntent } from '@/models/EvmVault';

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

type TxReceipt = {
  status?: string;
};

type EvmTxRequest = {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: string;
  chainId: string;
};

export type ExternalRawSigner = (tx: EvmTxRequest) => Promise<string>;

export type EvmSignerSetupStatus = {
  walletConnectProjectIdConfigured: boolean;
  walletConnectProjectIdPreview: string;
  externalSignerRegistered: boolean;
  unlockedRpcFallbackEnabled: boolean;
  fromAddressConfigured: boolean;
};

const POLL_INTERVAL_MS = 4_000;
const POLL_TIMEOUT_MS = 60_000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class EvmSignerService {
  private static externalRawSigner: ExternalRawSigner | null = null;

  private readonly rpcUrl = env.EXPO_PUBLIC_EVM_RPC_URL || 'https://rpc.polkadot.io';

  private readonly fromAddress = env.EXPO_PUBLIC_EVM_FROM_ADDRESS || '';

  private readonly gasLimitHex = env.EXPO_PUBLIC_EVM_GAS_LIMIT || '0x493e0';

  private readonly txExplorerBaseUrl = env.EXPO_PUBLIC_EVM_EXPLORER_TX_BASE_URL || '';

  private readonly allowUnlockedRpcSendTx =
    env.EXPO_PUBLIC_EVM_ALLOW_RPC_SEND_TRANSACTION === 'true';

  private readonly walletConnectProjectId = env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

  static registerExternalRawSigner(signer: ExternalRawSigner): void {
    EvmSignerService.externalRawSigner = signer;
  }

  static clearExternalRawSigner(): void {
    EvmSignerService.externalRawSigner = null;
  }

  getSetupStatus(): EvmSignerSetupStatus {
    const hasProjectId = this.walletConnectProjectId.trim().length > 0;
    const preview = hasProjectId
      ? `${this.walletConnectProjectId.slice(0, 6)}...${this.walletConnectProjectId.slice(-4)}`
      : 'not-set';

    return {
      walletConnectProjectIdConfigured: hasProjectId,
      walletConnectProjectIdPreview: preview,
      externalSignerRegistered: EvmSignerService.externalRawSigner !== null,
      unlockedRpcFallbackEnabled: this.allowUnlockedRpcSendTx,
      fromAddressConfigured: EvmSignerService.isAddress(this.fromAddress),
    };
  }

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

  private static isAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  private static numberToHex(value: number): string {
    return `0x${value.toString(16)}`;
  }

  private async buildTxRequest(intent: EvmTxIntent): Promise<EvmTxRequest> {
    if (!EvmSignerService.isAddress(this.fromAddress)) {
      throw new Error('Missing sender address. Set EXPO_PUBLIC_EVM_FROM_ADDRESS.');
    }

    const [nonceHex, gasPriceHex, chainIdHex] = await Promise.all([
      this.rpc<string>('eth_getTransactionCount', [this.fromAddress, 'pending']),
      this.rpc<string>('eth_gasPrice'),
      Promise.resolve(
        intent.chainId !== null
          ? EvmSignerService.numberToHex(intent.chainId)
          : this.rpc<string>('eth_chainId')
      ),
    ]);

    return {
      from: this.fromAddress,
      to: intent.to,
      data: intent.data,
      value: intent.value,
      gas: this.gasLimitHex,
      gasPrice: gasPriceHex,
      nonce: nonceHex,
      chainId: chainIdHex,
    };
  }

  private getExplorerUrl(txHash: string): string | null {
    if (!this.txExplorerBaseUrl) {
      return null;
    }

    return `${this.txExplorerBaseUrl}${txHash}`;
  }

  private executionFrom(
    status: EvmTxExecution['status'],
    mode: EvmTxExecution['mode'],
    txHash: string | null,
    error: string | null
  ): EvmTxExecution {
    return {
      status,
      mode,
      txHash,
      explorerUrl: txHash ? this.getExplorerUrl(txHash) : null,
      error,
      updatedAtIso: new Date().toISOString(),
    };
  }

  private async waitForReceipt(
    txHash: string,
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmTxExecution> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      const receipt = await this.rpc<TxReceipt | null>('eth_getTransactionReceipt', [txHash]);

      if (!receipt) {
        onProgress?.(this.executionFrom('pending', 'rpc', txHash, null));
        await delay(POLL_INTERVAL_MS);
        continue;
      }

      const normalizedStatus = (receipt.status || '').toLowerCase();
      if (normalizedStatus === '0x1') {
        return this.executionFrom('confirmed', 'rpc', txHash, null);
      }

      return this.executionFrom('failed', 'rpc', txHash, 'Transaction reverted onchain.');
    }

    return this.executionFrom(
      'pending',
      'rpc',
      txHash,
      'Timed out waiting for receipt confirmation.'
    );
  }

  async executeIntent(
    intent: EvmTxIntent,
    onProgress?: (state: EvmTxExecution) => void
  ): Promise<EvmTxExecution> {
    if (intent.mode === 'mock' || !EvmSignerService.isAddress(this.fromAddress)) {
      const mockHash = `0xmock${Date.now().toString(16).padStart(60, '0')}`;
      const mockExecution = this.executionFrom('confirmed', 'mock', mockHash, null);
      onProgress?.(mockExecution);
      return mockExecution;
    }

    onProgress?.(this.executionFrom('submitting', 'rpc', null, null));

    try {
      const txRequest = await this.buildTxRequest(intent);

      let txHash: string;
      if (EvmSignerService.externalRawSigner) {
        const signedRawTx = await EvmSignerService.externalRawSigner(txRequest);
        txHash = await this.rpc<string>('eth_sendRawTransaction', [signedRawTx]);
      } else if (this.allowUnlockedRpcSendTx) {
        txHash = await this.rpc<string>('eth_sendTransaction', [txRequest]);
      } else {
        const setup = this.getSetupStatus();
        const wcHint = setup.walletConnectProjectIdConfigured
          ? 'WalletConnect project ID detected; next step is registering an external raw signer bridge.'
          : 'Set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID and register an external raw signer bridge.';
        throw new Error(
          `No external signer configured. ${wcHint} You can also set EXPO_PUBLIC_EVM_ALLOW_RPC_SEND_TRANSACTION=true for dev-only fallback.`
        );
      }

      onProgress?.(this.executionFrom('pending', 'rpc', txHash, null));

      return await this.waitForReceipt(txHash, onProgress);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown transaction error.';
      const failed = this.executionFrom('failed', 'rpc', null, message);
      onProgress?.(failed);
      return failed;
    }
  }
}

export default new EvmSignerService();
