'use client';

import L from 'leaflet';
import { ApiData, ApiParams } from '../types';

// Configuration de l'API
const OVERPASS_API_URL = process.env.NEXT_PUBLIC_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const THROTTLE_DELAY = 1000; // 1 seconde entre les appels
const MAX_CACHE_ENTRIES = 100; // Nombre maximal d'entrées dans le cache

// Cache pour les résultats de l'API (données brutes d'une zone, sans tri ni pagination)
interface CacheItem {
  data: ApiData[];
  timestamp: number;
}

// Structure de données OSM
interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    shop?: string;
    leisure?: string;
    building?: string;
    [key: string]: string | undefined;
  };
}

interface OSMResponse {
  elements: OSMNode[];
}

// Cache d'API
const apiCache = new Map<string, CacheItem>();
let lastCallTime = 0;

// Déterminer le type d'un élément OSM
function getTypeFromTags(tags: OSMNode['tags']): string {
  // Restaurants et lieux pour manger
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food' ||
    tags.amenity === 'bar' || tags.amenity === 'pub' || tags.amenity === 'food_court') {
    return 'restaurant';
  }
  // Établissements de santé
  else if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'doctors' ||
    tags.amenity === 'dentist' || tags.amenity === 'pharmacy' || tags.healthcare) {
    return 'hospital';
  }
  // Établissements d'éducation
  else if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college' ||
    tags.amenity === 'kindergarten' || tags.amenity === 'library') {
    return 'school';
  }
  // Espaces verts et loisirs
  else if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground' ||
    tags.leisure === 'sports_centre' || tags.leisure === 'stadium' || tags.leisure === 'pitch') {
    return 'park';
  }
  // Commerces
  else if (tags.shop) {
    return 'store';
  }
  // Transports
  else if (tags.public_transport || tags.amenity === 'bus_station' || tags.railway === 'station' ||
    tags.highway === 'bus_stop' || tags.amenity === 'taxi') {
    return 'transport';
  }
  // Services publics
  else if (tags.amenity === 'police' || tags.amenity === 'fire_station' || tags.amenity === 'post_office' ||
    tags.amenity === 'townhall' || tags.office === 'government') {
    return 'public_service';
  }
  // Tourisme et culture
  else if (tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.tourism === 'attraction' ||
    tags.tourism === 'hotel' || tags.tourism === 'viewpoint' || tags.historic) {
    return 'tourism';
  }
  // Services bancaires
  else if (tags.amenity === 'bank' || tags.amenity === 'atm') {
    return 'bank';
  }
  // Lieux de culte
  else if (tags.amenity === 'place_of_worship') {
    return 'worship';
  }
  // Catégorie par défaut
  else {
    return 'other';
  }
}

// Générer une valeur basée sur le type (pour la visualisation)
// La variation dépend de l'identifiant OSM : un même point garde toujours la même valeur.
function generateValueFromType(type: string, id: number): number {
  const baseValues: Record<string, number> = {
    restaurant: 70,
    hospital: 90,
    school: 80,
    park: 60,
    store: 50,
    transport: 75,
    public_service: 85,
    tourism: 65,
    bank: 55,
    worship: 45,
    other: 30
  };

  const baseValue = baseValues[type] || 50;
  return baseValue + (id % 20) - 10;
}

// Test point-dans-polygone (ray casting) sur des coordonnées [lat, lng]
export function pointInPolygon(point: L.LatLngTuple, polygon: L.LatLngTuple[]): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    if ((lngI > lng) !== (lngJ > lng) &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI) {
      inside = !inside;
    }
  }

  return inside;
}

