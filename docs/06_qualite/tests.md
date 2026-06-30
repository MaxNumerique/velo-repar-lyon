# Stratégie de Tests — HomeCycl'Home

L'application est couverte par une suite de **246 tests automatisés** répartis sur **45 fichiers**, exécutés avec **Vitest** et **React Testing Library**.

---

## 1. Outillage

| Outil | Rôle |
|---|---|
| **Vitest** | Framework de tests (exécution, assertions, mocking) |
| **React Testing Library (RTL)** | Utilitaires pour tester les composants React |
| **jsdom** | Environnement DOM simulé pour les tests de composants |
| **@testing-library/user-event** | Simulation d'interactions utilisateur (clic, saisie, etc.) |
| **@testing-library/jest-dom** | Matchers additionnels pour les assertions sur le DOM |
| **@vitest/coverage-v8** | Génération de rapports de couverture de code |

---

## 2. Configuration

### `vitest.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',          // Simule un navigateur
    setupFiles: ['./vitest.setup.js'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Alias @/ → src/
    },
  },
});
```

### `vitest.setup.js`

Chargé avant chaque suite de tests. Configure les mocks globaux incontournables :
- **Clerk** : mock de `@clerk/nextjs/server` (`auth()`, `currentUser()`)
- **Prisma** : mock de `@/db/prisma` pour éviter toute connexion réelle à la base de données
- **Next.js** : mock de `next/headers`, `next/navigation`, `next/server`
- **Cloudinary** : mock du SDK Cloudinary

---

## 3. Structure des Tests

La structure des tests **miroire exactement** celle de `src/` :

```
tests/
├── app/
│   └── api/
│       ├── availability/
│       │   └── route.test.js          # Tests de l'API de disponibilité
│       ├── interventions/
│       │   ├── route.test.js          # GET/POST interventions
│       │   └── [id]/route.test.js     # GET/PATCH/DELETE par ID
│       ├── repair-request/
│       │   └── route.test.js          # Création de demande (POST complet)
│       ├── admin/
│       │   ├── interventions/         # CRUD admin interventions
│       │   ├── products/              # CRUD admin produits
│       │   ├── sectors/               # CRUD admin secteurs
│       │   ├── services/              # CRUD admin forfaits
│       │   └── users/                 # Gestion utilisateurs admin
│       └── (dashboard)/
│           └── repair/
│               └── page.test.jsx      # Tests du wizard de réservation
│
├── features/
│   ├── bikes/                         # Composants vélos
│   ├── chat/                          # Composants chat
│   ├── interventions/                 # Composants interventions
│   └── admin/                         # Composants admin
│
├── hooks/                             # Hooks partagés
└── lib/
    ├── dateUtils.test.js              # Tests des utilitaires de dates
    └── googleMaps.test.js             # Tests du géocodage
```

---

## 4. Types de Tests

### Tests de Routes API (Intégration)

Ces tests vérifient le comportement des handlers de routes API Next.js en mockant Prisma et Clerk.

**Exemple — Test de `POST /api/repair-request` :**

```javascript
describe('POST /api/repair-request', () => {
  it('crée une intervention et retourne 201', async () => {
    // Arrange
    prisma.repairRequest.create.mockResolvedValue({ id: 'clx123', status: 'PENDING' });

    const request = new Request('http://localhost/api/repair-request', {
      method: 'POST',
      body: JSON.stringify({
        address: '10 Rue de la Paix, Lyon',
        servicePackageId: 'pkg-1',
        clientFirstName: 'Marie',
        scheduledAt: '2026-07-10T09:00:00.000Z',
        technicianId: 'tech-1',
      }),
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(201);
    expect(prisma.repairRequest.create).toHaveBeenCalledOnce();
  });

  it('retourne 400 si les données obligatoires sont manquantes', async () => {
    const request = new Request('http://localhost/api/repair-request', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Tests de Composants React (Unitaires)

Ces tests vérifient le rendu et les interactions des composants UI.

**Exemple — Test du stepper de réservation :**

```javascript
describe('RepairStepper', () => {
  it('affiche l\'étape 1 par défaut', () => {
    render(<RepairStepper />);
    expect(screen.getByText('Votre vélo')).toBeInTheDocument();
  });

  it('passe à l\'étape suivante quand le bouton est cliqué', async () => {
    render(<RepairStepper />);
    await userEvent.click(screen.getByRole('button', { name: /suivant/i }));
    expect(screen.getByText('Votre prestation')).toBeInTheDocument();
  });
});
```

### Tests des Utilitaires (Unitaires purs)

```javascript
describe('dateUtils', () => {
  it('calcule correctement le délai de -6h', () => {
    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // dans 3h
    expect(isWithinLockPeriod(scheduledAt)).toBe(true);

    const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000); // dans 24h
    expect(isWithinLockPeriod(farFuture)).toBe(false);
  });
});
```

---

## 5. Exécution des Tests

### Lancer tous les tests

```bash
npm test
# ou
npx vitest run
```

### Mode watch (développement)

```bash
npm run test:watch
# ou
npx vitest
```

### Rapport de couverture

```bash
npm run test:coverage
# ou
npx vitest run --coverage
```

Le rapport HTML est généré dans `coverage/index.html`.

---

## 6. Résultats de la Suite de Tests

| Métrique | Valeur |
|---|---|
| Nombre total de tests | **246** |
| Fichiers de tests | **45** |
| Taux de réussite | **100%** |
| Temps d'exécution moyen | ~8 secondes |

---

## 7. Mocking — Stratégie

Toutes les dépendances externes sont **mockées** dans `vitest.setup.js` pour que les tests soient :
- **Isolés** : aucun appel réseau réel, aucune connexion à la base de données.
- **Déterministes** : les résultats ne dépendent pas de l'état d'un service externe.
- **Rapides** : pas d'I/O réseau ou disque.

| Dépendance mockée | Raison |
|---|---|
| `@/db/prisma` | Évite les connexions PostgreSQL en test |
| `@clerk/nextjs/server` | Simule des sessions authentifiées avec différents rôles |
| `next/headers` | API Next.js non disponible en dehors de son runtime |
| `@/lib/mail` | Évite l'envoi d'emails réels |
| `@/lib/webPush` | Évite les notifications push réelles |
| `@/lib/pusher` | Évite les connexions WebSocket Pusher |
| `@/lib/cloudinary` | Évite les appels Cloudinary |
