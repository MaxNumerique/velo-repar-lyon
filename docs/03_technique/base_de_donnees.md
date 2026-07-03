# Base de Données — Modèle de Données

L'application utilise **PostgreSQL 15** avec l'extension **PostGIS**, géré via **Prisma ORM v7**.

---

## 1. Vue d'ensemble du Schéma

```
User ─────────── Bike ─────────── RepairRequest ─── ServicePackage
  │                                     │
  │ (CLIENT)    (via bikeId)             ├── InterventionProduct ── Product
  │ (TECHNICIAN)                         ├── Message
  │                                     └── (technicianId → User)
  └── Sector (many-to-many via TechnicianSectors)
  └── PushSubscription
```

---

## 2. Modèles de Données

### `User` — Utilisateurs

Représente tous les comptes de l'application, quel que soit le rôle.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique interne |
| `clerkId` | `String` (unique) | Identifiant Clerk (synchronisation via webhook) |
| `email` | `String` (unique) | Adresse email |
| `firstName` | `String?` | Prénom |
| `lastName` | `String?` | Nom de famille |
| `phone` | `String?` | Numéro de téléphone |
| `role` | `Role` (enum) | Rôle : `CLIENT`, `TECHNICIAN`, `ADMIN` |
| `isBlocked` | `Boolean` | Compte bloqué par un admin |
| `isAvailable` | `Boolean` | Disponibilité du technicien |
| `avatar` | `String?` | URL de l'avatar Cloudinary |
| `lat` / `lng` | `Float?` | Position GPS (non utilisé activement) |
| `createdAt` | `DateTime` | Date de création |
| `updatedAt` | `DateTime` | Date de dernière mise à jour |

**Relations :**
- `bikes[]` → Vélos appartenant à cet utilisateur (CLIENT)
- `requests[]` → Interventions créées par cet utilisateur (CLIENT)
- `interventions[]` → Interventions assignées à cet utilisateur (TECHNICIAN)
- `sectors[]` → Zones géographiques affectées (TECHNICIAN, relation M-M)
- `pushSubscriptions[]` → Abonnements aux notifications push

---

### `PushSubscription` — Abonnements Notifications Push

Stocke les endpoints de notification Web Push pour chaque appareil abonné.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `userId` | `String` | Référence vers `User` |
| `endpoint` | `String` (unique) | URL de l'endpoint push du navigateur |
| `p256dh` | `String` | Clé publique de chiffrement |
| `auth` | `String` | Secret d'authentification |

---

### `Bike` — Vélos

Représente un vélo enregistré dans le compte d'un client.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `brand` | `String` | Marque du vélo |
| `modelName` | `String?` | Modèle du vélo |
| `type` | `String?` | Type : VTT, VTC, VAE, Route, Ville |
| `photos` | `String[]` | URLs des photos du vélo (Cloudinary) |
| `imageUrl` | `String?` | Image principale (Bike Index ou Cloudinary) |
| `bikeIndexId` | `String?` | Identifiant dans la base Bike Index |
| `notes` | `String?` | Notes libres |
| `userId` | `String` | Propriétaire (→ `User`) |

---

### `RepairRequest` — Interventions

Modèle central de l'application. Représente une demande d'intervention depuis sa création jusqu'à sa clôture.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `address` | `String` | Adresse d'intervention (texte complet) |
| `lat` / `lng` | `Float?` | Coordonnées GPS de l'adresse |
| `description` | `String` | Description de la panne ou du besoin |
| `bikePhotos` | `String[]` | URLs des photos du vélo (avant intervention) |
| `issuePhotos` | `String[]` | URLs des photos illustrant la panne |
| `bikeDetails` | `Json` | Données brutes du vélo (marque, modèle, type) |
| `bikeIndexId` | `String?` | Référence Bike Index |
| `bikeImageUrl` | `String?` | Image du vélo depuis Bike Index |
| `clientFirstName` | `String?` | Prénom du client (snapshot à la création) |
| `clientLastName` | `String?` | Nom du client (snapshot à la création) |
| `clientEmail` | `String?` | Email du client (snapshot à la création) |
| `clientPhone` | `String?` | Téléphone du client (snapshot à la création) |
| `userId` | `String?` | Référence vers `User` (CLIENT) — nullable si non connecté |
| `bikeId` | `String?` | Référence vers `Bike` — nullable si vélo non enregistré |
| `technicianId` | `String?` | Référence vers `User` (TECHNICIAN) — assigné automatiquement |
| `servicePackageId` | `String?` | Référence vers `ServicePackage` |
| `scheduledAt` | `DateTime?` | Date et heure de l'intervention |
| `status` | `InterventionStatus` | Statut courant du cycle de vie |
| `isChatOpen` | `Boolean` | Chat activé/désactivé pour cette intervention |

> **Note sur les champs client snapshotés :** Les champs `clientFirstName`, `clientLastName`, etc. sont copiés à la création de la demande. Cela garantit que les informations affichées au technicien restent cohérentes même si le client modifie son profil ultérieurement.

---

### `ServicePackage` — Forfaits d'Entretien

Catalogue des prestations proposées à la réservation.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `title` | `String` | Nom du forfait (ex: "Révision complète") |
| `description` | `String` | Description détaillée |
| `price` | `Float` | Prix en euros |
| `duration_min` | `Int` | Durée estimée en minutes (défaut: 30) |
| `image` | `String?` | URL d'une image illustrative (Cloudinary) |

---

### `Message` — Messages du Chat