// Appliquer la forme, le tri et la pagination aux données brutes d'une zone.
// Fait après le cache : changer le tri ou la page ne déclenche aucun appel réseau.
function shapeResults(all: ApiData[], params: ApiParams): { data: ApiData[], total: number } {
  const { coordinates, filters, pagination } = params;

  // La requête Overpass ne connaît que la bounding box : restreindre au polygone dessiné
  let data = coordinates && coordinates.length >= 3
    ? all.filter(item => pointInPolygon(item.coordinates, coordinates))
    : [...all];

  if (filters?.sortBy) {
    const { sortBy, sortOrder } = filters;

    data.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }

  const total = data.length;

  if (pagination) {
    const startIndex = (pagination.page - 1) * pagination.limit;
    data = data.slice(startIndex, startIndex + pagination.limit);
  }

  return { data, total };
}

// Construire la requête Overpass
/**
 * Construit une requête Overpass QL pour récupérer les points d'intérêt dans une zone donnée.
 * La requête cible divers types de nœuds : commodités, loisirs, magasins, tourisme, etc.
 * 
 * @param bounds - Les limites géographiques (bounding box) de la zone à interroger.
 * @returns La chaîne de requête Overpass QL.
 */
function buildOverpassQuery(bounds: L.LatLngBounds): string {
  const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

  return `
    [out:json];
    (
      // Restaurants et cafés
      node["amenity"="restaurant"](${bbox});
      node["amenity"="cafe"](${bbox});
      node["amenity"="fast_food"](${bbox});
      node["amenity"="bar"](${bbox});
      node["amenity"="pub"](${bbox});
      
      // Santé
      node["amenity"="hospital"](${bbox});
      node["amenity"="clinic"](${bbox});
      node["amenity"="doctors"](${bbox});
      node["amenity"="dentist"](${bbox});
      node["amenity"="pharmacy"](${bbox});
      node["healthcare"](${bbox});
      
      // Éducation
      node["amenity"="school"](${bbox});
      node["amenity"="university"](${bbox});
      node["amenity"="college"](${bbox});
      node["amenity"="kindergarten"](${bbox});
      node["amenity"="library"](${bbox});
      
      // Loisirs et espaces verts
      node["leisure"="park"](${bbox});
      node["leisure"="garden"](${bbox});
      node["leisure"="playground"](${bbox});
      node["leisure"="sports_centre"](${bbox});
      
      // Commerces
      node["shop"](${bbox});
      
      // Transports
      node["public_transport"](${bbox});
      node["amenity"="bus_station"](${bbox});
      node["railway"="station"](${bbox});
      node["highway"="bus_stop"](${bbox});
      
      // Services publics
      node["amenity"="police"](${bbox});
      node["amenity"="fire_station"](${bbox});
      node["amenity"="post_office"](${bbox});
      node["amenity"="townhall"](${bbox});
      
      // Tourisme et culture
      node["tourism"](${bbox});
      node["historic"](${bbox});
      
      // Services bancaires
      node["amenity"="bank"](${bbox});
      node["amenity"="atm"](${bbox});
      
      // Lieux de culte
      node["amenity"="place_of_worship"](${bbox});
    );
    out body;
  `;
}

// Récupérer les données depuis l'API OSM
/**
 * Récupère les données géographiques depuis l'API OpenStreetMap via Overpass.
 * Gère le cache, la limitation de débit (throttling), et les tentatives de reconnexion (retries).
 * Transforme les données brutes OSM en format ApiData utilisé par l'application.
 * 
 * @param params - Paramètres de la requête : bounds, coordinates, filters, pagination.
 * @returns Une promesse contenant les données transformées et le nombre total d'éléments.
 * @throws Si toutes les tentatives échouent (un échec n'est jamais mis en cache).
 */
