"use client";

import { useState, useEffect, useCallback } from 'react';
import { showToast } from "@/components/ui/use-toast";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      console.log('[PUSH] Status:', { 
        supported: true, 
        permission: Notification.permission,
        hasKey: !!VAPID_PUBLIC_KEY,
        keyStart: VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.substring(0, 10) + '...' : 'MISSING'
      });

      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.pushManager.getSubscription().then((sub) => {
            setSubscription(sub);
            setIsLoading(false);
          }).catch(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      }).catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      console.error('[PUSH] Not supported in this browser');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[PUSH] NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing! Build-args failed?');
      showToast.error("Clé de notification manquante");
      return null;
    }

    try {
      console.log('[PUSH] Requesting subscription...');
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[PUSH] Subscription obtained:', sub.endpoint);

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')))),
          },
        }),
      });

      if (response.ok) {
        console.log('[PUSH] Successfully saved to server');
        setSubscription(sub);
        setPermission(Notification.permission);
        return sub;
      } else {
        console.error('[PUSH] Server rejected subscription');
      }
    } catch (error) {
      console.error('[PUSH] Subscription failed:', error);
      showToast.error("Erreur d'abonnement : " + error.message);
    }
    return null;
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;

    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    subscribe,
    unsubscribe,
    isLoading
  };
}
