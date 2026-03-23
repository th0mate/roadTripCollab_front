# Claude Code Context - RoadTripCollab Modern Front

## 🗺️ Projet : RoadTripCollab
Application web collaborative de planification de road trips. L'objectif est de permettre à plusieurs utilisateurs de planifier un itinéraire, gérer un budget commun, ajouter des arrêts (villes, hébergements, restaurants, activités) et partager des photos.

## 🛠️ Stack Technique
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Langage**: TypeScript
- **Style**: Tailwind CSS 4 (`@import "tailwindcss"`)
- **State**: Pinia (Auth, Theme, Trips)
- **Cartographie**: Google Maps API & Leaflet (OSRM)
- **Icônes**: UIcons (Flaticon) - préfixe `fi fi-rr-`

## 🎨 Charte Graphique & UI/UX
L'interface doit être **"Impeccable"**, moderne, avec un aspect "Neon/High-energy", adaptée thème sombre & thème clair. Attention aussi au responsive et à ne pas faire un rendu trop "IA" (éviter les interfaces génériques et sans âme).
L'expérience utilisateur doit être fluide, avec des micro-interactions, des transitions douces, et une hiérarchie visuelle claire. La carte doit être le point focal, avec les informations secondaires accessibles via des tiroirs (drawers) ou des modales.
### Design Tokens (via `index.css`)
- **Police**: Plus Jakarta Sans
- **Couleur Primaire (Neon Green)**: 
  - Light: `#9fe000` (`--brand-primary`)
  - Dark: `#ccff00` (`--brand-primary`)
- **Neutres**: Zinc (`zinc-50` à `zinc-950`)
- **Backgrounds**: 
  - Light: `bg-zinc-50`
  - Dark: `#0c0c0e`
- **Cartes (Cards)**: Utiliser `@utility paper-card` (arrondi `3xl`, bordures subtiles).
- **Icônes**: UIcons (Flaticon) - préfixe `fi fi-rr-` (ex: `fi fi-rr-car`, `fi fi-rr-hotel`, `fi fi-rr-restaurant`).

### Utilitaires de Design (Tailwind 4)
- **Boutons**: `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`. (Tous arrondis `full`).
- **Inputs**: `input-field` (style moderne, bordure de focus en bas).
- **Badges**: `badge-green`, `badge-blue`, `badge-violet`, etc.
- **Effets**: Transitions `fade` entre les routes, `hover` sur les cartes via `paper-card-hover`.

## 🏗️ Structure du Domaine
- **Trip**: Objet central (id, titre, description, budget, dates, status: `planning`, `active`, `completed`).
- **Stop**: Arrêt sur l'itinéraire (types: `city`, `accommodation`, `restaurant`, `activity`, `poi`). Chaque type a sa propre couleur (voir `getStopColor` dans `TripDashboardView.vue`).
- **Participant**: Utilisateur lié au voyage (avec avatar, rôle, et statut d'invitation).
- **Expense**: Dépense liée au voyage (montant, catégorie, payeur, date).

## 🎯 Missions pour Claude Code
1.  **UI/UX Refactoring**: Améliorer la lisibilité et l'esthétique des vues, en particulier `TripDashboardView.vue` (1500+ lignes).
2.  **Complex Layouts**: Gérer intelligemment l'espace entre la carte (centrale) et les panneaux d'information (tiroirs/drawers, modales).
3.  **Interactions Fluides**: Ajouter des micro-interactions, des squelettes de chargement (skeletons), et des transitions pour une sensation "App Native".
4.  **Dark Mode**: S'assurer que chaque composant est parfait en mode clair ET sombre.
5.  **Clean Code**: Refactoriser les gros fichiers en composants plus petits et réutilisables dans `src/components/`.

## 📌 Directives de Développement
- Toujours utiliser `script setup` avec TypeScript.
- Respecter scrupuleusement les classes utilitaires définies dans `index.css`.
- Privilégier les composants `AppModal` et les tiroirs pour les interactions secondaires afin de garder la carte visible.
- Garder le `TripDashboardView.vue` comme pièce maîtresse : c'est un tableau de bord dynamique et collaboratif.
