// Polyfill crypto.getRandomValues for WalletConnect and other web3 libs
// MUST be the first import
import 'react-native-get-random-values';

// services/notifications.js

import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { handleHeadlessNotification, sendNotification } from '@/services/NotificationService';
import { DATABASE_NAME } from './constants/Database';

// Import expo-router entry point - must be imported for app to work
import 'expo-router/entry';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
const IS_WEB = Platform.OS === 'web';
const IS_EXPO_GO =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

const NotificationsModule =
  Platform.OS === 'web' || IS_EXPO_GO
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('expo-notifications') as typeof import('expo-notifications'));

const TaskManagerModule =
  Platform.OS === 'web'
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('expo-task-manager') as typeof import('expo-task-manager'));

/**
 * Define the background notification task
 * This runs when a remote notification is received while the app is in the background
 *
 * According to Expo docs, this must be defined at the module level,
 * not inside React components or functions
 */
if (NotificationsModule && TaskManagerModule) {
  TaskManagerModule.defineTask<any>(
    BACKGROUND_NOTIFICATION_TASK,
    async ({ data: _data, error: _error, executionInfo: _executionInfo }) => {
      // Enhanced logging for background task execution
      const _timestamp = new Date().toISOString();

      // Check if the app is currently in the foreground (active state)
      if (AppState.currentState === 'active') {
        return; // Do not execute background logic if the app is active
      }

      const isNotificationResponse = 'data' in _data;

      if (isNotificationResponse) {
        try {
          const payload = _data as Record<string, any>;
          const rawBody =
            payload?.data?.body ??
            payload?.data?.UIApplicationLaunchOptionsRemoteNotificationKey?.body ??
            payload?.notification?.request?.content?.data?.body;

          if (!rawBody) {
          } else {
            const parsedBody =
              typeof rawBody === 'string'
                ? (JSON.parse(rawBody) as Record<string, unknown>)
                : (rawBody as Record<string, unknown>);

            const eventContentValue = parsedBody?.event_content ?? parsedBody?.eventContent;

            if (typeof eventContentValue !== 'string') {
            } else {
              await handleHeadlessNotification(eventContentValue, DATABASE_NAME);
            }
          }
        } catch (_e) {}
      } else {
      }
    }
  );

  // Register background notification handler
  // This must be called before requesting permissions
  NotificationsModule.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
}

if (!IS_WEB) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { openDatabaseAsync } = require('expo-sqlite') as typeof import('expo-sqlite');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ActiveWalletProvider, WalletWrapper } = require('./queue/providers/ActiveWallet') as typeof import('./queue/providers/ActiveWallet');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NotificationProvider } = require('./queue/providers/Notification') as typeof import('./queue/providers/Notification');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PromptUserWithNotification } = require('./queue/providers/PromptUser') as typeof import('./queue/providers/PromptUser');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GetRelaysTask } = require('./queue/tasks/GetRelays') as typeof import('./queue/tasks/GetRelays');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProviderRepository } = require('./queue/WorkQueue') as typeof import('./queue/WorkQueue');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseService } = require('./services/DatabaseService') as typeof import('./services/DatabaseService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NostrStoreService = (require('./services/NostrStoreService') as typeof import('./services/NostrStoreService')).default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getMnemonic, getNsec } = require('./services/SecureStorageService') as typeof import('./services/SecureStorageService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getKeypairFromKey, hasKey } = require('./utils/keyHelpers') as typeof import('./utils/keyHelpers');

  async function initializeDatabase() {
    const sqlite = await openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
    const db = new DatabaseService(sqlite);
    ProviderRepository.register(db, 'DatabaseService');
  }

  async function initializeNostrStore() {
    const relays = await new GetRelaysTask().run();
    let mnemonic: string | null;
    try {
      mnemonic = await getMnemonic();
    } catch (_e) {
      // Only set to null if actual error occurred (not just missing key)
      mnemonic = null;
    }

    let nsec: string | null;
    // Load nsec - null is expected if key doesn't exist
    try {
      nsec = await getNsec();
    } catch (_e) {
      // Only set to null if actual error occurred (not just missing key)
      nsec = null;
    }

    // Skip initialization if no key material is available (e.g., during onboarding)
    if (!hasKey({ mnemonic, nsec })) {
      console.log('Skipping NostrStore initialization: no key material available');
      return;
    }

    const keypair = getKeypairFromKey({ mnemonic, nsec });
    const nostrStore = await NostrStoreService.create(keypair, relays);
    ProviderRepository.register(nostrStore, 'NostrStoreService');
  }

  initializeDatabase()
    .then(() => {
      initializeNostrStore()
        .then(() => {
          console.log('NostrStore initialized');
        })
        .catch(error => {
          console.error('Error initializing NostrStore', error);
        });

      console.log('Database initialized');
    })
    .catch(error => {
      console.error('Error initializing database', error);
    });

  ProviderRepository.register(new PromptUserWithNotification(sendNotification), 'PromptUserProvider');
  ProviderRepository.register(new NotificationProvider(sendNotification), 'NotificationProvider');
  ProviderRepository.register(
    new ActiveWalletProvider(new WalletWrapper(null)),
    'ActiveWalletProvider'
  );
}
