# Glossaire — HomeCycl'Home

Définitions des termes métier et techniques utilisés dans la documentation et le code.

---

## Termes Métier

### Intervention
Désigne l'ensemble du cycle de vie d'une prestation de réparation ou d'entretien à domicile, depuis la **réservation client** jusqu'à la **clôture par le technicien**. Correspond au modèle `RepairRequest` en base de données.

### Forfait (ServicePackage)
Prestation prédéfinie proposée au client lors de sa réservation (ex: "Révision complète", "Crevaison"). Chaque forfait a un prix fixe et une durée estimée en minutes (`duration_min`) qui impacte la disponibilité du technicien.

### Créneau
Plage horaire disponible pour planifier une intervention. Les créneaux disponibles sont calculés dynamiquement en fonction des interventions déjà planifiées du technicien du secteur concerné.

### Secteur
Zone géographique définie par un **polygone** (dessiné sur une carte) couvrant une partie de la métropole lyonnaise. Chaque technicien est affecté à un ou plusieurs secteurs. La couverture d'une adresse est vérifiée via une requête spatiale PostGIS.

### Tournée
Ensemble des interventions assignées à un technicien pour une journée donnée, organisées chronologiquement et visualisables sur une carte.

### VAE
Vélo à Assistance Électrique. Type de vélo supporté par l'application, avec les mêmes options de forfait qu'un vélo classique.

### VTC
Vélo Tout Chemin. Type de vélo polyvalent (entre VTT et vélo de ville).

### Pièce jointe / Photo de clôture
Photo prise par le technicien à la fin de l'intervention pour documenter le travail réalisé. Stockée sur Cloudinary et consultable par le client et l'administrateur.

### Validation face-à-face
Le paiement de la prestation est réalisé **directement sur place** entre le technicien et le client, à la fin de l'intervention. Aucun paiement en ligne n'est traité par l'application.

---

## Termes Techniques

### App Router
Architecture de routage de Next.js (depuis la version 13) basée sur le système de fichiers du dossier `app/`. Permet de définir des layouts imbriqués, des Server Components et des routes API au même endroit.

### Conventional Commits
Convention de formatage des messages de commit Git (`type(scope): description`). Utilisée dans ce projet pour automatiser le versionnement sémantique via `semantic-release`.

### CUID
*Collision-resistant Unique Identifier* — Identifiant unique généré par Prisma pour chaque enregistrement en base de données (préfixe `clx...`). Alternative au UUID, optimisé pour les performances d'index.

### Feature-Driven Development (FDD)
Approche d'organisation du code par **domaine fonctionnel** plutôt que par type de fichier. Dans ce projet, chaque dossier de `src/features/` regroupe tous les éléments (composants, hooks, services) d'un même domaine métier.

### GeoJSON
Format de données ouvert pour représenter des structures géographiques (points, polygones, lignes) en JSON. Utilisé par Mapbox GL Draw pour exporter les zones dessinées sur la carte, avant insertion en base PostGIS.

### GIST Index
Type d'index PostgreSQL adapté aux données spatiales (géométries). Utilisé sur le champ `boundary` de la table `Sector` pour accélérer les requêtes `ST_Contains` en O(log n).

### jsdom
Implémentation JavaScript du DOM (Document Object Model) du navigateur. Utilisé par Vitest comme environnement d'exécution pour les tests de composants React, sans avoir besoin d'un vrai navigateur.

### PostGIS
Extension de PostgreSQL ajoutant le support des types de données géographiques et des fonctions spatiales (`ST_Contains`, `ST_Point`, `ST_SetSRID`). Indispensable pour la logique de couverture géographique par secteur.

### Prisma ORM
*Object-Relational Mapper* — couche d'abstraction entre le code JavaScript et la base de données PostgreSQL. Permet d'écrire des requêtes typées en JavaScript et gère automatiquement les migrations de schéma.

### SemVer (Semantic Versioning)
Convention de versionnement `MAJOR.MINOR.PATCH` (ex: `1.4.2`). Dans ce projet, la version est gérée automatiquement par `semantic-release` selon les types de commits.

### Server Component (RSC)
Composant React qui s'exécute **uniquement sur le serveur** (pas de JavaScript envoyé au navigateur). Utilisé dans Next.js App Router pour les pages sans interactivité côté client.

### Singleton Prisma
Instance unique du `PrismaClient` partagée dans toute l'application (`src/db/prisma.js`). Évite la création de multiples connexions à la base de données en mode développement (hot reload).

### VAPID
*Voluntary Application Server Identification* — Standard cryptographique pour authentifier un serveur lors de l'envoi de notifications Web Push. Nécessite une paire de clés publique/privée générée une fois pour toutes.

### Webhook
Requête HTTP envoyée automatiquement par un service tiers (ici Clerk) vers un endpoint de notre application (`/api/webhooks/clerk`) lorsqu'un événement précis se produit (ex: création d'un nouveau compte utilisateur).

### WGS84 (SRID 4326)
Système de référence de coordonnées géographiques GPS mondial (latitude/longitude). Utilisé dans les requêtes PostGIS (`ST_SetSRID(..., 4326)`) pour s'assurer que les coordonnées GPS des clients sont interprétées dans le bon référentiel.
