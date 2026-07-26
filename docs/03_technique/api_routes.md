# Référence des Routes API — HomeCycl'Home

Toutes les routes API sont implémentées avec le **Next.js App Router** sous `src/app/api/`. Elles retournent du JSON et utilisent les méthodes HTTP standard.

---

## 1. Routes Publiques (sans authentification)

Ces routes sont accessibles sans être connecté. Elles alimentent le wizard de réservation client et la recherche de vélos.

### `GET /api/availability`

Vérifie la couverture géographique d'une adresse et retourne les techniciens disponibles dans la zone.

**Paramètre :** `?address=` (adresse complète en texte)

**Réponse succès :**
```json
{
  "sectorId": "clx...",
  "coords": { "lat": 45.75, "lng": 4.83 },
  "technicians": [
    { "id": "clx...", "name": "Jean Dupont", "busySlots": ["2026-07-10T09:00:00.000Z"] }
  ]
}
```

**Erreurs possibles :**
- `400` — Adresse manquante ou invalide (Google Maps)
- `404` — Adresse hors zone de couverture
- `404` — Aucun technicien affecté au secteur

---

### `POST /api/repair-request`

Crée une nouvelle demande d'intervention. Point d'entrée final du wizard client.

**Corps de la requête :**
```json
{
  "address": "10 Rue de la Paix, Lyon 69001",
  "lat": 45.76,
  "lng": 4.83,
  "description": "Crevaison roue arrière",
  "bikeDetails": { "bikeBrand": "Trek", "bikeModel": "FX3", "bikeType": "VTC" },
  "bikePhotos": ["https://res.cloudinary.com/..."],
  "issuePhotos": [],
  "servicePackageId": "clx...",
  "products": [{ "productId": "clx...", "quantity": 1, "price": 8.50 }],
  "clientFirstName": "Marie",
  "clientLastName": "Martin",
  "clientEmail": "marie@example.com",
  "clientPhone": "0612345678",
  "technicianId": "clx...",
  "scheduledAt": "2026-07-10T09:00:00.000Z"
}
```

**Actions côté serveur :**
1. Création de la `RepairRequest` en base de données.
2. Création des `InterventionProduct` associés.
3. Envoi d'un email de confirmation au client (`sendEmail`).
4. Envoi d'une notification Web Push au technicien (`notifyNewRepairRequest`).

---

### `GET /api/services-public`

Retourne la liste de tous les forfaits (`ServicePackage`) pour le wizard client.

---

### `GET /api/products-public`

Retourne la liste de tous les produits actifs (`isActive: true`) pour le wizard client.

---

### `GET /api/bikes`

Retourne les vélos enregistrés pour l'utilisateur connecté.

---

### `GET /api/bikes/search`

Recherche un modèle de vélo via l'API publique Bike Index.

**Paramètre :** `?query=` (recherche textuelle par marque ou modèle)

---

## 2. Routes Authentifiées — Interventions & Profil

### `GET /api/admin/users/me`

Retourne le profil de l'utilisateur connecté.

### `PATCH /api/admin/users/me`

Met à jour le profil de l'utilisateur connecté (prénom, nom, téléphone, statut de disponibilité `isAvailable`).

---

### `GET /api/interventions`

Retourne les interventions de l'utilisateur connecté.
- Si rôle `CLIENT` → retourne ses propres interventions.
- Si rôle `TECHNICIAN` → retourne les interventions qui lui sont assignées.

**Paramètres optionnels :** `?status=`, `?from=`, `?to=`

---

### `GET /api/interventions/[id]`

Retourne le détail complet d'une intervention (incluant vélo, forfait, produits, messages, technicien, client).

---

### `PATCH /api/interventions/[id]`

Met à jour une intervention (ex: changement de statut par le technicien).

**Corps :** `{ "status": "EN_ROUTE" }` ou tout autre champ modifiable.

**Actions déclenchées selon le statut :**
- `EN_ROUTE` → Notification push au client "Votre technicien est en route"
- `COMPLETED` → Notification push au client "Intervention terminée"

---

### `DELETE /api/interventions/[id]`

Annule / supprime une intervention. Soumis à la règle des -6h pour les clients.

---

## 3. Routes Authentifiées — Chat & Réactions

### `GET /api/conversations`

Retourne la liste des conversations (interventions avec chat actif) de l'utilisateur.

---

### `GET /api/conversations/[id]/messages`

Retourne l'historique complet des messages d'une intervention.

---

### `POST /api/conversations/[requestId]/messages/[messageId]/reactions`

Ajoute ou supprime une réaction emoji sur un message spécifique (toggle). Émet un événement Pusher en temps réel.

**Corps :** `{ "emoji": "👍" }`

---

### `POST /api/pusher/auth`

Authentifie un utilisateur pour un canal Pusher privé. Requis par le protocole Pusher pour les canaux `private-`.

---

## 4. Routes Admin — `/api/admin/`

Toutes ces routes nécessitent le rôle `ADMIN` et sont encapsulées avec le wrapper `withAdmin`.

### Interventions

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/interventions` | Liste toutes les interventions |
| `POST` | `/api/admin/interventions` | Crée une intervention manuellement |
| `GET` | `/api/admin/interventions/[id]` | Détail d'une intervention |
| `PATCH` | `/api/admin/interventions/[id]` | Modifie une intervention |
| `DELETE` | `/api/admin/interventions/[id]` | Supprime une intervention |
| `POST` | `/api/admin/interventions/assign-technician` | Attribue un technicien selon des coordonnées (`lat`, `lng`) |

### Utilisateurs

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Liste tous les utilisateurs avec filtres (`role`, `search`) |
| `POST` | `/api/admin/users` | Crée un compte utilisateur (Clerk + DB) |
| `PATCH` | `/api/admin/users/[id]` | Modifie un profil (rôle, blocage) |
| `DELETE` | `/api/admin/users/[id]` | Supprime un utilisateur (interdit sur les admins) |

### Techniciens

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/technicians` | Liste tous les techniciens |
| `GET` | `/api/admin/technicians/availability` | Créneaux disponibles par technicien |

### Secteurs

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/sectors` | Liste tous les secteurs |
| `POST` | `/api/admin/sectors` | Crée un secteur (polygone GeoJSON) |
| `PATCH` | `/api/admin/sectors/[id]` | Modifie un secteur |
| `DELETE` | `/api/admin/sectors/[id]` | Supprime un secteur |

### Forfaits

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/services` | Liste tous les forfaits |
| `POST` | `/api/admin/services` | Crée un forfait |
| `PATCH` | `/api/admin/services/[id]` | Modifie un forfait |
| `DELETE` | `/api/admin/services/[id]` | Supprime un forfait |

### Produits

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/products` | Liste tous les produits |
| `POST` | `/api/admin/products` | Crée un produit |
| `PATCH` | `/api/admin/products/[id]` | Modifie un produit |
| `DELETE` | `/api/admin/products/[id]` | Supprime un produit |

---

## 5. Routes Utilitaires & Notifications Push

### `POST /api/push/subscribe`

Enregistre un abonnement Web Push pour l'utilisateur connecté (sauvegarde dans `PushSubscription`).

### `DELETE /api/push/unsubscribe`

Supprime l'abonnement Web Push de l'utilisateur connecté.

### `POST /api/push/test`

Envoie une notification push de test à l'utilisateur connecté.

### `POST /api/webhooks/clerk`

Webhook Clerk : déclenché automatiquement par Clerk lors de la création d'un nouveau compte. Synchronise le profil utilisateur Clerk dans la table `User` PostgreSQL locale (`upsertUser`).
