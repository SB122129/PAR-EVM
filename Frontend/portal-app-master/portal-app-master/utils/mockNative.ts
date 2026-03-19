/**
 * Mock implementations for native modules that cause crashes
 * This file provides fake implementations for demo stability
 */

// ============================================================================
// MOCK FOR portal-app-lib
// ============================================================================

export interface KeypairInterface {
  publicKey(): { toString(): string };
  nsec(): string;
  issueJwt(targetKey: string, expiresInHours: bigint): string;
}

// Interface for relay status listener object
export interface RelayStatusListener {
  onRelayStatusChange(relay_url: string, status: number): Promise<void>;
}

export interface PortalAppInterface {
  // Mock methods
  getInfo(): Promise<{ balanceSats: bigint; alias?: string }>;
  listen(params: { signal: AbortSignal }): void;
  reconnectRelay(url: string): Promise<void>;
  sendKeyHandshake(url: KeyHandshakeUrl): Promise<void>;
  setProfile(profile: Profile): Promise<void>;
  registerNip05(nip05: string): Promise<void>;
  registerImg(imageBase64: string): Promise<void>;
  closeRecurringPayment(pubkey: string, subscriptionId: string): Promise<void>;
  fetchProfile(publicKey: string): Promise<{
    nip05?: string;
    name?: string;
    displayName?: string;
    picture?: string;
  }>;
  addRelay(url: string): Promise<void>;
  connectionStatus(): Promise<{ url: string; status: number }[]>;
  // Methods for listeners
  nextCashuDirect(): Promise<unknown>;
  nextCashuRequest(): Promise<unknown>;
  nextAuthChallenge(): Promise<unknown>;
  nextPaymentRequest(): Promise<{
    tags: IncomingPaymentRequest_Tags;
    singlePaymentRequest: SinglePaymentRequest;
  }>;
  nextClosedRecurringPayment(): Promise<{
    tags: IncomingPaymentRequest_Tags;
    recurringPaymentRequest: RecurringPaymentRequest;
  }>;
  nextNip46Request(): Promise<{
    request: NostrConnectRequest;
  }>;
}

export interface Profile {
  name?: string;
  displayName?: string;
  image?: string;
  nip05?: string;
}

export interface KeyHandshakeUrl {
  url: string;
  relays: string[];
}

// Mock Nsec class
export class Nsec {
  private nsecStr: string;

  constructor(nsec: string) {
    this.nsecStr = nsec;
  }

  getKeypair(): KeypairInterface {
    return {
      publicKey: () => ({
        toString: () => 'demo_public_key_' + Math.random().toString(36).slice(2, 10),
      }),
      nsec: () => this.nsecStr,
      issueJwt: (_targetKey: string, _expiresInHours: bigint) => 'demo_jwt_token_' + Date.now(),
    };
  }

  deriveCashu(): ArrayBuffer {
    // Return a fake 32-byte seed
    return new Uint8Array(32).buffer;
  }
}

// Mock Mnemonic class
export class Mnemonic {
  private mnemonicStr: string;

  constructor(mnemonic: string) {
    this.mnemonicStr = mnemonic;
  }

  getKeypair(): KeypairInterface {
    return {
      publicKey: () => ({
        toString: () => 'demo_public_key_' + Math.random().toString(36).slice(2, 10),
      }),
      nsec: () => 'nsec1' + 'a'.repeat(50),
      issueJwt: (_targetKey: string, _expiresInHours: bigint) => 'demo_jwt_token_' + Date.now(),
    };
  }

  deriveCashu(): ArrayBuffer {
    // Return a fake 32-byte seed
    return new Uint8Array(32).buffer;
  }
}

// Mock MarketApi class
export class MarketApi {
  async fetchMarketData(currencyCode: string): Promise<{ rate: number; price: number }> {
    // Return fake market data
    const mockPrices: Record<string, number> = {
      'USD': 65000,
      'EUR': 60000,
      'GBP': 52000,
      'JPY': 9500000,
    };
    const price = mockPrices[currencyCode.toUpperCase()] || 65000;
    return { rate: price, price };
  }
}

