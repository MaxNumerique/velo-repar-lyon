# Authentification & Contrôle d'Accès par Rôle

L'application délègue l'intégralité de la gestion des identités à **Clerk**, un service d'authentification SaaS. Le contrôle d'accès est ensuite assuré par un proxy middleware Next.js et des wrappers HOC côté serveur dans les routes API (`withAuth`, `withAdmin`, `withTechnician`).

---

## 1. Clerk — Gestion des Identités

### Fonctionnement

Clerk gère :
- **L'inscription** (email + mot de passe, ou OAuth Google).
- **La connexion** et la gestion de session (tokens JWT).
- **La réinitialisation de mot de passe**.
- **Les métadonnées utilisateur** : le rôle (`role`) est stocké dans `publicMetadata.role` du compte Clerk.

### Synchronisation avec PostgreSQL (`userSync.js` & Webhook)

À la création d'un nouveau compte Clerk ou lors de la première requête authentifiée, la synchronisation est assurée :
1. **Webhook Clerk (`/api/webhooks/clerk`)** : Déclenché automatiquement par Clerk lors de la création d'un nouveau compte.
2. **Synchronisation à la volée (`src/db/userSync.js`)** : La fonction `upsertUser` garantit que tout utilisateur Clerk existe dans la table `User` de PostgreSQL locale et que son rôle `publicMetadata.role` correspond exactement au rôle DB.

---

## 2. Les Trois Rôles

| Rôle | Valeur en DB (`Role`) | Métadonnée Clerk (`publicMetadata.role`) |
|---|---|---|
| Client | `CLIENT` | `"CLIENT"` (défaut) |
| Technicien | `TECHNICIAN` | `"TECHNICIAN"` |
| Administrateur | `ADMIN` | `"ADMIN"` |

Le rôle est la **source de vérité** pour toutes les décisions d'accès. Il est lu depuis les métadonnées Clerk à chaque requête et comparé aux règles définies dans le middleware et les wrappers HOC.

---

## 3. Proxy Next.js — `src/proxy.js`

Le middleware intercepte **toutes les requêtes** (pages et API) avant qu'elles n'atteignent les handlers Next.js.

### Logique de redirection par rôle

```javascript
// Si un ADMIN tente d'accéder à /interventions (espace technicien)
// → Redirection automatique vers /admin/interventions
if (isInterventionsRoute(req) && role === 'ADMIN') {
  return NextResponse.redirect(new URL('/admin/interventions', req.url));
}

// Si un non-ADMIN tente d'accéder à /admin/*
// → Redirection vers /interventions
if (isAdminRoute(req) && role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/interventions', req.url));
}
```

---

## 4. Encapsulation des Routes API (`src/lib/auth.js`)

Pour éviter la duplication de logique d'authentification et respecter la règle **Fail Fast**, toutes les routes API sont encapsulées via des wrappers d'ordre supérieur :

- `withAuth(handler)` : Garantit qu'un utilisateur est authentifié et résolu en DB.
- `withAdmin(handler)` : Exige un utilisateur avec le rôle `ADMIN` (retourne `403 Forbidden` sinon).
- `withTechnician(handler)` : Exige un utilisateur avec le rôle `TECHNICIAN` ou `ADMIN`.

### Centralisation de la traduction des erreurs Clerk (`formatClerkErrorMessage`)

Toutes les exceptions renvoyées par l'API SDK de Clerk (mots de passe trop courts, emails déjà utilisés, etc.) sont formatées via `formatClerkErrorMessage(error)` dans `src/lib/auth.js` pour offrir des messages d'erreur clairs et explicites en français.

---

## 5. Niveaux de Protection des Routes

| Préfixe de route | Accès requis | Wrapper utilisé |
|---|---|---|
| `/api/availability` | Public (aucune authentification) | Aucun |
| `/api/services-public` | Public | Aucun |
| `/api/products-public` | Public | Aucun |
| `/api/repair-request` | Public (client peut réserver sans compte) | Aucun |
| `/api/interventions/*` | Authentifié (`CLIENT` ou `TECHNICIAN`) | `withAuth` |
| `/api/conversations/*` | Authentifié | `withAuth` |
| `/api/push/*` | Authentifié | `withAuth` |
| `/api/admin/*` | Authentifié + rôle `ADMIN` obligatoire | `withAdmin` |
| `/api/webhooks/clerk` | Signé par Clerk (vérification HMAC Svix) | Aucun (Signature Svix) |

---

## 6. Accès aux Données — Isolation par Utilisateur

Les routes API authentifiées appliquent un **filtre sur l'identité de l'utilisateur** pour s'assurer qu'un client ne peut accéder qu'à ses propres données :

- Un **CLIENT** interrogeant `/api/interventions` ne reçoit que les interventions où `userId === son propre id`.
- Un **TECHNICIAN** ne reçoit que les interventions où `technicianId === son propre id`.
- Un **ADMIN** reçoit toutes les données sans restriction.