export async function fetchOSMData(params: ApiParams): Promise<{
  data: ApiData[],
  total: number
}> {
  const { bounds } = params;

  if (!bounds) {
    console.error('Les limites de la zone sont requises pour interroger OpenStreetMap');
    return { data: [], total: 0 };
  }

  // Vérifier si les limites sont valides
  if (isNaN(bounds.getNorth()) || isNaN(bounds.getSouth()) ||
    isNaN(bounds.getEast()) || isNaN(bounds.getWest())) {
    console.error('Limites de zone invalides:', bounds);
    return { data: [], total: 0 };
  }

  // Clé de cache : la zone uniquement (le tri et la pagination sont appliqués après)
  const cacheKey = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

  // Vérifier si les données sont dans le cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < API_CACHE_DURATION)) {
    console.log('Utilisation des données du cache');
    return shapeResults(cachedData.data, params);
  }

  // Limitation des appels API
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < THROTTLE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastCall));
  }

  let retryCount = 0;
  const maxRetries = 2;
  let lastError: unknown;

  while (retryCount <= maxRetries) {
    try {
      // Construire la requête
      const query = buildOverpassQuery(bounds);

      // Faire l'appel API
      console.log(`Appel à l'API OpenStreetMap (tentative ${retryCount + 1}/${maxRetries + 1})`);
      lastCallTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Timeout de 20 secondes

      const response = await fetch(`${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const osmData: OSMResponse = await response.json();

      // Transformer les données OSM au format de l'application
      const transformedData: ApiData[] = osmData.elements
        .filter(element => element && typeof element.lat === 'number' && typeof element.lon === 'number')
        .map(element => {
          const { tags } = element;

          // Extraire les informations de contact depuis différentes variantes de tags OSM
          const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || undefined;
          const email = tags.email || tags['contact:email'] || undefined;
          const website = tags.website || tags['contact:website'] || tags.url || undefined;

          return {
            id: `osm-${element.id}`,
            name: tags.name || `Point d'intérêt à ${element.lat.toFixed(5)}, ${element.lon.toFixed(5)}`,
            description: Object.entries(tags)
              .filter(([key]) => !['name', 'phone', 'email', 'website', 'contact:phone', 'contact:email', 'contact:website', 'url'].includes(key))
              .map(([key, value]) => `${key}: ${value}`)
              .join(', '),
            coordinates: [element.lat, element.lon] as [number, number],
            type: getTypeFromTags(tags),
            value: generateValueFromType(getTypeFromTags(tags), element.id),
            phone,
            email,
            website,
          };
        });

      // Purger les entrées périmées, puis la plus ancienne si le cache est plein
      const now = Date.now();
      apiCache.forEach((item, key) => {
        if (now - item.timestamp >= API_CACHE_DURATION) apiCache.delete(key);
      });
      if (apiCache.size >= MAX_CACHE_ENTRIES) {
        apiCache.delete(apiCache.keys().next().value as string);
      }

      // Mettre en cache les données brutes de la zone
      apiCache.set(cacheKey, { data: transformedData, timestamp: now });

      return shapeResults(transformedData, params);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données OSM (tentative ${retryCount + 1}/${maxRetries + 1}):`, error);

      lastError = error;
      retryCount++;

      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('Requête interrompue pour cause de timeout');
      }

      if (retryCount <= maxRetries) {
        // Attendre un délai exponentiel avant de réessayer
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Nouvelle tentative dans ${delay / 1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Toutes les tentatives ont échoué : propager l'erreur pour que l'appelant puisse
  // l'afficher et réessayer, au lieu de mettre en cache un résultat vide
  throw lastError instanceof Error ? lastError : new Error('Échec de la récupération des données OpenStreetMap');
}

// Vider le cache
/**
 * Vide intégralement le cache des requêtes API.
 */
export function clearOSMCache(): void {
  apiCache.clear();
}

// Obtenir des statistiques sur le cache
/**
 * Récupère les statistiques actuelles du cache API.
 * @returns Un objet contenant la taille actuelle, la taille max et la durée de validité.
 */
export function getOSMCacheStats(): { size: number; maxSize: number; duration: number } {
  return {
    size: apiCache.size,
    maxSize: MAX_CACHE_ENTRIES,
    duration: API_CACHE_DURATION
  };
}

// Interface pour l'API OSM
export const osmApiService = {
  fetchData: fetchOSMData,
  clearCache: clearOSMCache,
  getCacheStats: getOSMCacheStats
}; 