# Cahier des Charges Fonctionnel — HomeCycl'Home

Ce document liste l'ensemble des fonctionnalités requises par le cahier des charges et les règles métier qui les gouvernent.

---

## 1. Fonctionnalités par rôle

### 1.1 Administrateur

| # | Fonctionnalité | Statut |
|---|---|---|
| F-A01 | Lister les clients et modifier leurs informations | ✅ Implémenté |
| F-A02 | Lister toutes les interventions, modifier et en ajouter | ✅ Implémenté |
| F-A03 | Afficher le planning (calendrier) par technicien | ✅ Implémenté |
| F-A04 | Afficher, modifier et ajouter des utilisateurs (tous rôles) | ✅ Implémenté |
| F-A05 | Afficher, modifier et supprimer une intervention | ✅ Implémenté |
| F-A06 | Afficher, modifier et ajouter des produits additionnels | ✅ Implémenté |
| F-A07 | Afficher, modifier et ajouter les prix des forfaits | ✅ Implémenté |
| F-A08 | Afficher, modifier et ajouter des zones géographiques | ✅ Implémenté |
| F-A09 | Gérer les informations société affichées sur l'application | 🔜 Roadmap V2 |
| F-A10 | Ajouter et modifier des modèles de planifications par zone | 🔜 Roadmap V2 |

### 1.2 Technicien

| # | Fonctionnalité | Statut |
|---|---|---|
| F-T01 | Lister les interventions passées | ✅ Implémenté |
| F-T02 | Lister les interventions de la journée | ✅ Implémenté |
| F-T03 | Lister les interventions des jours suivants | ✅ Implémenté |
| F-T04 | Afficher les détails d'une intervention | ✅ Implémenté |
| F-T05 | Afficher les détails du client dans une intervention | ✅ Implémenté |
| F-T06 | Modifier une intervention et les informations client | ✅ Implémenté |
| F-T07 | Déposer des photos dans une intervention | ✅ Implémenté (Cloudinary) |
| F-T08 | Ajouter des commentaires dans une intervention | ✅ Implémenté |
| F-T09 | Marquer une intervention comme terminée | ✅ Implémenté |
| F-T10 | Annuler une intervention | ✅ Implémenté |
| F-T11 | Échanger avec le client par messagerie instantanée | ✅ Implémenté (Pusher) |

### 1.3 Client

| # | Fonctionnalité | Statut |
|---|---|---|
| F-C01 | Créer un compte / se connecter | ✅ Implémenté (Clerk) |
| F-C02 | Réserver un créneau pour une intervention (wizard 5 étapes) | ✅ Implémenté |
| F-C03 | Lister les interventions passées et à venir | ✅ Implémenté |
| F-C04 | Annuler une intervention | ✅ Implémenté (règle des -6h) |
| F-C05 | Voir et modifier ses vélos enregistrés | ✅ Implémenté |
| F-C06 | Voir et modifier sa fiche profil | ✅ Implémenté |

---

## 2. Règles Métier

### RG-01 — Validation géographique de l'adresse

Lors de la réservation, l'adresse saisie par le client est **obligatoirement validée** par l'API Google Maps (géocodage). Les coordonnées GPS obtenues sont ensuite soumises à une requête spatiale PostGIS (`ST_Contains`) pour vérifier que l'adresse est couverte par un secteur d'intervention.

- Si **aucun secteur** ne correspond → la réservation est bloquée avec le message : `"Désolé, nous ne couvrons pas encore votre secteur."`
- Si **aucun technicien** n'est assigné au secteur → message : `"Aucun technicien n'est assigné à votre secteur pour le moment."`

### RG-02 — Attribution automatique du technicien

Le technicien est attribué automatiquement à la création de la demande d'intervention, selon les critères suivants :

1. Le technicien doit être affecté au secteur couvrant l'adresse du client.
2. Sa disponibilité est calculée en excluant ses interventions déjà planifiées à des créneaux conflictuels.
3. Le premier technicien disponible dans le secteur est sélectionné.

### RG-03 — Règle des 6 heures (modification / annulation)

Un client ne peut **modifier ou annuler** son intervention que jusqu'à **6 heures avant** le créneau prévu. En dessous de ce délai, l'interface bloque les actions de modification et affiche un badge `"Modification bloquée (-6h)"`. Cette règle protège l'organisation des tournées des techniciens.

### RG-04 — Durée d'intervention basée sur le forfait

La durée d'un créneau dépend du **forfait d'entretien** sélectionné par le client. Chaque `ServicePackage` en base de données dispose d'un champ `duration_min` (durée en minutes). Cette durée est utilisée pour calculer le créneau de fin d'intervention et éviter les conflits de planning.

### RG-05 — Paiement en face-à-face

Le règlement financier de la prestation est effectué **directement entre le technicien et le client** à la fin de l'intervention (espèces ou terminal de paiement physique). **Aucun paiement en ligne n'est traité par l'application.**

### RG-06 — Lifecycle de statut d'une intervention

Une intervention suit un cycle de vie strict avec les statuts suivants :

```
PENDING → SCHEDULED → EN_ROUTE → ON_SITE → COMPLETED
                    ↘ CANCELLED (depuis n'importe quel état actif)
```

| Statut | Libellé | Acteur |
|---|---|---|
| `PENDING` | En attente | Système (création client) |
| `SCHEDULED` | Programmé | Système (attribution technicien) |
| `EN_ROUTE` | En route | Technicien |
| `ON_SITE` | Sur place | Technicien |
| `COMPLETED` | Terminé | Technicien |
| `CANCELLED` | Annulé | Client (avant -6h) ou Admin |
