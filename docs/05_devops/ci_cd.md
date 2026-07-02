# Pipelines CI/CD — GitHub Actions

L'application utilise deux pipelines GitHub Actions distincts, chacun avec une responsabilité claire.

**Dossier :** [.github/workflows/](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows)

---

## 1. Pipeline de CI & Release Candidate (`ci.yml`)

**Fichier :** [ci.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows/ci.yml)

**Déclencheurs :**
- `push` sur les branches `master` et `dev`
- `pull_request` vers `dev`

Ce pipeline est composé de trois jobs :

### Job 1 : `commitlint` — Vérification des Commits Sémantiques

**Ne s'exécute que** sur les Pull Requests vers `dev`.  
**Configuration :** [.commitlintrc.json](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.commitlintrc.json)

Vérifie qu'au moins **un commit de la PR suit le format Conventional Commits** :

```
type(scope?): description

Types valides : feat, fix, perf, revert, refactor, chore, docs, style, test, build, ci
Exemples :
  feat(booking): add product selection step
  fix(api): correct availability slot calculation
```

Si aucun commit sémantique n'est trouvé, le pipeline échoue et bloque le merge.

### Job 2 : `test` — Exécution des Tests Vitest

S'exécute sur **tous les événements** (push + PR).  
**Configuration des tests :** [vitest.config.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/vitest.config.js)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: '22' }
  - run: npm install
  - run: npm test          # npx vitest run
```

**Condition de succès :** 100% des tests passent (243 tests, 44 fichiers).

### Job 3 : `release` — Release Candidate (RC) Automatique

**Ne s'exécute que** sur `push` sur la branche `dev`. **Dépend du succès du job `test`**.  
**Configuration :** [.releaserc.json](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.releaserc.json)

Utilise `semantic-release` pour générer automatiquement une version de pré-release (étiquetée `dev`, ex: `1.4.0-dev.1`) avec son tag Git et sa GitHub Release pré-remplie.

---

## 2. Pipeline de Synchronisation, Release Stable & Déploiement VPS (`sync-release-deploy.yml`)

**Fichier :** [sync-release-deploy.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows/sync-release-deploy.yml)

**Déclencheurs :**
- `schedule` : Tous les jours à 2h00 UTC (cron `0 2 * * *`)
- `workflow_dispatch` : Déclenchement manuel depuis l'interface GitHub Actions

### Responsabilités et Étapes :

1. **Synchronisation Git (Dev → Master)** :
   - Récupère les modifications les plus récentes de `dev` et les fusionne dans `master`.
   - Pousse `master` mis à jour sur GitHub.

2. **Validation & Release Stable** :
   - Configure Node.js, installe les dépendances et exécute la suite de tests complète sur `master`.
   - Exécute `semantic-release` sur `master` pour générer le nouveau numéro de version stable (ex: `1.4.0`), créer le tag stable Git et mettre à jour le changelog.
   - Effectue un `git pull` pour rapatrier le commit de release créé par `semantic-release`.

3. **Build de l'Image Docker** :
   - Compile l'application avec un Dockerfile multi-stage en injectant les variables d'environnement nécessaires en `--build-arg`.
   - Pousse l'image finale sous le tag `latest` vers le registre de conteneurs de GitHub (GHCR).

4. **Déploiement sur le VPS** :
   - Génère le fichier `.env` de production à partir des variables secrètes de GitHub.
   - Copie les fichiers `.env` et `docker-compose.prod.yml` sur le VPS de production.
   - Exécute via SSH les commandes de redémarrage des conteneurs :
     ```bash
     docker compose -f docker-compose.prod.yml pull
     docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans
     docker image prune -f
     ```

5. **Rapatriement Git (Master → Dev)** :
   - Fusionne `master` (contenant le commit de la release stable) vers `dev` afin de s'assurer que la branche de développement reste synchronisée et conserve l'historique propre.

---

## 3. Flux Global CI/CD

```
Développeur (local)
    │
    │  git commit -m "feat(chat): add emoji reactions"
    │  git push origin dev
    ▼
GitHub (branche dev)
    │
    ├── ci.yml (sur push)
    │   ├── tests Vitest (243 tests) ✅
    │   └── semantic-release (uniquement sur dev) → Tag v1.5.0-dev.1, Changelog
    │
    ▼ (Quotidiennement à 2h00 UTC ou déclenchement manuel)
sync-release-deploy.yml
    │
    ├── 1. Merge dev → master
    ├── 2. tests Vitest (sur master) ✅
    ├── 3. semantic-release (sur master) → Tag v1.5.0 (Release stable)
    ├── 4. docker build & push → ghcr.io/maxnumerique/velo-repar-lyon:latest
    ├── 5. SCP → .env + docker-compose.prod.yml → VPS
    ├── 6. SSH → docker compose pull && up -d --force-recreate
    └── 7. Merge master (release commit) → dev
                    │
                    ▼
           VPS Production
           ├── velo-repar-db (PostgreSQL + PostGIS)
           └── velo-repar-app (Next.js :3000, gère migrations + seed au démarrage) ✅ LIVE
```

---

## 4. Secrets GitHub Requis

| Secret | Usage |
|---|---|
| `SYNC_TOKEN` | Token GitHub avec droits d'écriture pour semantic-release et git push |
| `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY` | Paramètres de connexion SSH au VPS |
| `DATABASE_URL` | URL PostgreSQL production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |
| `CLERK_SECRET_KEY` | Clé secrète Clerk |
| `NEXT_PUBLIC_MAPTILER_KEY` | Clé MapTiler |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Identifiants API Cloudinary serveur |
| `NEXT_PUBLIC_GOOGLE_MAPS_API` | Clé Google Maps |
| `GOOGLE_EMAIL` / `PASSWORD_APP` | Informations SMTP Gmail pour l'envoi d'emails |
| `PUSHER_APP_ID` / `PUSHER_SECRET` | API Pusher serveur |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | Configuration Pusher client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID Web Push |
| `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Clé privée et email pour VAPID Web Push |
| `BIKE_INDEX_APP_ID` / `BIKE_INDEX_SECRET` | Configuration client API Bike Index |
