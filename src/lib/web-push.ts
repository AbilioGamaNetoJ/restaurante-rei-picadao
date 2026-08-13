import webPush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@reidopicadao.com.br';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webPush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 } // 1 hour TTL
    );
  } catch (error: unknown) {
    // If subscription is expired/invalid (410 Gone), we should clean it up
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: unknown }).statusCode
      : undefined;
    if (statusCode === 410 || statusCode === 404) {
      console.warn('[push] Subscription expired');
      throw new Error('SUBSCRIPTION_EXPIRED');
    }
    console.error('[push] Failed to send notification', {
      reason: error instanceof Error ? error.name : 'UnknownError',
    });
    throw error;
  }
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
