# Parcours Client — Le Wizard de Réservation

Le parcours de réservation est le cœur de l'application côté client. Il se déroule en **5 étapes progressives** (stepper), accessibles sans être connecté. La création de compte n'est proposée qu'à la validation finale.

**Point d'entrée :** Route `/repair` → [page.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/(dashboard)/repair/page.jsx)  
**Orchestrateur du stepper :** [RepairStepper.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/RepairStepper.jsx)  
**Contexte partagé entre les étapes :** [context/](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/context)

---

## Étape 1 — Informations sur le vélo

**Composant :** [StepBikeType.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepBikeType.jsx)

**Objectif :** Identifier le vélo à réparer.

### Comportement

- Le client peut **rechercher son vélo** par marque ou modèle via l'**API Bike Index** (base de données publique de bicyclettes). Les résultats s'affichent en autocomplétion.
- Si le modèle est trouvé via Bike Index, les champs Marque, Modèle et Image sont pré-remplis automatiquement.
- Si le client est **déjà connecté** et possède des vélos enregistrés dans son compte, il peut en **sélectionner un directement** depuis une liste.
- Le client sélectionne le **type de vélo** parmi les valeurs définies dans [constants.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/constants.js) : `VTT`, `VTC`, `VAE`, `Route`, `Ville`.
- Le client peut ajouter des **photos du vélo** et/ou des **photos illustrant la panne** (téléversement direct sur Cloudinary via [cloudinaryClient.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/cloudinaryClient.js)).

### Données collectées

| Champ | Source | Stockage |
|---|---|---|
| Marque (`bikeBrand`) | Saisie libre ou Bike Index | `bikeDetails` (JSON) |
| Modèle (`bikeModel`) | Saisie libre ou Bike Index | `bikeDetails` (JSON) |
| Type (`bikeType`) | Liste déroulante | `bikeDetails` (JSON) |
| ID Bike Index (`bikeIndexId`) | Bike Index API | `RepairRequest.bikeIndexId` |
| Photos vélo | Cloudinary | `RepairRequest.bikePhotos[]` |
| Photos panne | Cloudinary | `RepairRequest.issuePhotos[]` |

---

## Étape 2a — Sélection du forfait

**Composant :** [StepServices.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepServices.jsx)  
**API :** `GET /api/services-public` → [route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/services-public/route.js)

**Objectif :** Choisir la prestation d'entretien ou de réparation.

### Comportement

- La liste des forfaits disponibles est chargée depuis l'API publique `/api/services-public`.
- Chaque forfait affiche : **titre**, **description**, **prix** et **durée estimée**.
- La sélection d'un forfait est obligatoire pour continuer.
- La durée du forfait (`duration_min`) est utilisée ensuite pour calculer les créneaux horaires disponibles.

---

## Étape 2b — Produits additionnels

**Composant :** [StepProducts.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepProducts.jsx)  
**API :** `GET /api/products-public` → [route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/products-public/route.js)

**Objectif :** Ajouter des pièces détachées ou accessoires à la commande.

### Comportement

- Activé via un bouton bascule `"Ajouter des produits"`.
- La liste des produits actifs est chargée depuis l'API publique `/api/products-public`.
- Le client peut ajuster la **quantité** de chaque produit sélectionné.
- Le sous-total des produits s'affiche dynamiquement dans le panneau de récapitulatif latéral ([RepairSummarySide.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/RepairSummarySide.jsx)).

---

## Étape 3 — Coordonnées client

**Composant :** [StepUserInfo.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepUserInfo.jsx)  
**API :** `GET /api/availability?address=` → [route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/availability/route.js)  
**Géocodage :** [googleMaps.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/googleMaps.js)

**Objectif :** Identifier le client et valider son adresse d'intervention.

### Comportement

- Si le client est **connecté** : prénom, nom, email et téléphone sont **pré-remplis** depuis son profil Clerk.
- L'**adresse** est saisie via un champ d'**autocomplétion Google Maps** (`AddressAutocomplete`). L'adresse est géocodée en temps réel ; seules les adresses reconnues par l'API Google Maps sont acceptées.
- L'API interne `/api/availability?address=...` est appelée pour vérifier que l'adresse est couverte par un secteur actif (requête PostGIS `ST_Contains`).

---

## Étape 4 — Choix du créneau

**Composant :** [StepScheduling.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepScheduling.jsx)

**Objectif :** Sélectionner le jour et l'heure de l'intervention.

### Comportement

- Un **calendrier** (`react-day-picker`) permet de sélectionner une date à partir du lendemain.
- Les **créneaux horaires disponibles** (`9h`, `10h`, `11h`, `14h`, `15h`, `16h`, `17h`, `18h`) sont filtrés en temps réel :
  - Les créneaux **déjà réservés** par d'autres clients pour ce secteur sont masqués.
  - Les créneaux **dans le passé** (y compris le jour en cours) sont désactivés.
- La sélection d'un créneau est obligatoire pour continuer.

---

## Étape 5 — Validation & Confirmation

**Composant :** [StepValidation.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/StepValidation.jsx)  
**API :** `POST /api/repair-request` → [route.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/app/api/repair-request/route.js)  
**Email :** [mail.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/mail.js)  
**Push :** [webPush.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/webPush.js)

**Objectif :** Récapituler la commande et soumettre la demande.

### Comportement

- Affichage d'un récapitulatif complet : vélo, forfait, produits, adresse, date et heure, coût total estimé.
- Si le client est **non connecté** : invitation à créer un compte Clerk (le formulaire Clerk s'ouvre dans une modale).
- Clic sur "Confirmer ma réservation" :
  1. Envoi d'une requête `POST /api/repair-request` avec toutes les données collectées.
  2. Attribution automatique du technicien par le back-end.
  3. Envoi d'un **email de confirmation** au client (Nodemailer via [mail.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/mail.js)).
  4. Envoi d'une **notification Web Push** au technicien assigné (via [webPush.js](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/lib/webPush.js)).
  5. Redirection vers la page de confirmation.

---

## Récapitulatif latéral

**Composant :** [RepairSummarySide.jsx](file:///home/maximilien/Projets/CDA_IA/velo-repar-lyon/src/features/interventions/booking/components/RepairSummarySide.jsx)

Tout au long du stepper, un panneau de droite (masqué sur mobile) affiche un résumé mis à jour en temps réel :

- Le forfait sélectionné et son prix.
- La liste des produits et leurs quantités.
- Le **total estimé** (forfait + produits).
- L'adresse et le créneau choisis.

---

## Résumé du flux de données

```
Client (UI)
    │
    ├── GET /api/services-public       → Liste des forfaits
    ├── GET /api/products-public       → Liste des produits
    ├── GET /api/availability?address= → Secteur + techniciens disponibles
    │
    └── POST /api/repair-request       → Création de la demande
            │
            ├── Attribution technicien (back-end)
            ├── Email de confirmation (Nodemailer)
            └── Notification push technicien (Web Push)
```
