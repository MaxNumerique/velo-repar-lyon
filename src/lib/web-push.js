import webpush from 'web-push';
import prisma from './prisma';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'mailto:admin@veloreparlyon.fr';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
}

/**
 * Send a push notification to all subscriptions of a specific user.
 * @param {string} userId - The internal database ID of the user.
 * @param {object} payload - The notification content { title, body, url, icon }.
 */
export async function sendPushNotification(userId, payload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[PUSH] No subscriptions found for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify(payload);

    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(pushSubscription, notificationPayload).catch(async (err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[PUSH] Subscription expired or removed for user ${userId}`);
          // Remove invalid subscription from database
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`[PUSH] Error sending to user ${userId}:`, err);
        }
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`[PUSH_SERVICE_ERROR] Failed to send push to user ${userId}:`, error);
  }
}
