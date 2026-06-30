# Pipelines CI/CD — GitHub Actions

L'application utilise trois pipelines GitHub Actions distincts, chacun avec une responsabilité claire.

---

## 1. Pipeline CI & Release (`ci.yml`)

**Déclencheurs :**
- `push` sur les branches `master` et `dev`
- `pull_request` vers `dev`

Ce pipeline est composé de trois jobs qui s'enchaînent :

### Job 1 : `commitlint` — Vérification des Commits Sémantiques

**Ne s'exécute que** sur les Pull Requests vers `dev`.

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

Utilise `semantic-release` pour :
1. Analyser les commits depuis la dernière release.
2. Déterminer le type de version (patch/minor/major) selon les types de commits.
3. Mettre à jour `package.json` avec le nouveau numéro de version.
4. Créer un tag Git et une GitHub Release avec le changelog généré automatiquement.
5. Committer le changement de version (commit de type `chore(release): ...`).

**Table de correspondance commits → version :**

| Type de commit | Bump de version |
|---|---|
| `fix:` | Patch (1.0.0 → 1.0.1) |
| `feat:` | Minor (1.0.0 → 1.1.0) |
| `feat!:` ou `BREAKING CHANGE` | Major (1.0.0 → 2.0.0) |
| `chore:`, `docs:`, `style:` | Aucun bump |

---

## 2. Pipeline Build & Déploiement (`deploy-master.yml`)

**Déclencheurs :**
- `push` sur `master` (déploiement automatique après chaque release)
- `schedule` : tous les jours à 2h du matin UTC (déploiement quotidien de routine)
- `workflow_dispatch` : déclenchement manuel depuis l'onglet GitHub Actions

**Protection anti-boucle :** Le pipeline ne s'exécute pas si le commit qui le déclenche est un commit de release `semantic-release` (qui commence par `chore(release):`). Cela évite les boucles infinies.

### Étapes du pipeline

**1. Connexion au GitHub Container Registry (GHCR)**

```bash
docker login ghcr.io --username ${{ github.actor }} --password ${{ secrets.GITHUB_TOKEN }}
```

**2. Build et Push de l'image Docker**

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... \
  --build-arg NEXT_PUBLIC_MAPTILER_KEY=... \
  # ... autres variables publiques
  --tag ghcr.io/maxnumerique/velo-repar-lyon:latest \
  .

docker push ghcr.io/maxnumerique/velo-repar-lyon:latest
```

Les variables `NEXT_PUBLIC_*` sont injectées ici car Next.js les embarque dans le bundle JS à la compilation.

**3. Génération du fichier `.env` sur l'agent CI**

Un fichier `.env` est généré avec toutes les variables serveur (secrètes) depuis les GitHub Secrets.

> **Note :** Le `DATABASE_URL` est modifié pour remplacer `@localhost` par `@db` (nom du service Docker dans docker-compose.prod.yml).

**4. Copie des fichiers de configuration vers le VPS (SCP)**

```bash
# Copie docker-compose.prod.yml et .env vers le VPS via SSH
scp docker-compose.prod.yml .env user@vps:/home/maxnumerique/apps/NodeApp/
```

**5. Déploiement sur le VPS (SSH)**

```bash
ssh user@vps "
  cd /home/maxnumerique/apps/NodeApp
  docker login ghcr.io --password-stdin
  docker compose -f docker-compose.prod.yml pull          # Télécharge la nouvelle image
  docker compose -f docker-compose.prod.yml up -d \
    --force-recreate --remove-orphans                      # Recrée les conteneurs
  docker image prune -f                                    # Nettoie les anciennes images
"
```

---

## 3. Pipeline Sync Dev → Master (`sync-dev-to-master.yml`)

**Déclencheur :** `push` sur `dev`

Ce pipeline fusionne automatiquement les changements de `dev` vers `master` via un Pull Request ou un merge direct, déclenchant ensuite le pipeline de déploiement.

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
    ├── Pipeline CI (ci.yml)
    │   ├── commitlint ✅
    │   ├── tests Vitest (246 tests) ✅
    │   └── semantic-release → Tag v1.5.0, Changelog
    │
    ├── sync-dev-to-master.yml
    │   └── Merge dev → master
    │
    └── deploy-master.yml (déclenché par push sur master)
        ├── docker build (image Next.js multi-stage)
        ├── docker push → ghcr.io/maxnumerique/velo-repar-lyon:latest
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

Les secrets suivants doivent être configurés dans **Settings → Secrets and variables → Actions** du dépôt GitHub :

| Secret | Usage |
|---|---|
| `SYNC_TOKEN` | Token GitHub pour semantic-release (push de commits) |
| `VPS_HOST` | Adresse IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH du VPS |
| `VPS_SSH_KEY` | Clé privée SSH pour la connexion au VPS |
| `DATABASE_URL` | URL complète de connexion PostgreSQL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |
| `CLERK_SECRET_KEY` | Clé secrète Clerk |
| `NEXT_PUBLIC_MAPTILER_KEY` | Clé MapTiler |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |
| `NEXT_PUBLIC_GOOGLE_MAPS_API` | Clé API Google Maps |
| `GOOGLE_EMAIL` / `PASSWORD_APP` | Compte Gmail SMTP |
| `PUSHER_APP_ID` / `PUSHER_SECRET` | Credentials Pusher serveur |
| `NEXT_PUBLIC_PUSHER_KEY` / `CLUSTER` | Credentials Pusher client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé VAPID publique (Web Push) |
| `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Clé VAPID privée + email |
| `BIKE_INDEX_APP_ID` / `BIKE_INDEX_SECRET` | Credentials Bike Index API |