// Mock PortalApp class
export class PortalApp {
  static async create(
    keypair: KeypairInterface,
    relays: string[],
    relayStatusCallback: RelayStatusListener
  ): Promise<PortalAppInterface> {
    // Simulate relay connections
    relays.forEach((relay, index) => {
      setTimeout(() => {
        relayStatusCallback.onRelayStatusChange(relay, 3); // 3 = Connected
      }, index * 100);
    });

    return {
      getInfo: async () => ({
        balanceSats: BigInt(1000000),
        alias: 'DemoWallet',
      }),
      listen: () => {
        console.log('[MOCK] PortalApp.listen called');
      },
      reconnectRelay: async (url: string) => {
        console.log('[MOCK] Reconnecting relay:', url);
      },
      sendKeyHandshake: async (url: KeyHandshakeUrl) => {
        console.log('[MOCK] Sending key handshake:', url);
      },
      setProfile: async (profile: Profile) => {
        console.log('[MOCK] Setting profile:', profile);
      },
      registerNip05: async (nip05: string) => {
        console.log('[MOCK] Registering NIP-05:', nip05);
      },
      registerImg: async (imageBase64: string) => {
        console.log('[MOCK] Registering image, length:', imageBase64.length);
      },
      closeRecurringPayment: async (pubkey: string, subscriptionId: string) => {
        console.log('[MOCK] Closing recurring payment:', pubkey, subscriptionId);
      },
      fetchProfile: async (publicKey: string) => ({
        nip05: 'demo@example.com',
        name: 'Demo User',
        displayName: 'Demo User',
        picture: '',
      }),
      addRelay: async (url: string) => {
        console.log('[MOCK] Adding relay:', url);
      },
      connectionStatus: async () =>
        relays.map(url => ({ url, status: 3 })), // 3 = Connected
      nextCashuDirect: async () => {
        // Return a mock event - will never resolve in demo
        return new Promise(() => {});
      },
      nextCashuRequest: async () => {
        return new Promise(() => {});
      },
      nextAuthChallenge: async () => {
        return new Promise(() => {});
      },
      nextPaymentRequest: async () => {
        return new Promise(() => {});
      },
      nextClosedRecurringPayment: async () => {
        return new Promise(() => {});
      },
      nextNip46Request: async () => {
        return new Promise(() => {});
      },
    };
  }
}

// Mock listen functions
export function listenForAuthChallenge(app: PortalAppInterface): void {
  console.log('[MOCK] listenForAuthChallenge registered');
}

export function listenForCashuDirect(app: PortalAppInterface): void {
  console.log('[MOCK] listenForCashuDirect registered');
}

export function listenForCashuRequest(app: PortalAppInterface): void {
  console.log('[MOCK] listenForCashuRequest registered');
}

export function listenForDeletedSubscription(app: PortalAppInterface): void {
  console.log('[MOCK] listenForDeletedSubscription registered');
}

export function listenForPaymentRequest(app: PortalAppInterface): void {
  console.log('[MOCK] listenForPaymentRequest registered');
}

export function listenForNostrConnectRequest(app: PortalAppInterface, publicKey: string): void {
  console.log('[MOCK] listenForNostrConnectRequest registered for', publicKey);
}

// ============================================================================
// ADDITIONAL TYPES FOR NOSTR LISTENERS
// ============================================================================

export interface SinglePaymentRequest {
  id: string;
  amount: bigint;
  currency: string;
  description: string;
  requesterPubkey: string;
}

export interface RecurringPaymentRequest {
  id: string;
  amount: bigint;
  currency: string;
  description: string;
  recurrence: string;
  requesterPubkey: string;
}

export interface NostrConnectRequest {
  id: string;
  pubkey: string;
  method: string;
  params: string[];
}

export interface NostrConnectEvent {
  request: NostrConnectRequest;
}

export type IncomingPaymentRequest_Tags = {
  id: string;
  amount: bigint;
  currency: string;
};

// Mock keyToHex function
export function keyToHex(key: string): string {
  // Simple mock implementation - just return the key as hex
  return Buffer.from(key).toString('hex');
}

// Mock response status enums
export enum AuthResponseStatus {
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum CashuResponseStatus {
  Success = 'success',
  Error = 'error',
}

export enum NostrConnectResponseStatus {
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export enum RecurringPaymentStatus {
  Active = 'active',
  Cancelled = 'cancelled',
}

export enum Currency_Tags {
  USD = 'USD',
  EUR = 'EUR',
  BTC = 'BTC',
  SATS = 'SATS',
  Fiat = 'Fiat',
  Millisats = 'Millisats',
}

// Currency class mock
export class Currency {
  static USD = 'USD';
  static EUR = 'EUR';
  static BTC = 'BTC';
  static SATS = 'SATS';
}

// Payment Type for Breez
export enum PaymentType {
  Received = 'received',
  Sent = 'sent',
  Pending = 'pending',
}

// SdkEvent types
export interface SdkEvent {
  type: string;
  payment?: unknown;
}

export enum SdkEvent_Tags {
  PaymentReceived = 'payment_received',
  PaymentSent = 'payment_sent',
  PaymentFailed = 'payment_failed',
}

// ============================================================================
// MOCK FOR @breeztech/breez-sdk-spark-react-native
// ============================================================================

export interface BreezSdkInterface {
  getInfo(params: { ensureSynced: boolean }): Promise<{ balanceSats: bigint; alias?: string }>;
  receivePayment(params: { paymentMethod: unknown }): Promise<{ paymentRequest: string }>;
  getPayment(params: { paymentId: string }): Promise<{ payment: unknown }>;
  prepareSendPayment(params: {
    amount: bigint;
    paymentRequest: string;
    tokenIdentifier: undefined;
  }): Promise<PrepareSendPaymentResponse>;
  sendPayment(params: {
    prepareResponse: PrepareSendPaymentResponse;
    options: unknown;
    idempotencyKey: undefined;
  }): Promise<{ payment: { id: string } }>;
  addEventListener(callback: EventListener): string;
  removeEventListener(listenerId: string): void;
}

export interface PrepareSendPaymentResponse {
  paymentMethod: unknown;
}

export interface EventListener {
  (event: unknown): void;
}

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export enum OnchainConfirmationSpeed {
  Fast = 'fast',
  Medium = 'medium',
  Slow = 'slow',
}

// Mock Bolt11Invoice class
export class Bolt11Invoice {
  description: string;
  amountSats: bigint;

