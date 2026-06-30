# Stack Technologique — HomeCycl'Home

Ce document liste et explique le rôle de chaque outil, framework et service tiers utilisé dans l'application.

---

## 1. Framework & Runtime

### Next.js 16 (App Router)
- **Rôle :** Framework principal de l'application (front-end + back-end dans un seul projet).
- **Pourquoi :** Next.js App Router offre le meilleur compromis entre Server Components (performances, SEO) et Client Components (interactivité). Il simplifie l'architecture en colocalisants les routes API et les pages dans le même projet.
- **Usage :** Toutes les pages (`/app`), routes API (`/app/api`), layouts et middlewares.

### React 19
- **Rôle :** Librairie UI pour la construction des composants interactifs.
- **Usage :** Tous les composants `.jsx` du projet.

### Node.js 20
- **Rôle :** Runtime JavaScript côté serveur.
- **Usage :** Exécution de Next.js et des scripts Prisma.

---

## 2. Base de Données

### PostgreSQL 15
- **Rôle :** Base de données relationnelle principale.
- **Pourquoi :** Robustesse, support de l'extension PostGIS, transactions ACID.

### PostGIS
- **Rôle :** Extension PostgreSQL permettant les **requêtes spatiales géographiques**.
- **Pourquoi :** Indispensable pour vérifier si une adresse GPS est contenue dans un polygone de secteur (`ST_Contains`).
- **Usage :** Table `Sector` avec un champ `boundary` de type `geometry`. Index spatial de type GIST pour les performances.

### Prisma ORM (v7)
- **Rôle :** ORM (Object-Relational Mapper) pour interagir avec PostgreSQL depuis JavaScript.
- **Pourquoi :** Typage fort, migrations automatiques, Prisma Studio pour l'exploration de données.
- **Adaptateur :** `@prisma/adapter-pg` (adaptateur officiel pour le driver `pg` de Node.js).
- **Configuration :** `prisma.config.js` — charge les variables d'environnement via `dotenv` avant de résoudre l'URL de connexion.

---

## 3. Authentification

### Clerk
- **Rôle :** Service d'authentification externalisé (SaaS).
- **Pourquoi :** Gestion complète du cycle de vie utilisateur (inscription, connexion, mot de passe oublié, OAuth) sans développement backend dédié.
- **Usage :**
  - `@clerk/nextjs` : Middleware Next.js (`clerkMiddleware`) et composants React (`<UserButton>`, `<SignIn>`).
  - Webhook (`/api/webhooks/clerk`) : Synchronise les nouveaux utilisateurs Clerk avec la table `User` de PostgreSQL (création automatique du profil local).
  - Les rôles (`ADMIN`, `TECHNICIAN`, `CLIENT`) sont stockés dans les **métadonnées publiques** (`publicMetadata.role`) du compte Clerk.

---

## 4. Cartographie

### MapLibre GL
- **Rôle :** Rendu de cartes vectorielles interactives dans le navigateur.
- **Pourquoi :** Alternative open-source à Mapbox GL JS, compatible avec les tuiles MapTiler.

### MapTiler
- **Rôle :** Fournisseur de tuiles cartographiques (fond de carte).
- **Usage :** Clé API `NEXT_PUBLIC_MAPTILER_KEY` utilisée pour charger les tuiles dans MapLibre.

### @mapbox/mapbox-gl-draw
- **Rôle :** Plugin permettant le **dessin de polygones** sur la carte.
- **Usage :** Espace admin → Gestion des Secteurs (`/admin/sectors`). L'admin dessine les zones de couverture directement sur la carte.

### Google Maps JavaScript API
- **Rôle :** Géocodage d'adresses (conversion adresse texte → coordonnées GPS).
- **Usage :**
  - `AddressAutocomplete` : Suggestion d'adresses en temps réel lors de la saisie.
  - `geocodeAddress()` (`/src/lib/googleMaps.js`) : Conversion de l'adresse en lat/lng pour la requête PostGIS.

---

## 5. Services Tiers

