import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseService } from '@/services/DatabaseService';

const DEMO_USERNAME_KEY = 'portal_username';
const DEMO_DISPLAY_NAME_KEY = 'portal_display_name';
const DEMO_AVATAR_URI_KEY = 'portal_avatar_uri';

const DEMO_PROFILE = {
  username: 'hbfounder',
  displayName: 'HB Vault Team',
  avatarUri: '',
};

type DemoActivitySeed = {
  type: 'auth' | 'pay' | 'receive' | 'ticket' | 'ticket_approved' | 'ticket_denied' | 'ticket_received';
  service_name: string;
  service_key: string;
  detail: string;
  amount: number | null;
  currency: string | null;
  converted_amount: number | null;
  converted_currency: string | null;
  request_id: string;
  status: 'neutral' | 'positive' | 'negative' | 'pending';
  date: Date;
  subscription_id?: string | null;
  invoice?: string | null;
};

const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const buildDemoActivities = (): DemoActivitySeed[] => [
  {
    type: 'auth',
    service_name: 'Nimbus Commerce',
    service_key: 'service_nimbus_commerce',
    detail: 'Approved sign-in from launch dashboard',
    amount: null,
    currency: null,
    converted_amount: null,
    converted_currency: null,
    request_id: 'demo-auth-01',
    status: 'positive',
    date: hoursAgo(1),
  },
  {
    type: 'pay',
    service_name: 'Atlas Delivery',
    service_key: 'service_atlas_delivery',
    detail: 'Express order settlement',
    amount: 2800,
    currency: 'SATS',
    converted_amount: 1.54,
    converted_currency: 'USD',
    request_id: 'demo-pay-01',
    status: 'positive',
    invoice: 'lnbc_demo_invoice_paid_01',
    date: hoursAgo(3),
  },
  {
    type: 'pay',
    service_name: 'Borealis AI Tools',
    service_key: 'service_borealis_ai',
    detail: 'Monthly productivity bundle',
    amount: 4200,
    currency: 'SATS',
    converted_amount: 2.31,
    converted_currency: 'USD',
    request_id: 'demo-pay-02',
    status: 'pending',
    invoice: 'lnbc_demo_invoice_pending_02',
    date: hoursAgo(6),
  },
  {
    type: 'receive',
    service_name: 'Helix Partners',
    service_key: 'service_helix_partners',
    detail: 'Referral rebate received',
    amount: 9500,
    currency: 'SATS',
    converted_amount: 5.19,
    converted_currency: 'USD',
    request_id: 'demo-receive-01',
    status: 'positive',
    date: daysAgo(1),
  },
  {
    type: 'ticket',
    service_name: 'Aurora Summit',
    service_key: 'mint_aurora_events',
    detail: 'VIP access pass requested',
    amount: 1,
    currency: null,
    converted_amount: null,
    converted_currency: null,
    request_id: 'demo-ticket-01',
    status: 'pending',
    date: daysAgo(1),
  },
  {
    type: 'ticket_approved',
    service_name: 'Aurora Summit',
    service_key: 'mint_aurora_events',
    detail: 'VIP access pass approved',
    amount: 1,
    currency: null,
    converted_amount: null,
    converted_currency: null,
    request_id: 'demo-ticket-02',
    status: 'positive',
    date: daysAgo(2),
  },
  {
    type: 'ticket_received',
    service_name: 'Northwind Trains',
    service_key: 'mint_northwind_trains',
    detail: 'Round-trip transit pass minted',
    amount: 2,
    currency: null,
    converted_amount: null,
    converted_currency: null,
    request_id: 'demo-ticket-03',
    status: 'positive',
    date: daysAgo(3),
  },
  {
    type: 'ticket_denied',
    service_name: 'City Arena',
    service_key: 'mint_city_arena',
    detail: 'Seat upgrade request denied',
    amount: 1,
    currency: null,
    converted_amount: null,
    converted_currency: null,
    request_id: 'demo-ticket-04',
    status: 'negative',
    date: daysAgo(4),
  },
];

