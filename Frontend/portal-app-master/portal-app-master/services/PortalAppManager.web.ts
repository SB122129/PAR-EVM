import type {
  KeypairInterface,
  PortalAppInterface,
  RelayStatusListener,
} from '@/utils/mockNative';

const WEB_UNSUPPORTED_ERROR =
  'PortalAppManager is not supported on web. Use an Android/iOS development build.';

export class PortalAppManager {
  private constructor() {}

  static async getInstance(
    _keypair: KeypairInterface,
    _relays: string[],
    _relayStatusCallback: RelayStatusListener
  ): Promise<PortalAppInterface> {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  static tryGetInstance(): PortalAppInterface {
    throw new Error(WEB_UNSUPPORTED_ERROR);
  }

  static clearInstance() {
    // No-op on web.
  }
}