### Cloudinary
- **Rôle :** Plateforme de stockage et d'optimisation d'images dans le cloud.
- **Pourquoi :** Téléversement direct depuis le navigateur (sans passer par le serveur Next.js), transformations d'images à la volée (redimensionnement, compression).
- **Usage :** Photos de vélos, photos de pannes, photos de clôture d'intervention, images des forfaits et produits.
- **SDK :** `next-cloudinary` (composant `<CldUploadWidget>`) et `cloudinary` (SDK serveur pour les opérations admin).

### Pusher
- **Rôle :** Service de communication temps réel par WebSocket (Publish/Subscribe).
- **Pourquoi :** Simplicité d'intégration pour les mises à jour en temps réel sans gérer une infrastructure WebSocket.
- **Usage :** Messagerie instantanée (chat) entre clients et techniciens. Chaque intervention a son propre canal Pusher.
- **SDK :** `pusher` (serveur) + `pusher-js` (client navigateur).

### Nodemailer + Gmail SMTP
- **Rôle :** Envoi d'emails transactionnels.
- **Usage :** Email de confirmation de réservation envoyé au client après validation de sa demande d'intervention.

### Web Push API (VAPID)
- **Rôle :** Envoi de notifications push navigateur aux utilisateurs abonnés.
- **Usage :** Notification au technicien lors d'une nouvelle assignation, notification au client lors d'un changement de statut de son intervention.
- **SDK :** `web-push` (génération et envoi des notifications côté serveur).

### Bike Index API
- **Rôle :** Base de données publique de bicyclettes.
- **Usage :** Autocomplétion lors de la saisie du modèle de vélo dans le wizard de réservation. Permet de pré-remplir la marque et le modèle automatiquement.

---

## 6. UI & Design

### Tailwind CSS v4
- **Rôle :** Framework CSS utilitaire.
- **Usage :** Tous les styles de l'application. Chaque composant est stylisé avec des classes utilitaires Tailwind.

### Shadcn UI / Radix UI
- **Rôle :** Composants UI accessibles et personnalisables.
- **Usage :** Popover, calendrier (`react-day-picker`), boutons, badges, etc.

### Lucide React
- **Rôle :** Bibliothèque d'icônes SVG.
- **Usage :** Icônes dans toute l'interface (navigation, statuts, actions).

### Sonner
- **Rôle :** Composant de notifications toast (messages éphémères).
- **Usage :** Feedback utilisateur après actions (succès, erreur, avertissement).

### date-fns
- **Rôle :** Librairie de manipulation de dates en JavaScript.
- **Usage :** Formatage des dates, calcul de la règle des -6h, génération des créneaux horaires.

### emoji-picker-react
- **Rôle :** Sélecteur d'emojis pour le chat.
- **Usage :** Bouton emoji dans `ChatInput`.

---

## 7. Qualité & DevOps

### Vitest
- **Rôle :** Framework de tests unitaires et d'intégration (compatible Vite/ESM).
- **Usage :** Suite de 246 tests couvrant les routes API, les hooks et les composants.

### React Testing Library
- **Rôle :** Utilitaires pour tester les composants React.
- **Usage :** Rendu de composants en environnement jsdom et assertions sur le DOM.

### semantic-release
- **Rôle :** Automatisation des releases et du versionnement sémantique (SemVer).
- **Usage :** À chaque push sur `master`, analyse les commits pour déterminer le type de release (patch/minor/major) et génère le changelog automatiquement.

### commitlint
- **Rôle :** Validation du format des messages de commit (Conventional Commits).
- **Usage :** Hook de CI sur les Pull Requests vers `dev`.

### Docker
- **Rôle :** Conteneurisation de l'application pour le déploiement.
- **Usage :** `Dockerfile` multi-stage (deps → builder → runner). `docker-compose.prod.yml` orchestre l'application, la base de données et le migrator.

### GitHub Actions
- **Rôle :** Plateforme CI/CD.
- **Usage :** Pipelines automatisés de tests, release et déploiement (voir [ci_cd.md](../05_devops/ci_cd.md)).
