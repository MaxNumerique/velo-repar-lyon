# Documentation — HomeCycl'Home (Vélo du Pelo)

Bienvenue dans la documentation complète du projet **HomeCycl'Home**, une application web de réparation et d'entretien de vélos à domicile.

## Structure de la documentation

```
docs/
├── README.md                           ← Ce fichier (index)
│
├── 01_contexte/
│   └── presentation_projet.md          ← Contexte métier, acteurs, objectifs
│
├── 02_fonctionnel/
│   ├── cahier_des_charges.md           ← Fonctionnalités requises & règles métier
│   ├── parcours_client.md              ← Parcours détaillé du client (réservation)
│   ├── espace_technicien.md            ← Fonctionnalités technicien (tournées, clôture)
│   └── espace_administrateur.md        ← Fonctionnalités admin (back-office)
│
├── 03_technique/
│   ├── stack_technologique.md          ← Outils, frameworks, services tiers
│   ├── architecture_projet.md          ← Structure des dossiers source
│   ├── base_de_donnees.md             ← Modèle de données Prisma / PostgreSQL
│   └── api_routes.md                  ← Référence des routes API (Next.js)
│
├── 04_securite_et_acces/
│   └── authentification_et_roles.md   ← Clerk, rôles, middleware, protections
│
├── 05_devops/
│   ├── environnement_local.md          ← Installation et lancement en local
│   ├── deploiement.md                 ← Déploiement Docker / VPS / CI-CD
│   └── ci_cd.md                       ← Pipelines GitHub Actions
│
├── 06_qualite/
│   └── tests.md                        ← Stratégie de tests, Vitest, couverture
│
└── 07_glossaire/
    └── glossaire.md                    ← Définitions métier et termes techniques
```

> **💡 Tip :** Tous les documents contiennent des **liens cliquables** (`file://`) pointant directement vers les fichiers source correspondants du projet. Ouvrez ces documents dans VS Code pour une navigation interactive.

## Navigation rapide

| Document | Description |
|---|---|
| [Présentation du projet](./01_contexte/presentation_projet.md) | Contexte, acteurs, besoins |
| [Cahier des charges](./02_fonctionnel/cahier_des_charges.md) | Fonctionnalités & règles métier |
| [Parcours client](./02_fonctionnel/parcours_client.md) | Le wizard de réservation en 5 étapes |
| [Espace technicien](./02_fonctionnel/espace_technicien.md) | Tournées, chat, clôture d'intervention |
| [Espace administrateur](./02_fonctionnel/espace_administrateur.md) | Supervision, planification, catalogues |
| [Stack technologique](./03_technique/stack_technologique.md) | Tous les outils utilisés |
| [Architecture projet](./03_technique/architecture_projet.md) | Structure des dossiers sources |
| [Base de données](./03_technique/base_de_donnees.md) | Schéma Prisma & modèles de données |
| [Routes API](./03_technique/api_routes.md) | Référence complète des endpoints |
| [Authentification & rôles](./04_securite_et_acces/authentification_et_roles.md) | Clerk, middleware, accès par rôle |
| [Environnement local](./05_devops/environnement_local.md) | Installation & démarrage en développement |
| [Déploiement](./05_devops/deploiement.md) | Docker, VPS, production |
| [CI/CD](./05_devops/ci_cd.md) | Pipelines GitHub Actions |
| [Tests](./06_qualite/tests.md) | Stratégie, Vitest, couverture |
| [Glossaire](./07_glossaire/glossaire.md) | Termes métier et techniques |
