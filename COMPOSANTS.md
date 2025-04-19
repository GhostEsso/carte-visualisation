# Documentation des Composants - Application de Visualisation Cartographique

Ce document explique le rôle et le fonctionnement de chaque composant clé de l'application de visualisation cartographique.

## MapComponent

**Fichier**: `app/components/MapComponent.tsx`

**Rôle**: Composant principal qui affiche la carte interactive et gère les outils de dessin pour la sélection des zones.

**Fonctionnalités**:
- Affiche une carte Leaflet interactive
- Permet le dessin de formes (rectangle, polygone) pour sélectionner des zones d'intérêt
- Gère l'affichage des marqueurs pour les points d'intérêt
- Fournit des contrôles pour éditer, centrer ou supprimer les formes
- Récupère dynamiquement les données des points d'intérêt selon la région affichée
- Intègre les autres composants (DataVisualization, MapLegend, ZoneInfo, SearchBar)
- Gère les interactions entre les différents composants

**Modifications Récentes**:
- Le mode de dessin du cercle a été désactivé car il provoquait des erreurs avec l'API OpenStreetMap
- Les styles des boutons de dessin ont été améliorés pour indiquer clairement le mode actif
- Les interactions entre les différents composants ont été optimisées

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
- Fournit une explication des différentes formes de sélection (rectangle, polygone)
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

## Utilisation de l'API OpenStreetMap (OSM)

**Fichier**: `app/services/osm-api.ts`

**Rôle**: Gère les requêtes vers l'API OpenStreetMap pour récupérer les données géospatiales.

**Fonctionnalités**:
- Construction de requêtes Overpass pour interroger l'API OSM
- Transformation des données OSM en format compatible avec l'application
- Mise en cache des résultats pour optimiser les performances
- Filtrage et classification des points d'intérêt par types (restaurants, écoles, etc.)
- Gestion des limites de l'API (throttling)

**Contraintes et limitations**:
- L'API OSM nécessite des limites géographiques rectangulaires (bounds) pour les requêtes
- Le mode de dessin du cercle a été désactivé car l'API OSM n'accepte pas directement les requêtes par rayon
- Un système de cache a été implémenté pour limiter le nombre d'appels à l'API
- Les résultats sont limités pour éviter de surcharger l'interface

**Types de données récupérées**:
- Restaurants, cafés, bars
- Établissements de santé (hôpitaux, cliniques, pharmacies)
- Établissements d'éducation (écoles, universités)
- Espaces verts et loisirs
- Commerces
- Transports
- Services publics
- Lieux touristiques et culturels
- Services bancaires
- Lieux de culte

## Flow d'utilisation typique

1. L'utilisateur se connecte à l'application et voit la carte avec les points d'intérêt
2. Il peut utiliser la barre de recherche pour trouver un lieu spécifique
3. Il sélectionne une zone en dessinant une forme (rectangle ou polygone)
4. Les informations sur la zone apparaissent dans le composant ZoneInfo
5. Les données des points d'intérêt dans cette zone sont visualisées dans le composant DataVisualization
6. L'utilisateur peut filtrer les types de points via la légende, et les données/visualisations sont mises à jour
7. Les données peuvent être exportées dans différents formats si nécessaire

## Améliorations récentes

1. **Interface Utilisateur**
   - Styles améliorés pour les boutons actifs des outils de dessin
   - Indicateurs visuels plus clairs pour les modes de dessin sélectionnés
   - Correction du filtrage des types de points dans la légende

2. **Optimisations**
   - Amélioration du système de cache pour réduire les appels API
   - Limitation du nombre de points affichés pour de meilleures performances

3. **Corrections de bugs**
   - Désactivation du mode de dessin cercle qui causait des erreurs avec l'API OSM
   - Correction de l'affichage des informations de zone
   - Amélioration de la gestion des erreurs lors des appels API 