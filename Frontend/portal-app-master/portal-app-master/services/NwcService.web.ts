import {
  WALLET_CONNECTION_STATUS,
  type Wallet,
  type WalletConnectionStatus,
} from '@/models/WalletType';
import type { WalletInfo } from '@/utils/types';

const WEB_UNSUPPORTED_ERROR =
  'NwcService is not supported on web. Use an Android/iOS development build.';

export class NwcService implements Wallet {
  private onStatusChange: ((status: WalletConnectionStatus) => void) | null = null;

  static async create(
    _walletUrl: string,
    onStatusChange?: (status: WalletConnectionStatus) => void
  ): Promise<NwcService> {
    if (onStatusChange) {
      onStatusChange(WALLET_CONNECTION_STATUS.NOT_CONFIGURED);
    }
    const instance = new NwcService();
    instance.onStatusChange = onStatusChange || null;
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  async getWalletInfo(): Promise<WalletInfo> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  async sendPayment(_paymentRequest: string, _amountSats: bigint): Promise<string> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  async receivePayment(_amountSats: bigint, _description?: string): Promise<string> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  async prepareSendPayment(_paymentRequest: string, _amountSats: bigint): Promise<string> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  async lookupInvoice(_paymentRequest: string): Promise<unknown> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }
}