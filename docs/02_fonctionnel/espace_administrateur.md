# Espace Administrateur — Fonctionnalités & Back-Office

L'espace administrateur est accessible uniquement aux utilisateurs avec le rôle `ADMIN`. Il permet la supervision complète de l'activité et la configuration de tous les paramètres métier de l'application.

> **Redirection automatique :** Si un administrateur tente d'accéder à `/interventions` (espace technicien), il est automatiquement redirigé vers `/admin/interventions` par le middleware Next.js.

---

## 1. Tableau de Bord des Interventions

**Route :** `/admin/interventions`

### Comportement

- Liste toutes les interventions **de tous les techniciens** avec filtres par statut, technicien assigné et date.
- Chaque ligne affiche : client, technicien, adresse, créneau, statut, forfait.
- Actions disponibles sur chaque intervention : **voir le détail**, **modifier**, **supprimer**.
- Possibilité de **créer manuellement** une nouvelle intervention (sans passer par le wizard client).

---

## 2. Création & Modification d'Intervention (Admin)

**Routes :** `/admin/interventions/new` et `/admin/interventions/[id]`  
**Composants :** `BikeServiceForm`, `ClientInformationForm`, `InterventionScheduler`

### Comportement

Le formulaire admin reprend les mêmes sections que le wizard client, mais dans une interface de back-office unifiée (sans stepper) :

- **`BikeServiceForm`** : Marque, modèle, type de vélo, forfait et produits additionnels.
- **`ClientInformationForm`** : Nom, prénom, email, téléphone du client.
- **`InterventionScheduler`** : Sélecteur de date/heure avec calcul de disponibilité par technicien. L'administrateur peut forcer l'assignation à un technicien spécifique.

---

## 3. Gestion des Utilisateurs

**Route :** `/admin/users`  
**Composant :** `UserCard`

### Comportement

- Annuaire de tous les comptes (Admins, Techniciens, Clients).
- Modification du rôle d'un utilisateur.
- Blocage / déblocage d'un compte (`isBlocked`).
- Affichage des informations de profil, secteurs affectés (pour techniciens) et historique d'interventions.

---

## 4. Gestion des Zones Géographiques (Secteurs)

**Route :** `/admin/sectors`  
**Technologie :** MapLibre GL + Mapbox Draw

### Comportement

- Affichage d'une carte interactive de la métropole lyonnaise.
- L'administrateur peut **dessiner des polygones** directement sur la carte (`@mapbox/mapbox-gl-draw`) pour définir les zones d'intervention.
- Chaque secteur peut être nommé et coloré.
- Les techniciens sont **affectés à un ou plusieurs secteurs** via un sélecteur multi-choix.
- Les polygones sont stockés en base de données au format **GeoJSON geometry** via l'extension PostGIS.

---

## 5. Catalogue des Forfaits (`ServicePackage`)

**Route :** `/admin/services`

### Comportement

- Liste des forfaits d'entretien disponibles à la réservation.
- Création / modification d'un forfait : **titre**, **description**, **prix** (€), **durée** (minutes), **image** (Cloudinary).
- La durée (`duration_min`) est critique : elle détermine la durée du créneau bloqué dans le planning du technicien.
- Exemples de forfaits : Crevaison (30 min), Révision complète (90 min), Entretien freins (45 min).

---

## 6. Catalogue des Produits

**Route :** `/admin/products`  
**Composant :** `ProductForm`

### Comportement

- Liste de tous les produits/accessoires disponibles à l'ajout lors d'une réservation.
- Chaque produit : **nom**, **description**, **prix unitaire**, **catégorie**, **image**, **statut actif/inactif**.
- Un produit inactif (`isActive: false`) n'apparaît plus dans le wizard de réservation client.

---

## 7. Planning Global par Technicien

**Route :** `/admin/planning`

### Comportement

- Vue calendrier montrant l'ensemble des interventions planifiées, organisées par technicien.
- Permet d'identifier rapidement les techniciens surchargés ou les créneaux libres.

---

## 8. Récapitulatif des Routes Admin

| Route | Description |
|---|---|
| `/admin/interventions` | Liste de toutes les interventions |
| `/admin/interventions/new` | Créer une intervention manuellement |
| `/admin/interventions/[id]` | Voir / modifier une intervention |
| `/admin/users` | Gestion des comptes utilisateurs |
| `/admin/sectors` | Carte et gestion des zones géographiques |
| `/admin/services` | Catalogue des forfaits |
| `/admin/products` | Catalogue des produits additionnels |
| `/admin/planning` | Planning global par technicien |
