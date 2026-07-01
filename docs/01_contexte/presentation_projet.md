# Présentation du Projet — HomeCycl'Home

## 1. Contexte métier

L'entreprise **LeCycleLyonnais**, forte de **68 ans d'expérience** dans la vente et l'entretien de bicyclettes, souhaite moderniser son offre de services en lançant un service de **réparation et d'entretien à domicile** de bicyclettes et de vélos à assistance électrique (VAE) sur la métropole lyonnaise.

Ce service est commercialisé sous la marque **HomeCycl'Home**, également appelé **Vélo du Pelo** (nom de code du projet).

Le service propose également la **vente additionnelle de produits dédiés** (pièces détachées, accessoires) lors de la prise de rendez-vous.

---

## 2. Le problème résolu

Avant ce projet, la planification des interventions à domicile était entièrement manuelle : appels téléphoniques, agendas papier, coordination chronophage entre le bureau et les techniciens sur le terrain.

Cette application remplace ce processus par un **flux numérique de bout en bout** :

1. Le client **réserve en ligne** son créneau d'intervention.
2. Le système **attribue automatiquement** un technicien selon sa zone géographique.
3. Le technicien **gère sa tournée** sur l'application mobile.
4. L'administrateur **supervise l'ensemble** de l'activité depuis un back-office dédié.

---

## 3. Les acteurs (utilisateurs) du système

Le système distingue trois profils d'accès avec des espaces dédiés et des permissions différentes.

| Rôle | Description | Accès |
|---|---|---|
| `CLIENT` | Particulier réservant une intervention | Parcours de réservation, historique personnel, gestion des vélos |
| `TECHNICIAN` | Technicien de LeCycleLyonnais | Tableau de bord de tournée, fiche d'intervention, chat, clôture |
| `ADMIN` | Responsable ou gestionnaire de l'entreprise | Back-office complet (utilisateurs, plannings, catalogues, supervision) |

---

## 4. Les grandes fonctionnalités

```
HomeCycl'Home
│
├── Réservation en ligne (Client)
│   ├── Saisie et validation d'adresse (Google Maps + PostGIS)
│   ├── Sélection du forfait et des produits additionnels
│   ├── Choix du créneau horaire disponible
│   └── Confirmation + création de compte optionnelle (Clerk)
│
├── Tournées terrain (Technicien)
│   ├── Liste des interventions du jour et des jours suivants
│   ├── Carte de la tournée (MapLibre/MapTiler)
│   ├── Chat temps réel client ↔ technicien (Pusher)
│   ├── Dépôt de photos de clôture (Cloudinary)
│   └── Changement de statut (En route → Sur place → Terminé)
│
└── Back-office (Administrateur)
    ├── Supervision de toutes les interventions
    ├── Gestion des zones géographiques (polygones PostGIS)
    ├── Gestion des forfaits d'entretien et produits
    ├── Gestion des utilisateurs (tous rôles)
    └── Planning global par technicien
```

---

## 5. Objectifs pédagogiques validés

Ce projet valide l'ensemble des compétences du référentiel **Concepteur Développeur d'Applications (CDA)** :

- **Installer et configurer** son environnement de travail (Docker, Prisma, Next.js).
- **Développer des interfaces utilisateur** (React, Next.js, Tailwind CSS).
- **Développer des composants métier** (logique de réservation, calcul de disponibilité, PostGIS).
- **Contribuer à la gestion de projet** (Jira, Confluence, méthodologie Agile/SCRUM).
- **Analyser les besoins et maquetter** une application.
- **Définir l'architecture logicielle** (Feature-Driven Development, App Router Next.js).
- **Concevoir et mettre en place une base de données relationnelle** (PostgreSQL + PostGIS + Prisma).
- **Développer des composants d'accès aux données SQL et NoSQL** (Prisma ORM, requêtes brutes PostGIS).
- **Préparer et exécuter des plans de tests** (Vitest, React Testing Library, 246 tests).
- **Préparer et documenter le déploiement** (Docker, docker-compose, VPS).
- **Contribuer à la mise en production dans une démarche DevOps** (GitHub Actions CI/CD).
