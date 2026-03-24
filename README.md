# RoadTrip Collab — Frontend

Interface utilisateur du projet RoadTrip Collab, construite avec **Vue 3** + **TypeScript** + **Vite**.

> Le backend doit être démarré avant le frontend. Voir le README du repo `roadtrip-backend`.

---

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou v20 LTS
- Backend `roadtrip-backend` lancé sur `http://localhost:3333`

---

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer en développement

```bash
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## Scripts disponibles

```bash
npm run dev        # Serveur de développement (Vite)
npm run build      # Build de production (TypeScript check + Vite build)
npm run preview    # Prévisualiser le build de production
```

---

## Structure du projet

```
src/
├── views/           # Pages de l'application
│   └── admin/       # Vues du backoffice administrateur
├── components/      # Composants réutilisables
│   └── admin/       # Composants du backoffice (AdminLayout, etc.)
├── services/        # Appels API
│   ├── api.ts       # Client Axios (token Bearer automatique)
│   ├── authService.ts
│   └── adminService.ts
├── stores/          # État global (Pinia)
├── router/          # Vue Router + guards d'authentification
├── types/           # Interfaces TypeScript
└── assets/styles/   # CSS global et variables
```

---

## Configuration

Le frontend pointe par défaut sur `http://localhost:3333` (backend). Si le backend tourne sur un autre port, modifier l'URL de base dans `src/services/api.ts`.

---

## Stack technique

| Outil | Version |
|-------|---------|
| Vue 3 | 3.5.x |
| TypeScript | 5.9.x |
| Vite | 7.x |
| Pinia | 3.x |
| Vue Router | 5.x |
| Axios | 1.x |
| Tailwind CSS | 4.x |
| Leaflet | 1.9.x |

---

## Accès administrateur

Après avoir fait passer un utilisateur en admin depuis la base de données (voir README backend), reconnecter le compte → le lien **"Administration"** apparaît dans la navbar et donne accès au backoffice (`/admin`).

---

## Équipe

Projet réalisé dans le cadre du cours de développement fullstack — YNOV M1
