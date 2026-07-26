# Système de Notifications & Temps Réel

L'application HomeCycl'Home utilise deux architectures distinctes pour gérer l'interaction en temps réel et les notifications :
1. **WebSockets (via Pusher) :** Pour les interactions instantanées à faible latence dans l'application (le chat).
2. **Web Push API (VAPID) :** Pour les notifications système envoyées à l'utilisateur, même si l'application ou le navigateur est fermé.

---

## 1. WebSockets & Temps Réel — Pusher Channels

### A. Rôle et Cas d'Usage
Pusher est utilisé pour alimenter le **chat de discussion en temps réel** entre les clients et les techniciens sur la page de détails d'une intervention (`/interventions/[id]`).

### B. Architecture des Canaux (Channels)
Pour garantir la confidentialité des discussions, chaque intervention possède son propre canal de présence sécurisé :
* **Nom du canal :** `presence-intervention-${requestId}`
* **Type de canal :** `presence-` (canal privé qui permet en plus de savoir qui est connecté en ligne en temps réel).

### C. Flux de Communication (Events)
Les événements transitent bidirectionnellement entre le client web et le serveur Next.js :

* **`client-message` :** Émis lorsqu'un utilisateur envoie un message. Le message est enregistré en base de données, puis diffusé instantanément à l'autre participant.
* **`client-typing` :** Émis lorsqu'un utilisateur commence à taper du texte, permettant d'afficher l'indicateur "En train d'écrire..." chez l'interlocuteur.
* **`client-reaction` :** Émis lorsqu'un utilisateur ajoute ou supprime une réaction emoji sur un message existant.

```
Navigateur (Client) ────────► [API Next.js /api/conversations] ──────► [Sauvegarde DB]
        ▲                                                                    │
        │                                                                    ▼
        └─────────────── [Pusher Broadcast Server] ◄────────────── [Appel API Pusher Server]
                         (WebSocket temps réel)
```

### D. Sécurité & Authentification des Canaux
Comme il s'agit d'un canal privé, le client doit prouver qu'il a le droit de s'y abonner. 
1. Lors de la connexion, la bibliothèque `pusher-js` appelle automatiquement la route d'authentification de l'application : [src/app/api/pusher/auth/route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/pusher/auth/route.js).
2. Le serveur vérifie la session via Clerk et contrôle en base de données si l'utilisateur est soit le **client propriétaire** de l'intervention, soit le **technicien assigné**, soit un **administrateur**.
3. Si la vérification réussit, le serveur renvoie une signature sécurisée autorisant la connexion WebSocket. Sinon, il renvoie un refus `403 Forbidden`.

---

## 2. Notifications Système en Arrière-plan — Web Push API (VAPID)

### A. Rôle et Cas d'Usage
Permet d'envoyer des notifications natives du système d'exploitation à l'appareil de l'utilisateur (ordinateur ou mobile).
* **Techniciens :** Notifiés lorsqu'une nouvelle intervention leur est assignée.
* **Clients :** Notifiés lorsque le statut de leur intervention change (ex: technicien en route, intervention terminée).

### B. Fonctionnement et Cycle de Vie

#### 1. Autorisation & Souscription (Côté Client)
* L'utilisateur clique sur "Activer les notifications".
* L'application demande la permission système via `Notification.requestPermission()`.
* Si autorisée, le navigateur génère une souscription auprès de son service de push natif (FCM pour Chrome, Autopush pour Firefox, APNS pour Safari) en utilisant la clé publique **VAPID** (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
* Le navigateur renvoie un objet **Subscription** contenant :
  * Un `endpoint` : Une URL unique propre à l'appareil.
  * Des clés cryptographiques `p256dh` et `auth` (pour chiffrer les messages).

#### 2. Enregistrement en Base de Données
* L'application envoie cette souscription à l'API [src/app/api/push/subscribe/route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/push/subscribe/route.js).
* Elle est enregistrée dans la table `PushSubscription` associée à l'identifiant de l'utilisateur.

#### 3. Envoi d'une Notification (Côté Serveur)
* Lors d'un événement métier (ex: assignation d'une tournée), le serveur Next.js récupère toutes les souscriptions de l'utilisateur ciblé.
* Le serveur utilise la librairie `web-push` en signant le payload de la notification avec les clés VAPID (`VAPID_PRIVATE_KEY` et `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
* Le payload chiffré est envoyé via HTTP POST à l'URL `endpoint` du service de push du constructeur.

#### 4. Réception et Rendu (Service Worker)
* Le service de push du constructeur transmet la notification à l'appareil de l'utilisateur.
* Même si l'onglet du site est fermé, le **Service Worker** de l'application ([public/sw.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/public/sw.js)) intercepte l'événement `push` en arrière-plan.
* Il déchiffre le payload et affiche la notification native à l'écran :
  ```javascript
  self.addEventListener('push', function(event) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/velodupelo.png',
      data: { url: data.url }
    });
  });
  ```

---

## 3. Configuration des Clés VAPID (Sécurité)

Le protocole VAPID (*Voluntary Application Server Identification*) permet d'identifier de manière sécurisée le serveur de l'application auprès des services de push pour éviter le spam.

### Génération des clés
En développement, si les clés doivent être renouvelées, elles peuvent être générées en ligne de commande :
```bash
npx web-push generate-vapid-keys
```

### Variables d'environnement requises
* `NEXT_PUBLIC_VAPID_PUBLIC_KEY` : Clé publique (utilisée par le client pour s'abonner).
* `VAPID_PRIVATE_KEY` : Clé privée (gardée secrète sur le serveur pour signer les messages).
* `VAPID_EMAIL` : Adresse e-mail de contact au format `mailto:votre-email@domaine.com` (exigée par les services de push).
