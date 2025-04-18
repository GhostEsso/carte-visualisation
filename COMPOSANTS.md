# Documentation des Composants - Application de Visualisation Cartographique

Ce document explique le rôle et le fonctionnement de chaque composant clé de l'application de visualisation cartographique.

## MapComponent

**Fichier**: `app/components/MapComponent.tsx`

**Rôle**: Composant principal qui affiche la carte interactive et gère les outils de dessin pour la sélection des zones.

**Fonctionnalités**:
- Affiche une carte Leaflet interactive
- Permet le dessin de formes (rectangle, cercle, polygone) pour sélectionner des zones d'intérêt
- Gère l'affichage des marqueurs pour les points d'intérêt
- Fournit des contrôles pour éditer, centrer ou supprimer les formes
- Récupère dynamiquement les données des points d'intérêt selon la région affichée
- Intègre les autres composants (DataVisualization, MapLegend, ZoneInfo, SearchBar)
- Gère les interactions entre les différents composants

**Interactions**:
- Crée et stocke une forme sélectionnée
- Met à jour la carte selon les filtres et les recherches
- Transfère la forme sélectionnée aux composants de visualisation et d'information

## DataVisualization

**Fichier**: `app/components/DataVisualization.tsx`

**Rôle**: Visualise les données des points d'intérêt situés dans la zone sélectionnée par l'utilisateur.

**Fonctionnalités**:
- Affiche les données sous forme de tableau avec pagination
- Visualise les données avec différents types de graphiques (camembert, barre, ligne)
- Permet de filtrer et trier les données
- Offre l'exportation des données en différents formats (CSV, JSON, GeoJSON)
- Gère la mise en cache des requêtes API pour optimiser les performances

**Types de graphiques**:
- **Pie Chart (Camembert)** : Distribution par type de point d'intérêt
- **Bar Chart (Barres)** : Valeur moyenne par type
- **Line Chart (Ligne)** : Progression des valeurs pour les 15 premiers éléments

## MapLegend

**Fichier**: `app/components/MapLegend.tsx`

**Rôle**: Affiche une légende pour la carte et permet de filtrer les types de points d'intérêt.

**Fonctionnalités**:
- Liste les différents types de points d'intérêt avec leurs couleurs
- Permet d'activer/désactiver l'affichage de certains types via des cases à cocher
- Fournit une explication des différentes formes de sélection (rectangle, cercle, polygone)
- Interface pliable pour économiser de l'espace à l'écran

## SearchBar

**Fichier**: `app/components/SearchBar.tsx`

**Rôle**: Permet la recherche et la navigation vers des lieux spécifiques sur la carte.

**Fonctionnalités**:
- Interface de recherche avec autocomplétion
- Simule un service de géocodage pour trouver des lieux
- Affiche les résultats dans une liste déroulante
- Centrage automatique de la carte sur le lieu sélectionné
- Navigation au clavier dans les résultats
- Gestion des états de chargement

## ZoneInfo

**Fichier**: `app/components/ZoneInfo.tsx`

**Rôle**: Affiche des informations détaillées sur la zone sélectionnée par l'utilisateur.

**Fonctionnalités**:
- Calcule et affiche l'aire de la zone sélectionnée
- Calcule et affiche le périmètre (ou la circonférence pour un cercle)
- Indique les coordonnées du centre de la zone
- Affiche des informations spécifiques selon le type de forme (rayon pour un cercle)
- Formate les distances et surfaces pour une meilleure lisibilité (m, km, m², km²)

## Architecture des composants

```
MapComponent (Parent)
├── SearchBar
├── MapLegend
├── ZoneInfo
└── DataVisualization
```

Le `MapComponent` agit comme composant parent qui intègre et coordonne tous les autres composants. L'état de la forme sélectionnée est géré par le `MapComponent` et transmis aux composants `ZoneInfo` et `DataVisualization`.

## Services et Utilitaires

En plus des composants principaux, l'application utilise plusieurs services et utilitaires:

- **API Service**: Gère les requêtes de données
- **API Cache Service**: Améliore les performances en mettant en cache les résultats des requêtes
- **Export Utility**: Permet l'exportation des données dans différents formats

## Flow d'utilisation typique

1. L'utilisateur se connecte à l'application et voit la carte avec les points d'intérêt
2. Il peut utiliser la barre de recherche pour trouver un lieu spécifique
3. Il sélectionne une zone en dessinant une forme (rectangle, cercle ou polygone)
4. Les informations sur la zone apparaissent dans le composant ZoneInfo
5. Les données des points d'intérêt dans cette zone sont visualisées dans le composant DataVisualization
6. L'utilisateur peut filtrer les types de points via la légende, et les données/visualisations sont mises à jour
7. Les données peuvent être exportées dans différents formats si nécessaire 