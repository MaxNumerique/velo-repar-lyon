# Architecture du Projet — Structure des Dossiers

L'application suit le principe du **Feature-Driven Development (FDD)** : le code est organisé par domaine fonctionnel et non par type de fichier. Cela améliore la lisibilité et facilite l'ajout de nouvelles fonctionnalités sans toucher au code existant.

---

## Vue d'ensemble

```
velo-repar-lyon/
│
├── prisma/                         # Configuration ORM & Base de données
│   ├── schema.prisma               # Schéma de données (modèles, relations, enums)
│   ├── seed.js                     # Script de peuplement de données de test
│   ├── sync-clerk.js               # Script de synchronisation des comptes Clerk → DB
│   └── migrations/                 # Historique des migrations SQL
│
├── src/                            # Code source de l'application
│   ├── app/                        # Routage Next.js App Router (pages & API)
│   │   ├── (auth)/                 # Pages publiques d'authentification (Clerk)
│   │   ├── (dashboard)/            # Pages protégées (layout avec Sidebar)
│   │   │   ├── (auth-required)/    # Pages nécessitant une connexion
│   │   │   │   ├── admin/          # Espace administrateur
│   │   │   │   ├── bikes/          # Gestion des vélos du client
│   │   │   │   ├── interventions/  # Dashboard technicien / client
│   │   │   │   ├── map/            # Carte de tournée technicien
│   │   │   │   └── profile/        # Profil utilisateur
│   │   │   ├── messages/           # Messagerie instantanée (chat)
│   │   │   └── repair/             # Page publique du wizard de réservation
│   │   ├── api/                    # Routes API (Back-end Next.js)
│   │   ├── globals.css             # Styles globaux + tokens Tailwind
│   │   ├── layout.jsx              # Layout racine (ClerkProvider, Toaster)
│   │   └── page.jsx                # Page d'accueil publique
│   │
│   ├── features/                   # Logique métier par domaine
│   │   ├── admin/                  # Composants, hooks et services d'administration
│   │   ├── bikes/                  # Gestion des vélos (recherche Bike Index, CRUD)
│   │   ├── chat/                   # Messagerie temps réel (Pusher & réactions)
│   │   ├── interventions/          # Suivi et gestion d'interventions
│   │   │   └── booking/            # Wizard de réservation client (5 étapes)
│   │   ├── notifications/          # Gestion des abonnements Web Push VAPID
│   │   ├── products/               # Catalogue et gestion des pièces/produits
│   │   ├── sectors/                # Cartographie Mapbox/Leaflet & zones PostGIS
│   │   └── users/                  # Profils & gestion des utilisateurs (Clerk + DB)
│   │
│   ├── components/                 # Composants UI partagés
│   │   ├── layout/                 # Sidebar, Header, navigation globale
│   │   ├── shared/                 # Modales de confirmation, autocomplétion, pagination
│   │   └── ui/                     # Primitives Shadcn UI (button, card, select, etc.)
│   │
│   ├── lib/                        # Utilitaires et clients de services tiers
│   │   ├── apiClient.js            # Client HTTP centralisé (wrapper de fetch)
│   │   ├── auth.js                 # Wrappers (withAuth, withAdmin) & formatage erreurs Clerk
│   │   ├── authConfig.js           # Thème & apparence des formulaires Clerk
│   │   ├── cloudinaryClient.js     # Client d'upload d'images Cloudinary
│   │   ├── dateUtils.js            # Formatage et calculs de dates (date-fns)
│   │   ├── googleMaps.js           # Géocodage d'adresses (Google Maps API)
│   │   ├── mail.js                 # Envoi d'emails (Nodemailer)
│   │   ├── notifications.js        # Utilitaires Toast (react-hot-toast)
│   │   ├── pusher.js               # Instance Pusher serveur
│   │   ├── utils.js                # Utilitaires CSS (clsx/tailwind-merge)
│   │   └── webPush.js              # Service Web Push VAPID + notifications d'interventions
│   │
│   ├── db/                         # Singleton Prisma Client & Sync
│   │   ├── prisma.js               # Instance Prisma partagée
│   │   └── userSync.js             # Synchronisation automatique Clerk → DB
│   │
│   └── proxy.js                    # Middleware Next.js (Clerk + redirections par rôle)
│
├── tests/                          # Suites de tests (Vitest + RTL)
│   ├── app/                        # Tests des routes API
│   ├── features/                   # Tests des composants et hooks
│   ├── hooks/                      # Tests des hooks partagés
│   └── lib/                        # Tests des utilitaires
│
├── .github/workflows/              # Pipelines GitHub Actions (CI/CD)
│   ├── ci.yml                      # Tests + release sémantique
│   ├── deploy-master.yml           # Build Docker + déploiement VPS
│   └── sync-dev-to-master.yml      # Synchronisation dev → master
│
├── Dockerfile                      # Image Docker multi-stage (Next.js)
├── docker-compose.yml              # Environnement local (app + db + PostGIS)
├── docker-compose.prod.yml         # Environnement production (VPS)
├── vitest.config.js                # Configuration Vitest (alias, setup)
└── package.json                    # Dépendances et scripts npm
```

---

## Détail des dossiers clés

### `src/app/` — Routage Next.js

Ce dossier contient **uniquement** la structure de routage. Les fichiers `page.jsx` sont des contrôleurs minces qui importent les composants depuis `src/features/`. Cela respecte le principe de **séparation des préoccupations**.

Les groupes de routes (entre parenthèses) servent à organiser les layouts sans affecter les URLs :
- `(auth)` → Pages de connexion/inscription Clerk (URL : `/sign-in`, `/sign-up`).
- `(dashboard)` → Pages avec la Sidebar et le Header (URL : toutes les pages de l'app).
- `(auth-required)` → Sous-groupe nécessitant une session active (URL : `/interventions`, `/admin`, etc.).

### `src/features/` — Logique Métier

Chaque sous-dossier représente un **domaine métier** complet et autonome :

| Dossier | Responsabilité |
|---|---|
| `interventions/` | Cycle de vie des interventions (liste, détail, statuts, assignation) |
| `interventions/booking/` | Wizard de réservation client en 5 étapes |
| `admin/` | Composants, hooks (`useAdminForm`) et formulaires du back-office admin |
| `bikes/` | Recherche (Bike Index API) et CRUD des vélos |
| `chat/` | Interface et logique de messagerie temps réel (Pusher & réactions emojis) |
| `notifications/` | Abonnements Web Push, hooks (`usePushNotifications`) et push d'alertes |
| `products/` | Affichage et gestion des pièces et consommables |
| `sectors/` | Cartographie interactive & zones géographiques PostGIS |
| `users/` | Profils utilisateurs, rôles (`CLIENT`, `TECHNICIAN`, `ADMIN`) et synchro Clerk |

### `src/lib/` — Services Tiers & Helpers Centralisés

Ce dossier regroupe tous les **clients et wrappers de services externes**. 
- `apiClient.js` : Encapsule `fetch` avec gestion automatique des erreurs HTTP et du format de réponse.
- `auth.js` : Fournit les wrappers HOC de route (`withAuth`, `withAdmin`, `withTechnician`) et la centralisation du formatage des erreurs d'authentification (`formatClerkErrorMessage`).
- `webPush.js` : Centralise l'envoi des notifications Push VAPID et la fonction `notifyNewRepairRequest(request)`.

### `tests/` — Suite de Tests

La structure des tests **miroire exactement** celle de `src/`. Pour chaque fichier source, son test correspondant se trouve au même chemin relatif dans `tests/`.
