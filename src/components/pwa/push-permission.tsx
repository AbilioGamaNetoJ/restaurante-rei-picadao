'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

const PUSH_ASKED_KEY = 'pwa_push_asked';

export function PushPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    // Only show banner if not yet asked and permission is default
    if (Notification.permission === 'default') {
      const asked = localStorage.getItem(PUSH_ASKED_KEY);
      if (!asked) {
        setTimeout(() => setIsVisible(true), 5000);
      }
    } else if (Notification.permission === 'granted') {
      // Sync subscription with the server
      subscribeToPush();
    }
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(PUSH_ASKED_KEY, 'true');

      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('[push] Permission request failed:', error);
    } finally {
      setIsSubscribing(false);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PUSH_ASKED_KEY, 'true');
    setIsVisible(false);
  };

  // Enable/Disable toggle for granted state
  const handleToggle = async () => {
    if (permission !== 'granted') return;

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        // Unsubscribe
        await existing.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        console.log('[push] Unsubscribed');
      } else {
        // Re-subscribe
        await subscribeToPush();
      }
    } catch (error) {
      console.error('[push] Toggle failed:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (permission === 'unsupported') return null;

  // Banner for first-time ask
  if (isVisible && permission === 'default') {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-4 duration-500">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-blue-50 p-3 rounded-2xl">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-gray-900 text-sm tracking-tight">
                Ativar notificações? 🔔
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Receba alertas em tempo real quando novos pedidos chegarem.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Depois
            </button>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="flex-1 py-2 px-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              {isSubscribing ? 'Ativando...' : 'Ativar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

async function subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidKey) {
      console.error('[push] VAPID public key not configured');
      return;
    }

    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (err: any) {
      if (err.name === 'InvalidStateError' || String(err).includes('applicationServerKey')) {
        console.warn('[push] Invalid applicationServerKey, unsubscribing old subscription...');
        const oldSub = await registration.pushManager.getSubscription();
        if (oldSub) await oldSub.unsubscribe();

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      } else {
        throw err;
      }
    }

    const json = subscription.toJSON();

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    console.log('[push] Subscribed successfully');
  } catch (error) {
    console.error('[push] Subscription failed:', error);
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
