# Déploiement — Docker & VPS

Ce document explique l'infrastructure de déploiement en production de l'application HomeCycl'Home.

---

## 1. Vue d'Ensemble de l'Infrastructure

L'application est hébergée sur un **VPS (Virtual Private Server)** et entièrement conteneurisée via **Docker**. Le déploiement est automatisé via GitHub Actions (voir [ci_cd.md](./ci_cd.md)).

```
GitHub Actions (CI/CD)
        │
        │ docker build & push
        ▼
GitHub Container Registry (ghcr.io)
        │
        │ docker pull
        ▼
VPS Linux (/home/maxnumerique/apps/NodeApp/)
    │
    ├── velo-repar-migrator   ← Conteneur éphémère (migrations DB)
    ├── velo-repar-app        ← Conteneur Next.js (port 3000)
    └── velo-repar-db         ← Conteneur PostgreSQL + PostGIS (postgis/postgis:15-3.3)
```

---

## 2. Le Dockerfile (Build Multi-Stage)

Le `Dockerfile` utilise une construction **multi-stage** pour produire une image finale légère et sécurisée.

### Stage 1 : `deps` — Installation des dépendances

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
```

Installe toutes les dépendances npm. Mis en cache par Docker si `package.json` n'a pas changé.

### Stage 2 : `builder` — Build Next.js

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Injection des variables d'environnement publiques au build
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
...
RUN npx prisma generate   # Génère le client Prisma
RUN npm run build          # next build (bundle statique + server)
```

Les variables `NEXT_PUBLIC_*` **doivent être injectées à la compilation** car Next.js les intègre directement dans le bundle JavaScript client. Elles sont passées comme arguments `--build-arg` dans GitHub Actions.

### Stage 3 : `runner` — Image de production

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Utilisateur non-root pour la sécurité
RUN addgroup --system nodejs && adduser --system nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/bin/sh", "/app/scripts/docker-entrypoint.sh"]
```

L'image finale ne contient que le strict nécessaire (build `standalone` de Next.js). L'application tourne avec un utilisateur non-root pour limiter la surface d'attaque.

---

## 3. Docker Compose de Production (`docker-compose.prod.yml`)

Trois services sont orchestrés :

### Service `db` — Base de Données

```yaml
db:
  image: postgis/postgis:15-3.3
  restart: always
  environment:
    POSTGRES_USER: velo_admin
    POSTGRES_PASSWORD: velo_pass
    POSTGRES_DB: velodupelo
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U velo_admin -d velodupelo"]
    interval: 10s
    retries: 5
```

Un healthcheck garantit que PostgreSQL est prêt avant de démarrer les autres services.

### Service `migrator` — Migrations (éphémère)

```yaml
migrator:
  image: ghcr.io/maxnumerique/velo-repar-lyon:latest
  entrypoint: ["/bin/sh", "-c"]
  command: "npx prisma db push --schema=prisma/schema.prisma --url=$DATABASE_URL"
  depends_on:
    db:
      condition: service_healthy
  restart: "no"
```

Ce conteneur s'exécute **une seule fois** au démarrage pour synchroniser le schéma Prisma avec la base de données. Il s'arrête automatiquement après l'exécution (`restart: "no"`).

### Service `app` — Application Next.js

```yaml
app:
  image: ghcr.io/maxnumerique/velo-repar-lyon:latest
  restart: always
  ports:
    - "3000:3000"
  depends_on:
    db:
      condition: service_healthy
    migrator:
      condition: service_completed_successfully
```

Le service `app` ne démarre qu'une fois que `db` est sain **et** que `migrator` a terminé avec succès.

---

## 4. Entrypoint Docker (`scripts/docker-entrypoint.sh`)

Le script d'entrée est exécuté au démarrage du conteneur `app` :

```bash
#!/bin/sh
# Lance le serveur Next.js standalone
node server.js
```

---

## 5. Variables d'Environnement en Production

Les variables secrètes sont stockées dans les **Secrets GitHub** du dépôt et injectées de deux manières :

1. **Variables `NEXT_PUBLIC_*`** : passées en `--build-arg` lors du `docker build` (intégrées dans le bundle JS).
2. **Variables serveur** : générées dans un fichier `.env` sur le VPS pendant le pipeline CI/CD, puis montées dans le conteneur via `env_file`.

> ⚠️ Ne jamais committer le fichier `.env` de production dans le dépôt Git. Il est dans `.gitignore` et `.dockerignore`.

---

## 6. Commandes Utiles sur le VPS

Se connecter au VPS en SSH, puis :

```bash
cd /home/maxnumerique/apps/NodeApp

# Voir les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f app

# Redémarrer l'application
docker compose -f docker-compose.prod.yml restart app

# Mettre à jour manuellement (tirer la dernière image)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Nettoyage des images inutilisées
docker image prune -f
```
