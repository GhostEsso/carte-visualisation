This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Explication du test
Le test consiste à créer une application web cartographique avec les fonctionnalités suivantes :
Interface cartographique interactive utilisant Leaflet (pas Google Maps)
Sélection de zones sur la carte (rectangles, cercles ou polygones)
Récupération de données via une API basée sur les coordonnées sélectionnées
Visualisation des données récupérées (graphiques, tableaux, ou sur la carte)
Gestion des contraintes techniques :
Pas de bibliothèques UI complètes (Material UI, Ant Design)
Pas de Redux pour la gestion d'état
CSS personnalisé (pas de Bootstrap ou Tailwind)
Étapes de développement

Étape 1 : Configuration du projet
Installation des dépendances nécessaires (Leaflet, React-Leaflet)
Structure des dossiers et fichiers
Configuration de base

Étape 2 : Implémentation de la carte
Intégration de Leaflet dans l'application
Configuration de la carte (zoom, position initiale)
Création des contrôles de base

Étape 3 : Fonctionnalités de sélection de zones
Implémentation des outils de dessin (rectangles, cercles, polygones)
Extraction des coordonnées des zones sélectionnées
Gestion des interactions utilisateur

Étape 4 : Intégration de l'API
Création des services pour les appels API
Gestion des requêtes basées sur les coordonnées
Implémentation de limitations pour éviter les appels excessifs
Gestion des états de chargement et des erreurs

Étape 5 : Visualisation des données
Création de composants pour afficher les données (tableaux, graphiques)
Implémentation de filtres et options de tri
Mise en place de la pagination

Étape 6 : Styles et responsive design
Création de styles CSS personnalisés
Adaptation pour différentes tailles d'écran
Amélioration de l'expérience utilisateur

Étape 7 : Tests et finalisation
Vérification de toutes les fonctionnalités
Optimisations de performance
Documentation du code
Commençons par la première étape : la configuration du projet et l'installation des dépendances.