  constructor(params: { description: string; amountSats: bigint }) {
    this.description = params.description;
    this.amountSats = params.amountSats;
  }
}

// Mock ReceivePaymentMethod
export class ReceivePaymentMethod {
  static Bolt11Invoice = Bolt11Invoice;
  paymentMethod: unknown;

  constructor(params: { description: string; amountSats: bigint }) {
    this.paymentMethod = new Bolt11Invoice(params);
  }
}

// Mock SendPaymentMethod
export class SendPaymentMethod {
  static Bolt11Invoice = Bolt11Invoice;
  static BitcoinAddress = class {
    constructor(public address: string) {}
  };

  constructor(public type: string, public data?: unknown) {}
}

export class SendPaymentOptions {
  static Bolt11Invoice = class {
    constructor(public params: { preferSpark: boolean; completionTimeoutSecs: number }) {}
  };
  static BitcoinAddress = class {
    constructor(public params: { confirmationSpeed: OnchainConfirmationSpeed }) {}
  };
}

export class Seed {
  static Entropy = class {
    constructor(public entropy: ArrayBuffer) {}
  };
}

export function defaultConfig(network: Network): { apiKey?: string; preferSparkOverLightning?: boolean } {
  return {
    apiKey: 'demo_api_key',
    preferSparkOverLightning: false,
  };
}

export async function connect(params: {
  config: { apiKey?: string; preferSparkOverLightning?: boolean };
  seed: unknown;
  storageDir: string;
}): Promise<BreezSdkInterface> {
  console.log('[MOCK] Breez SDK connected');
  return {
    getInfo: async () => ({
      balanceSats: BigInt(500000),
      alias: 'MockBreezWallet',
    }),
    receivePayment: async () => ({
      paymentRequest: 'lnbc500n1p mock_invoice_for_demo',
    }),
    getPayment: async () => ({
      payment: { id: 'demo_payment_' + Math.random().toString(36).slice(2, 10) },
    }),
    prepareSendPayment: async () => ({
      paymentMethod: SendPaymentMethod.Bolt11Invoice,
    }),
    sendPayment: async () => ({
      payment: { id: 'demo_payment_' + Math.random().toString(36).slice(2, 10) },
    }),
    addEventListener: () => 'demo_listener_id',
    removeEventListener: () => {},
  };
}

// ============================================================================
// MOCK FOR Nostr Connect / NIP-46
// ============================================================================

export function createNostrConnectResponse(
  publicKey: string,
  event: unknown,
  result: string
): { content: string } {
  return {
    content: JSON.stringify({ id: 'demo_id', result }),
  };
}

export function createNostrConnectErrorResponse(
  publicKey: string,
  event: unknown,
  error: string
): { content: string } {
  return {
    content: JSON.stringify({ id: 'demo_id', error }),
  };
}

// Mock Logger Types and Functions
export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type LogCallback = (entry: LogEntry) => void;

export function initLogger(callback: LogCallback): void {
  console.log('[MOCK] Logger initialized');
  // Mock implementation - just log to console
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(...args);
    callback({
      level: LogLevel.Info,
      message: args.join(' '),
      timestamp: Date.now(),
    });
  };
}

// Mock parseKeyHandshakeUrl function
export function parseKeyHandshakeUrl(url: string): KeyHandshakeUrl {
  // Mock implementation
  return {
    url,
    relays: ['wss://relay.example.com'],
  };
}

// Mock parseCashuToken function
export function parseCashuToken(token: string): {
  token: string;
  amount: bigint;
  mintUrl: string;
} {
  // Mock implementation
  return {
    token,
    amount: BigInt(1000),
    mintUrl: 'https://mint.example.com',
  };
}

// Mock parseCalendar function
export function parseCalendar(calendarData: string): {
  recurringPaymentRequest: RecurringPaymentRequest;
  calendar?: unknown;
} {
  // Mock implementation - return a fake parsed calendar
  return {
    recurringPaymentRequest: {
      id: 'demo_recurring_' + Date.now(),
      amount: BigInt(10000),
      currency: 'SATS',
      description: 'Demo recurring payment',
      recurrence: 'monthly',
      requesterPubkey: 'demo_pubkey',
    },
    calendar: { events: [] },
  };
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export const getMarketApiClass = () => ({
  getRate: async () => ({
    price: 3000, // fake BTC price in USD
  }),
});

export const BreezSDK = {
  sendPayment: async () => ({ success: true, paymentId: 'demo_payment_' + Date.now() }),
  receivePayment: async () => ({
    invoice: 'demo_invoice_' + Date.now(),
    paymentRequest: 'lnbc500n1p mock_invoice_for_demo',
  }),
};
