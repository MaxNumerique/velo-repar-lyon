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

/**
 * Notify relevant parties about an intervention status change.
 * @param {string} requestId - The ID of the repair request.
 * @param {string} status - The new status.
 */
export async function notifyInterventionStatusUpdate(requestId, status) {
  try {
    const request = await prisma.repairRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        technician: true
      }
    });

    if (!request) return;

    let statusMsg = "";
    switch (status) {
      case 'EN_ROUTE': statusMsg = "Votre technicien est en route !"; break;
      case 'ON_SITE': statusMsg = "Le technicien est arrivé sur place."; break;
      case 'COMPLETED': statusMsg = "Votre réparation est terminée !"; break;
      case 'CANCELLED': statusMsg = "Votre intervention a été annulée."; break;
      case 'SCHEDULED': statusMsg = "Votre intervention a été planifiée."; break;
    }

    if (!statusMsg) return;

    // 1. Notify CLIENT
    if (request.userId) {
      await sendPushNotification(request.userId, {
        title: "Mise à jour de votre réparation",
        body: statusMsg,
        url: `/interventions/${request.id}`,
      });
    }

    // 2. Notify ADMINS for important changes
    if (['COMPLETED', 'CANCELLED', 'SCHEDULED'].includes(status)) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const techName = request.technician?.firstName || "Un technicien";
      const clientName = request.clientFirstName || request.user?.firstName || "le client";
      
      for (const admin of admins) {
        await sendPushNotification(admin.id, {
          title: `Intervention ${status.toLowerCase()}`,
          body: `L'intervention de ${techName} pour ${clientName} est ${status.toLowerCase()}.`,
          url: `/admin/interventions/${request.id}`,
        });
      }
    }
  } catch (error) {
    console.error("[NOTIFY_INTERVENTION_ERROR]", error);
  }
}