Messages échangés dans le chat d'une intervention.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `requestId` | `String` | Intervention concernée (→ `RepairRequest`) |
| `senderId` | `String` | Identifiant de l'expéditeur (→ `User.id`) |
| `senderRole` | `Role` | Rôle de l'expéditeur au moment de l'envoi |
| `content` | `String` | Contenu textuel du message |
| `attachments` | `String[]` | URLs des pièces jointes (Cloudinary) |
| `isEdited` | `Boolean` | Le message a été modifié |
| `isDeleted` | `Boolean` | Le message a été supprimé (soft delete) |
| `reactions` | `Json` | Réactions emoji (tableau `[{emoji, userId}]`) |
| `isRead` | `Boolean` | Message lu par le destinataire |

---

### `Product` — Produits Additionnels

Catalogue des produits/accessoires vendus en complément d'une intervention.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `name` | `String` | Nom du produit |
| `description` | `String?` | Description |
| `price` | `Float` | Prix unitaire en euros |
| `image` | `String?` | URL image (Cloudinary) |
| `category` | `String?` | Catégorie libre |
| `isActive` | `Boolean` | Visible dans le wizard client si `true` |

---

### `InterventionProduct` — Table de Jointure (Intervention ↔ Produit)

Enregistre les produits ajoutés à une intervention spécifique, avec la quantité et le prix **au moment de la commande** (snapshot du prix).

| Champ | Type | Description |
|---|---|---|
| `requestId` | `String` | Référence vers `RepairRequest` |
| `productId` | `String` | Référence vers `Product` |
| `quantity` | `Int` | Quantité commandée |
| `price` | `Float` | Prix unitaire snapsoté |

---

### `Sector` — Zones Géographiques

Définit les zones de couverture d'intervention sur la métropole lyonnaise.

| Champ | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Identifiant unique |
| `name` | `String` (unique) | Nom de la zone (ex: "Lyon Centre") |
| `boundary` | `geometry` (PostGIS) | Polygone géographique de la zone |
| `color` | `String?` | Couleur d'affichage sur la carte (HEX) |

**Index :** Un index spatial GIST est défini sur `boundary` pour accélérer les requêtes `ST_Contains`.

---

## 3. Énumérations

### `Role`
```
CLIENT | TECHNICIAN | ADMIN
```

### `InterventionStatus`
```
PENDING | SCHEDULED | EN_ROUTE | ON_SITE | COMPLETED | CANCELLED
```

---

## 4. Requête Spatiale PostGIS — Détail Technique

La vérification de couverture géographique utilise une requête SQL brute (impossible à exprimer via l'API Prisma standard) :

```sql
SELECT id FROM "Sector"
WHERE ST_Contains(boundary, ST_SetSRID(ST_Point(:lng, :lat), 4326))
```

- `ST_Point(lng, lat)` : Crée un point géographique à partir des coordonnées du client.
- `ST_SetSRID(..., 4326)` : Applique le système de référence spatiale WGS84 (GPS standard).
- `ST_Contains(boundary, point)` : Vérifie si le polygone du secteur contient ce point.
- L'index GIST sur `boundary` garantit que cette requête est exécutée en O(log n) même avec de nombreux secteurs.

---

## 5. Fonctionnement en Production (Conteneur & Persistance)

Faire tourner une base de données dans Docker en production repose sur 3 principes majeurs : l'isolation, la persistance des volumes et le réseau privé.

### A. L'Isolation du Conteneur
La base de données tourne dans son propre conteneur hermétique (`velo-repar-db`) basé sur l'image officielle `postgis/postgis`.
* **Indépendance :** Le conteneur possède son propre mini-système d'exploitation (Alpine/Debian), ses propres dépendances (PostgreSQL, PostGIS, GEOS) et sa propre configuration.
* **Mises à jour sans douleur :** Pour mettre à jour PostgreSQL ou PostGIS, il suffit de changer la version de l'image Docker. Le conteneur est détruit et recréé en quelques secondes sans affecter le système hôte (le VPS).

### B. La Persistance des Données (Docker Volumes)
Par nature, le système de fichiers d'un conteneur Docker est éphémère (si le conteneur est supprimé, tout ce qui a été écrit dedans disparaît). 

Pour rendre la base de données persistante, nous utilisons un **Volume Docker** (`postgres_data`) :
* **Fonctionnement :** Docker crée un répertoire spécial sur le disque dur de votre VPS (dans `/var/lib/docker/volumes/`). Ce répertoire est "monté" dans le conteneur à l'emplacement où PostgreSQL écrit ses fichiers de données (`/var/lib/postgresql/data`).
* **Cycle de vie :** Lorsque le conteneur `velo-repar-db` est arrêté, détruit pour mise à jour, ou recréé, le volume reste intact sur le disque dur du VPS. Le nouveau conteneur se reconnecte simplement à ce même volume au démarrage et retrouve instantanément l'intégralité des données.

### C. Sécurité et Réseau Interne Docker
* **Pas d'exposition publique :** Dans le fichier `docker-compose.prod.yml`, le service `db` n'expose aucun port vers l'extérieur (pas de section `ports: - "5432:5432"`). Le port 5432 de la DB est donc **totalement invisible et inaccessible depuis l'internet public**, éliminant les attaques par force brute.
* **Réseau privé virtuel :** Docker compose crée un réseau virtuel privé partagé entre vos conteneurs. Le conteneur Next.js (`velo-repar-app`) communique avec la DB de façon interne en utilisant le nom du service (`db`) comme nom de domaine (URL: `postgresql://user:pass@db:5432/...`).

### D. Commandes Pratiques de Gestion

#### Accéder à la console SQL (CLI)
```bash
docker exec -it velo-repar-db psql -U velo_admin -d velodupelo
```

#### Sauvegarder la base de données (Dump)
```bash
docker exec -t velo-repar-db pg_dump -U velo_admin velodupelo > backup.sql
```

#### Restaurer une sauvegarde
```bash
docker exec -i velo-repar-db psql -U velo_admin -d velodupelo < backup.sql
```
