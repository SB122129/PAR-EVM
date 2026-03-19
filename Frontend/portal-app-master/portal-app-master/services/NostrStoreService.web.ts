const WEB_MINTS_KEY = 'portal_web_mints';

export default class NostrStoreService {
  private constructor() {}

  static async create(_keypair: unknown, _relays: string[]): Promise<NostrStoreService> {
    return new NostrStoreService();
  }

  async storeMints(mints: string[]): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(WEB_MINTS_KEY, JSON.stringify(mints));
  }

  async readMints(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(WEB_MINTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
}