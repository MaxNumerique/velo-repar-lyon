# Authentification & Contrôle d'Accès par Rôle

L'application délègue l'intégralité de la gestion des identités à **Clerk**, un service d'authentification SaaS. Le contrôle d'accès est ensuite assuré par un middleware Next.js et des vérifications côté serveur dans chaque route API.

---

## 1. Clerk — Gestion des Identités

### Fonctionnement

Clerk gère :
- **L'inscription** (email + mot de passe, ou OAuth Google).
- **La connexion** et la gestion de session (tokens JWT).
- **La réinitialisation de mot de passe**.
- **Les métadonnées utilisateur** : le rôle (`role`) est stocké dans `publicMetadata.role` du compte Clerk.

### Synchronisation avec PostgreSQL (Webhook)

À la création d'un nouveau compte Clerk, un **webhook** est déclenché automatiquement vers `/api/webhooks/clerk`. Ce webhook crée le profil utilisateur correspondant dans la table `User` de PostgreSQL locale avec les champs `clerkId`, `email`, `firstName`, `lastName`.

Cela permet d'associer un compte Clerk à des données métier (interventions, vélos, secteurs) stockées dans notre base de données.

---

## 2. Les Trois Rôles

| Rôle | Valeur en DB (`Role`) | Métadonnée Clerk (`publicMetadata.role`) |
|---|---|---|
| Client | `CLIENT` | `"CLIENT"` (défaut) |
| Technicien | `TECHNICIAN` | `"TECHNICIAN"` |
| Administrateur | `ADMIN` | `"ADMIN"` |

Le rôle est la **source de vérité** pour toutes les décisions d'accès. Il est lu depuis les métadonnées Clerk à chaque requête et comparé aux règles définies dans le middleware.

---

## 3. Middleware Next.js — `src/middleware.js`

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

### Périmètre du middleware

Le middleware s'applique à toutes les routes sauf les ressources statiques (`_next`, images, CSS, JS), définies dans le `config.matcher`.

---

## 4. Protection des Routes de Page (`auth-required`)

Le groupe de routes `(auth-required)` dans `src/app/(dashboard)/` est protégé par le layout `layout.jsx` associé. Ce layout utilise le helper Clerk `auth()` pour vérifier la session et rediriger vers la page de connexion si l'utilisateur n'est pas authentifié.

---

## 5. Protection des Routes API

Chaque route API sensible effectue une vérification de rôle côté serveur via `auth()` de Clerk :

```javascript
// Exemple dans une route API admin
const { userId, sessionClaims } = await auth();
if (!userId || sessionClaims?.publicMetadata?.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**Niveaux de protection :**

| Préfixe de route | Accès requis |
|---|---|
| `/api/availability` | Public (aucune authentification) |
| `/api/services-public` | Public |
| `/api/products-public` | Public |
| `/api/repair-request` | Public (client peut réserver sans compte) |
| `/api/interventions/*` | Authentifié (`CLIENT` ou `TECHNICIAN`) |
| `/api/conversations/*` | Authentifié |
| `/api/push/*` | Authentifié |
| `/api/admin/*` | Authentifié + rôle `ADMIN` obligatoire |
| `/api/webhooks/clerk` | Signé par Clerk (vérification de signature HMAC) |

---

## 6. Accès aux Données — Isolation par Utilisateur

Les routes API authentifiées appliquent un **filtre sur l'identité de l'utilisateur** pour s'assurer qu'un client ne peut accéder qu'à ses propres données :

- Un **CLIENT** interrogeant `/api/interventions` ne reçoit que les interventions où `userId === son propre id`.
- Un **TECHNICIAN** ne reçoit que les interventions où `technicianId === son propre id`.
- Un **ADMIN** reçoit toutes les données sans restriction.

---

## 7. Flux d'Authentification Complet

```
1. Utilisateur ouvre l'application
        │
        ▼
2. Clerk vérifie la session (cookie / token)
        │
   ┌────┴────┐
   │ Connecté │          │ Non connecté │
   └────┬────┘          └──────┬───────┘
        │                      │
        ▼                      ▼
3. Middleware lit le rôle  Accès aux pages publiques
   depuis publicMetadata    (/repair, page d'accueil)
        │
        ▼
4. Redirection selon le rôle :
   - CLIENT     → /interventions
   - TECHNICIAN → /interventions
   - ADMIN      → /admin/interventions
```
