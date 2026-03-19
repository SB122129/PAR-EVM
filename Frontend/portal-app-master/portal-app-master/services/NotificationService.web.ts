export const AMOUNT_MISMATCH_REJECTION_REASON =
  'Invoice amount does not match the requested amount.';

export async function sendNotification(_content: unknown): Promise<void> {
  // Notifications are intentionally no-op on web in this app.
}

export async function sendPaymentAmountMismatchNotification(
  _request: unknown,
  _executeOperation: unknown,
  _app: unknown
): Promise<void> {
  // Notifications are intentionally no-op on web in this app.
}

export default async function registerPubkeysForPushNotificationsAsync(
  _pubkeys: string[]
): Promise<void> {
  // Push registration is intentionally disabled on web.
}

export async function handleHeadlessNotification(
  _event: string,
  _databaseName: string
): Promise<void> {
  // Headless notifications are native-only.
}
