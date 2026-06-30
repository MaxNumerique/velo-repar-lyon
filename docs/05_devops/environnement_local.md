# Environnement Local — Installation & Démarrage

Ce guide explique comment installer et lancer l'application en environnement de développement local.

---

## 1. Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| Docker Desktop | 24.x | `docker --version` |
| Git | 2.x | `git --version` |

---

## 2. Cloner le Projet

```bash
git clone https://github.com/MaxNumerique/velo-repar-lyon.git
cd velo-repar-lyon
```

---

## 3. Configurer les Variables d'Environnement

Copiez le fichier `.env.example` (à créer si absent) en `.env` et renseignez toutes les valeurs :

```bash
cp .env.example .env
```

### Variables requises

```env
# Base de données
DATABASE_URL="postgresql://velo_admin:velo_pass@localhost:5432/velodupelo"
DB_USER=velo_admin
DB_PASSWORD=velo_pass
DB_NAME=velodupelo

# Clerk (Authentification)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cartographie
NEXT_PUBLIC_MAPTILER_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API=...

# Cloudinary (Hébergement images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Pusher (Chat temps réel)
PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Email (Nodemailer / Gmail)
GOOGLE_HOST=smtp.gmail.com
GOOGLE_PORT=587
GOOGLE_EMAIL=votre.email@gmail.com
PASSWORD_APP=mot_de_passe_application_gmail

# Web Push (Notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:votre.email@gmail.com

# Bike Index API
BIKE_INDEX_APP_ID=...
BIKE_INDEX_SECRET=...
```

---

## 4. Lancer la Base de Données (Docker)

L'application requiert PostgreSQL avec l'extension PostGIS. Le fichier `docker-compose.yml` configure tout automatiquement.

```bash
# Lancer PostgreSQL + PostGIS en arrière-plan
docker compose up -d db

# Vérifier que la base est bien démarrée
docker compose ps
```

La base de données écoute sur `localhost:5432`.

---

## 5. Installer les Dépendances

```bash
npm install
```

---

## 6. Initialiser la Base de Données

```bash
# Pousser le schéma Prisma vers PostgreSQL (crée toutes les tables)
npx prisma db push

# (Optionnel) Peupler la base avec des données de test
npx prisma db seed
```

---

## 7. Lancer l'Application

```bash
npm run dev
```

L'application démarrera avec Webpack (`next dev --webpack`) et sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## 8. Outils de Développement Utiles

### Prisma Studio (Interface graphique de la base)

```bash
npx prisma studio
```

Ouvre une interface web sur [http://localhost:5555](http://localhost:5555) pour explorer et modifier les données directement.

### Lancer les Tests

```bash
# Exécuter tous les tests une fois
npm test

# Mode watch (relance automatiquement à chaque modification)
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage
```

### Linter

```bash
npm run lint
```

---

## 9. Synchroniser les Comptes Clerk en Local

Si vous avez des comptes Clerk existants à importer dans votre base locale :

```bash
node prisma/sync-clerk.js
```

Ce script interroge l'API Clerk pour récupérer tous les utilisateurs et les insère dans la table `User` locale.

---

## 10. Résolution de Problèmes Courants

| Problème | Solution |
|---|---|
| `Error: DATABASE_URL not found` | Vérifier que `.env` existe et que `prisma.config.js` appelle bien `dotenv.config()` |
| `Error: PostGIS extension not found` | Utiliser l'image Docker `postgis/postgis:15-3.3` et non `postgres:15` |
| `Error: Invalid Clerk key` | Vérifier que les clés Clerk du tableau de bord correspondent à l'environnement (dev vs prod) |
| Port 5432 déjà utilisé | Modifier le port dans `docker-compose.yml` et mettre à jour `DATABASE_URL` |
| `Error: Can't resolve 'tailwindcss'` | Le script `npm run dev` utilise le compilateur Webpack (`--webpack`) à la place de Turbopack pour résoudre correctement Tailwind CSS v4. Assurez-vous d'utiliser la dernière version du script `dev`. |