export async function seedDemoDataIfNeeded(sqliteDb: SQLiteDatabase): Promise<void> {
  const db = new DatabaseService(sqliteDb);

  const [existingActivities, existingSubscriptions, existingContacts] = await Promise.all([
    db.getActivities({ limit: 1 }),
    db.getSubscriptions({ limit: 1 }),
    db.getRecentNip05Contacts(1),
  ]);

  if (existingActivities.length > 0 || existingSubscriptions.length > 0 || existingContacts.length > 0) {
    return;
  }

  const activities = buildDemoActivities();
  for (const activity of activities) {
    await db.addActivity({
      ...activity,
      date: activity.date,
      subscription_id: activity.subscription_id ?? null,
    });
  }

  await db.addPaymentStatusEntry('lnbc_demo_invoice_paid_01', 'payment_started');
  await db.addPaymentStatusEntry('lnbc_demo_invoice_paid_01', 'payment_completed');
  await db.addPaymentStatusEntry('lnbc_demo_invoice_pending_02', 'payment_started');

  await db.addSubscription({
    request_id: 'demo-sub-01',
    service_name: 'Borealis AI Tools',
    service_key: 'service_borealis_ai',
    amount: 4200,
    currency: 'SATS',
    converted_amount: 2.31,
    converted_currency: 'USD',
    recurrence_calendar: 'FREQ=DAILY;INTERVAL=1',
    recurrence_max_payments: null,
    recurrence_until: null,
    recurrence_first_payment_due: daysFromNow(1),
    status: 'active',
    last_payment_date: daysAgo(1),
    next_payment_date: daysFromNow(1),
  });

  await db.addSubscription({
    request_id: 'demo-sub-02',
    service_name: 'Nimbus Commerce Prime',
    service_key: 'service_nimbus_prime',
    amount: 10500,
    currency: 'SATS',
    converted_amount: 5.74,
    converted_currency: 'USD',
    recurrence_calendar: 'FREQ=WEEKLY;INTERVAL=1',
    recurrence_max_payments: null,
    recurrence_until: null,
    recurrence_first_payment_due: daysFromNow(3),
    status: 'active',
    last_payment_date: daysAgo(4),
    next_payment_date: daysFromNow(3),
  });

  await db.addSubscription({
    request_id: 'demo-sub-03',
    service_name: 'Atlas Delivery Plus',
    service_key: 'service_atlas_delivery',
    amount: 6500,
    currency: 'SATS',
    converted_amount: 3.55,
    converted_currency: 'USD',
    recurrence_calendar: 'FREQ=MONTHLY;INTERVAL=1',
    recurrence_max_payments: 12,
    recurrence_until: daysFromNow(180),
    recurrence_first_payment_due: daysAgo(20),
    status: 'cancelled',
    last_payment_date: daysAgo(20),
    next_payment_date: null,
  });

  const demoContacts = [
    'npub1demohb0000000000000000000000000000000000000000000000000000000',
    'npub1demoborealis0000000000000000000000000000000000000000000000000',
    'npub1demoatlas0000000000000000000000000000000000000000000000000000',
    'npub1demonimbus000000000000000000000000000000000000000000000000000',
    'npub1demohelix0000000000000000000000000000000000000000000000000000',
  ];

  for (const npub of demoContacts) {
    await db.saveNip05Contact(npub);
  }

  try {
    const username = await SecureStore.getItemAsync(DEMO_USERNAME_KEY);
    if (!username) {
      await SecureStore.setItemAsync(DEMO_USERNAME_KEY, DEMO_PROFILE.username);
    }

    const displayName = await SecureStore.getItemAsync(DEMO_DISPLAY_NAME_KEY);
    if (!displayName) {
      await SecureStore.setItemAsync(DEMO_DISPLAY_NAME_KEY, DEMO_PROFILE.displayName);
    }

    const avatar = await SecureStore.getItemAsync(DEMO_AVATAR_URI_KEY);
    if (!avatar || avatar.startsWith('http')) {
      await SecureStore.setItemAsync(DEMO_AVATAR_URI_KEY, DEMO_PROFILE.avatarUri);
    }
  } catch {
    // Ignore profile seed failures: demo data should not block app startup.
  }
}
