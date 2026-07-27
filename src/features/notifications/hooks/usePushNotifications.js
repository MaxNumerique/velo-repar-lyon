"use client";

import { useState, useEffect, useCallback } from 'react';
import { showToast } from '@/lib/notifications';
import { subscribePush, unsubscribePush } from '@/features/notifications/services/notificationService';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState(() => typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported] = useState(supported);
  const [isLoading, setIsLoading] = useState(supported);

  useEffect(() => {
    if (!supported) return;

    let isMounted = true;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (!isMounted) return;
        setSubscription(sub);
        if (sub) {
          const jsonSub = sub.toJSON();
          await subscribePush({
            endpoint: sub.endpoint,
            keys: {
              p256dh: jsonSub.keys.p256dh,
              auth: jsonSub.keys.auth,
            },
          });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[PUSH] Erreur SW:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      showToast.error('Notifications non disponibles');
      return null;
    }
    try {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') {
          showToast.error('Permission refusée par le navigateur');
          return null;
        }
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const jsonSub = sub.toJSON();

      await subscribePush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: jsonSub.keys.p256dh,
          auth: jsonSub.keys.auth,
        },
      });
      setSubscription(sub);
      setPermission(Notification.permission);
      return sub;
    } catch (err) {
      console.error('[PUSH] subscribe() échoué:', err);
      showToast.error('Erreur : ' + err.message);
      return null;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;
    try {
      await unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (err) {
      console.error('[PUSH] unsubscribe() échoué:', err);
      return false;
    }
  }, [subscription]);

  return { isSupported, permission, subscription, subscribe, unsubscribe, isLoading };
}