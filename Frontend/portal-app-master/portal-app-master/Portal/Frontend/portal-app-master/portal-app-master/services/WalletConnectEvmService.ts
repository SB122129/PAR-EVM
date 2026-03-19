import EthereumProvider from '@walletconnect/ethereum-provider';
import { EvmSignerService, type ExternalRawSigner } from '@/services/EvmSignerService';

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || {};

type WalletConnectProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

export type WalletConnectEvmStatus = {
  projectIdConfigured: boolean;
  initialized: boolean;
  connected: boolean;
  address: string | null;
  chainId: number | null;
  pendingUri: string | null;
  lastError: string | null;
};

function parseChainId(chainIdHex: string): number | null {
  try {
    return Number.parseInt(chainIdHex.replace(/^0x/, ''), 16);
  } catch {
    return null;
  }
}

export class WalletConnectEvmService {
  private provider: WalletConnectProvider | null = null;

  private pendingUri: string | null = null;

  private connectedAddress: string | null = null;

  private connectedChainId: number | null = null;

  private lastError: string | null = null;

  private readonly projectId = env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

  private readonly defaultChainId = Number.parseInt(env.EXPO_PUBLIC_EVM_CHAIN_ID || '1', 10);

  private readonly appName = env.EXPO_PUBLIC_APP_NAME || 'Portal App';

  private readonly appDescription =
    env.EXPO_PUBLIC_APP_DESCRIPTION || 'Portal mobile app wallet connection';

  private readonly appUrl = env.EXPO_PUBLIC_APP_URL || 'https://getportal.cc';

  private readonly appIcon =
    env.EXPO_PUBLIC_APP_ICON_URL ||
    'https://raw.githubusercontent.com/walletconnect/walletconnect-assets/master/Icon/Gradient/Icon.png';

  private externalSigner: ExternalRawSigner = async tx => {
    const provider = this.provider;
    if (!provider) {
      throw new Error('WalletConnect provider is not initialized.');
    }

    const result = await provider.request({
      method: 'eth_signTransaction',
      params: [tx],
    });

    if (typeof result !== 'string') {
      throw new Error('Wallet did not return signed raw transaction.');
    }

    return result;
  };

  private clearConnectionState(): void {
    this.connectedAddress = null;
    this.connectedChainId = null;
    this.pendingUri = null;
  }

  private bindProviderEvents(provider: WalletConnectProvider): void {
    provider.on('display_uri', (uri: string) => {
      this.pendingUri = uri;
      this.lastError = null;
    });

    provider.on('disconnect', () => {
      this.clearConnectionState();
      EvmSignerService.clearExternalRawSigner();
    });

    provider.on('session_delete', () => {
      this.clearConnectionState();
      EvmSignerService.clearExternalRawSigner();
    });

    provider.on('accountsChanged', (accounts: string[]) => {
      this.connectedAddress = accounts[0] || null;
    });

    provider.on('chainChanged', (chainIdHex: string) => {
      this.connectedChainId = parseChainId(chainIdHex);
    });
  }

  async initialize(): Promise<void> {
    if (this.provider) {
      return;
    }

    if (!this.projectId.trim()) {
      throw new Error('WalletConnect project ID missing. Set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID.');
    }

    const chainId = Number.isFinite(this.defaultChainId) ? this.defaultChainId : 1;

    this.provider = await EthereumProvider.init({
      projectId: this.projectId,
      chains: [chainId],
      methods: [
        'eth_chainId',
        'eth_accounts',
        'eth_signTransaction',
        'eth_sendTransaction',
        'personal_sign',
      ],
      events: ['chainChanged', 'accountsChanged'],
      // React Native flow uses emitted pairing URI instead of web QR modal.
      showQrModal: false,
      metadata: {
        name: this.appName,
        description: this.appDescription,
        url: this.appUrl,
        icons: [this.appIcon],
      },
    });

    this.bindProviderEvents(this.provider);
  }

  async connect(): Promise<void> {
    try {
      this.lastError = null;
      await this.initialize();

      if (!this.provider) {
        throw new Error('WalletConnect provider failed to initialize.');
      }

      await this.provider.connect();

      const [accounts, chainIdHex] = await Promise.all([
        this.provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
        this.provider.request({ method: 'eth_chainId' }) as Promise<string>,
      ]);

      this.connectedAddress = accounts[0] || null;
      this.connectedChainId = parseChainId(chainIdHex);
      this.pendingUri = null;

      if (!this.connectedAddress) {
        throw new Error('Wallet connected but no account was returned.');
      }

      EvmSignerService.registerExternalRawSigner(this.externalSigner);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'WalletConnect connection failed.';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.provider) {
      EvmSignerService.clearExternalRawSigner();
      this.clearConnectionState();
      return;
    }

    try {
      await this.provider.disconnect();
    } finally {
      EvmSignerService.clearExternalRawSigner();
      this.clearConnectionState();
    }
  }

  getStatus(): WalletConnectEvmStatus {
    return {
      projectIdConfigured: this.projectId.trim().length > 0,
      initialized: this.provider !== null,
      connected: this.connectedAddress !== null,
      address: this.connectedAddress,
      chainId: this.connectedChainId,
      pendingUri: this.pendingUri,
      lastError: this.lastError,
    };
  }
}

export default new WalletConnectEvmService();
