# Intégration de l'API OpenStreetMap (Overpass)

Ce document explique comment l'API OpenStreetMap Overpass a été intégrée à l'application de visualisation cartographique.

## Vue d'ensemble

L'application permet désormais de basculer entre des données simulées et des données réelles provenant d'OpenStreetMap, offrant ainsi une expérience plus authentique et utile.

## Composants clés

### Service OSM API (`app/services/osm-api.ts`)

Ce service gère les interactions avec l'API Overpass d'OpenStreetMap :

- **Requêtes Overpass** : Génère et envoie des requêtes au format Overpass QL pour récupérer des points d'intérêt
- **Mise en cache** : Stocke les résultats pour réduire les appels API
- **Limitation de débit** : Introduit des délais entre les requêtes pour respecter les limites de l'API
- **Transformation des données** : Convertit les données OSM au format utilisé par l'application

### Intégration avec le service de cache existant (`app/services/api-cache.ts`)

Le service de cache existant a été modifié pour :

- Basculer entre les données simulées et les données OSM
- Gérer le cache spécifique à OSM
- Exposer des méthodes pour changer la source de données

### Interface utilisateur

Un sélecteur a été ajouté à l'interface pour permettre aux utilisateurs de choisir entre :

- **Données simulées** : Données générées localement (comme avant)
- **OpenStreetMap** : Données réelles provenant d'OSM

## Fonctionnement détaillé

1. **Requête Overpass** : Lorsqu'une zone est sélectionnée, une requête Overpass est construite pour récupérer les points d'intérêt dans cette zone
2. **Filtrage par type** : La requête filtre les données par type (restaurants, hôpitaux, écoles, parcs, magasins)
3. **Transformation des données** : Les données OSM sont transformées pour correspondre au format attendu par l'application
4. **Affichage et interaction** : Les points sont affichés sur la carte et les données sont disponibles pour visualisation

## Types de points d'intérêt

Les types de points d'intérêt suivants sont récupérés depuis OSM :

- **Restaurants** : amenity=restaurant, cafe, fast_food
- **Hôpitaux** : amenity=hospital, clinic, doctors
- **Écoles** : amenity=school, university, college
- **Parcs** : leisure=park, garden
- **Magasins** : shop=*

## Limitations et considérations

- **Respect des quotas** : L'API Overpass a des limites d'utilisation. La mise en cache et la limitation de débit aident à les respecter.
- **Taille des zones** : Les requêtes pour de très grandes zones peuvent échouer ou être lentes.
- **Disponibilité des données** : Certaines régions peuvent avoir des données limitées dans OSM.

## Améliorations futures

- Ajouter plus de types de points d'intérêt
- Améliorer la visualisation pour différencier les sous-types (ex: restaurants vs cafés)
- Implémenter des requêtes plus complexes pour des analyses spatiales avancées
- Ajouter des détails supplémentaires dans les popups des marqueurs

## Utilisation

Pour utiliser cette fonctionnalité :

1. Sélectionnez une zone d'intérêt sur la carte
2. Utilisez le sélecteur de source de données pour choisir "OpenStreetMap"
3. Les données réelles des POI (Points d'Intérêt) de cette zone seront affichées
4. Vous pouvez filtrer, trier et exporter ces données comme avant

## Références

- [Documentation OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Overpass Query Language](https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide) 