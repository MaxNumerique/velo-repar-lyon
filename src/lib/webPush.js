import webpush from 'web-push';
import prisma from '@/db/prisma';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'mailto:admin@veloreparlyon.fr';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
}

export async function sendPushNotification(userId, payload) {
  if (!publicKey || !privateKey) {
    throw new Error("VAPID Keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) are missing in environment variables.");
  }
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) {
    throw new Error(`Aucun abonnement push actif trouvé en base de données pour cet utilisateur.`);
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
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
      throw err;
    });
  });
  await Promise.all(promises);
}

export async function notifyNewRepairRequest(request) {
  const { id, address, clientFirstName, clientLastName, technicianId } = request;
  const clientName = `${clientFirstName || ''} ${clientLastName || ''}`.trim() || 'Un client';

  try {
    if (technicianId) {
      const tech = await prisma.user.findUnique({
        where: { id: technicianId, role: 'TECHNICIAN' },
      });
      if (tech) {
        await sendPushNotification(tech.id, {
          title: "Nouvelle intervention assignée !",
          body: `${clientName} à ${address}`,
          url: `/interventions?id=${id}`,
        });
      }
    } else {
      const technicians = await prisma.user.findMany({
        where: { role: 'TECHNICIAN' },
      });
      for (const tech of technicians) {
        await sendPushNotification(tech.id, {
          title: "Nouvelle demande d'intervention !",
          body: `Une nouvelle demande à ${address} est disponible.`,
          url: "/interventions",
        });
      }
    }

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await sendPushNotification(admin.id, {
        title: "Nouvelle demande reçue",
        body: `Client: ${clientName} - ${address}`,
        url: `/admin/interventions/${id}`,
      });
    }
  } catch (error) {
    console.error("[PUSH_NOTIFICATION_TRIGGER_ERROR]", error);
  }
}

export async function notifyInterventionStatusUpdate(requestId, status) {
  const request = await prisma.repairRequest.findUnique({
    where: { id: requestId },
    include: {
      user: true,
      technician: true,
    },
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
  if (request.userId) {
    await sendPushNotification(request.userId, {
      title: "Mise à jour de votre réparation",
      body: statusMsg,
      url: `/interventions/${request.id}`,
    });
  }
  if (['COMPLETED', 'CANCELLED', 'SCHEDULED'].includes(status)) {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    const techName = request.technician ? request.technician.firstName : "Un technicien";
    const clientName = request.clientFirstName || (request.user ? request.user.firstName : "le client");
    for (const admin of admins) {
      await sendPushNotification(admin.id, {
        title: `Intervention ${status.toLowerCase()}`,
        body: `L'intervention de ${techName} pour ${clientName} est ${status.toLowerCase()}.`,
        url: `/admin/interventions/${request.id}`,
      });
    }
  }
}
