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
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsLoading(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PUSH] SW enregistré:', reg.scope);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setSubscription(sub);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[PUSH] Erreur SW:', err);
        setIsLoading(false);
      });
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      showToast.error('Notifications non disponibles');
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await subscribePush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        },
      });
      setSubscription(sub);
      setPermission(Notification.permission);
      return sub;
    } catch (err) {
      console.error('[PUSH] subscribe() échoué:', err.name, err.message);
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