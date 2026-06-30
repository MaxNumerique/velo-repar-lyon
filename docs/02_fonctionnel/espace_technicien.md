# Espace Technicien — Fonctionnalités & Parcours

L'espace technicien est optimisé pour une utilisation **sur smartphone sur le terrain**. Il est accessible uniquement aux utilisateurs avec le rôle `TECHNICIAN`.

---

## 1. Tableau de bord — Interventions du jour

**Route :** `/interventions`  
**Composant :** `InterventionsDashboard`

### Comportement

Le tableau de bord regroupe les interventions du technicien en **trois onglets temporels** :

| Onglet | Contenu |
|---|---|
| **Aujourd'hui** | Interventions planifiées pour la date du jour, triées chronologiquement |
| **À venir** | Interventions des jours suivants |
| **Passées** | Historique des interventions terminées ou annulées |

Chaque intervention est affichée sous forme de **carte (`InterventionCard`)** incluant :
- Heure du créneau
- Nom du client et téléphone (raccourci d'appel direct)
- Adresse de l'intervention
- Type de vélo et forfait sélectionné
- Statut actuel (badge coloré)
- Boutons d'action rapide (changement de statut)

---

## 2. Carte de tournée

**Route :** `/map`  
**Technologie :** MapLibre GL + MapTiler

### Comportement

- Affiche les **points d'intervention du jour** sur une carte interactive.
- Chaque marqueur est cliquable pour ouvrir le détail de l'intervention.
- Permet au technicien de **visualiser son itinéraire** et d'anticiper les déplacements.

---

## 3. Fiche Détail d'une Intervention

**Route :** `/interventions/[id]`  
**Composants :** `InterventionDetails`, `InterventionInfo`, `BikeServiceInfo`, `ClientInfo`, `PhotoGallery`

### Informations affichées

**Section Client :**
- Nom complet, email, téléphone (cliquable pour appel)

**Section Vélo & Prestation :**
- Marque, modèle, type du vélo
- Forfait sélectionné + durée estimée
- Produits additionnels commandés avec quantités
- Photos initiales déposées par le client (vélo et panne)

**Section Historique :**
- Statut actuel + horodatage des changements
- Commentaires ajoutés par le technicien

**Section Photos de clôture :**
- Galerie des photos prises en fin d'intervention (`PhotoGallery`)

---

## 4. Chat — Messagerie Instantanée

**Route :** `/messages` (liste des conversations) et `/interventions/[id]` (onglet chat)  
**Technologie :** Pusher (WebSockets)  
**Composants :** `ChatLayout`, `ChatWindow`, `ChatInput`, `MessageBubble`, `ConversationList`

### Comportement

- Chaque intervention dispose d'un **canal de messagerie dédié**.
- Les messages sont transmis en temps réel via **Pusher Channels** (protocole WebSocket).
- Le technicien et le client voient les **statuts de lecture** (`isRead`) des messages.
- Le technicien peut envoyer des **photos en pièce jointe** directement depuis le chat.
- Les messages peuvent être **modifiés** (`isEdited`) ou **supprimés** (`isDeleted`).
- Le chat supporte les **réactions emoji** sur chaque message (`reactions[]`).

---

## 5. Gestion du statut d'intervention

Le technicien peut faire progresser le statut de son intervention depuis la fiche détail ou les boutons rapides de la carte `InterventionCard`.

### Transitions autorisées pour le technicien

```
SCHEDULED ──► EN_ROUTE ──► ON_SITE ──► COMPLETED
                                   └──► CANCELLED
```

Chaque changement de statut :
1. Met à jour la base de données via `PATCH /api/interventions/[id]`.
2. Déclenche l'envoi d'une **notification Web Push au client** pour l'informer en temps réel.
3. Met à jour l'interface en direct (React state local).

---

## 6. Dépôt de photos en fin d'intervention

En clôturant une intervention, le technicien peut photographier et déposer des images du travail réalisé :

1. L'image est téléversée directement depuis le navigateur vers **Cloudinary** via le client `next-cloudinary`.
2. L'URL publique retournée par Cloudinary est sauvegardée dans `RepairRequest.bikePhotos[]`.
3. Les photos sont visibles dans la galerie de la fiche d'intervention côté admin et client.

---

## 7. Notifications Web Push

Le technicien peut s'abonner aux **notifications push navigateur** pour recevoir des alertes même quand l'application n'est pas ouverte :

- **Nouvelle intervention assignée** : dès qu'un client valide une réservation dans son secteur.
- **Nouveau message client** : dès qu'un client envoie un message dans le chat de l'une de ses interventions.

Les abonnements push sont gérés via le standard **Web Push Protocol** (clés VAPID) et stockés dans la table `PushSubscription` en base de données.
