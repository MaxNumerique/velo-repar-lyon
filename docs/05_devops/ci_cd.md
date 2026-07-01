# Pipelines CI/CD — GitHub Actions

L'application utilise trois pipelines GitHub Actions distincts, chacun avec une responsabilité claire.

**Dossier :** [.github/workflows/](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows)

---

## 1. Pipeline CI & Release (`ci.yml`)

**Fichier :** [ci.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows/ci.yml)

**Déclencheurs :**
- `push` sur les branches `master` et `dev`
- `pull_request` vers `dev`

Ce pipeline est composé de trois jobs qui s'enchaînent :

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
  chore(release): bump version to 1.5.0
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

**Condition de succès :** 100% des tests passent (246 tests, 45 fichiers).

### Job 3 : `release` — Release Sémantique Automatique

**Ne s'exécute que** sur `push` (pas sur les PR). **Dépend du succès du job `test`**.  
**Configuration :** [.releaserc.json](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.releaserc.json)

Utilise `semantic-release` pour :
1. Analyser les commits depuis la dernière release.
2. Déterminer le type de version (patch/minor/major) selon les types de commits.
3. Mettre à jour [package.json](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/package.json) avec le nouveau numéro de version.
4. Créer un tag Git et une GitHub Release avec le changelog généré automatiquement.

**Table de correspondance commits → version :**

| Type de commit | Bump de version |
|---|---|
| `fix:` | Patch (1.0.0 → 1.0.1) |
| `feat:` | Minor (1.0.0 → 1.1.0) |
| `feat!:` ou `BREAKING CHANGE` | Major (1.0.0 → 2.0.0) |
| `chore:`, `docs:`, `style:` | Aucun bump |

---

## 2. Pipeline Build & Déploiement (`deploy-master.yml`)

**Fichier :** [deploy-master.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows/deploy-master.yml)

**Déclencheurs :**
- `push` sur `master`
- `schedule` : tous les jours à 2h du matin UTC
- `workflow_dispatch` : déclenchement manuel depuis GitHub Actions

**Protection anti-boucle :** Le pipeline ne s'exécute pas si le commit est un commit de release `semantic-release` (qui commence par `chore(release):`).

### Étapes du pipeline

**1. Build et Push de l'image Docker**

Utilise le [Dockerfile](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/Dockerfile) multi-stage. Les variables `NEXT_PUBLIC_*` sont injectées en `--build-arg` car Next.js les embarque dans le bundle JS à la compilation.

```bash
docker build --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... --tag ghcr.io/maxnumerique/velo-repar-lyon:latest .
docker push ghcr.io/maxnumerique/velo-repar-lyon:latest
```

**2. Génération du `.env` et déploiement SSH**

Un fichier `.env` est généré depuis les GitHub Secrets et copié sur le VPS. Le `DATABASE_URL` est modifié pour remplacer `@localhost` par `@db` (nom du service dans [docker-compose.prod.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/docker-compose.prod.yml)).

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans
docker image prune -f
```

---

## 3. Pipeline Sync Dev → Master (`sync-dev-to-master.yml`)

**Fichier :** [sync-dev-to-master.yml](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/.github/workflows/sync-dev-to-master.yml)

**Déclencheur :** `push` sur `dev`

Fusionne automatiquement les changements de `dev` vers `master`, déclenchant ensuite le pipeline de déploiement.

---

## 4. Flux Global CI/CD

```
Developer (local)
    │
    │  git commit -m "feat(chat): add emoji reactions"
    │  git push origin dev
    ▼
GitHub (branche dev)
    │
    ├── ci.yml
    │   ├── commitlint ✅
    │   ├── tests Vitest (246 tests) ✅
    │   └── semantic-release → Tag v1.5.0, Changelog
    │
    ├── sync-dev-to-master.yml → Merge dev → master
    │
    └── deploy-master.yml
        ├── docker build → ghcr.io/maxnumerique/velo-repar-lyon:latest
        ├── SCP → .env + docker-compose.prod.yml → VPS
        └── SSH → docker compose pull && up -d --force-recreate
                        │
                        ▼
               VPS Production
               ├── velo-repar-migrator (prisma db push)
               ├── velo-repar-db (PostgreSQL + PostGIS)
               └── velo-repar-app (Next.js :3000) ✅ LIVE
```

---

## 5. Secrets GitHub Requis

| Secret | Usage |
|---|---|
| `SYNC_TOKEN` | Token GitHub pour semantic-release |
| `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY` | Connexion SSH au VPS |
| `DATABASE_URL` | URL PostgreSQL production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |
| `CLERK_SECRET_KEY` | Clé secrète Clerk |
| `NEXT_PUBLIC_MAPTILER_KEY` | Clé MapTiler |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary serveur |
| `NEXT_PUBLIC_GOOGLE_MAPS_API` | Clé Google Maps |
| `GOOGLE_EMAIL` / `PASSWORD_APP` | Compte Gmail SMTP |
| `PUSHER_APP_ID` / `PUSHER_SECRET` | Pusher serveur |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push clé publique |
| `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Web Push clé privée |
| `BIKE_INDEX_APP_ID` / `BIKE_INDEX_SECRET` | Bike Index API |
