'use client';

import L from 'leaflet';
import { ApiData, ApiParams } from '../types';

// Configuration de l'API
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const THROTTLE_DELAY = 1000; // 1 seconde entre les appels

// Cache pour les résultats de l'API
interface CacheItem {
  data: ApiData[];
  total: number;
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
function generateValueFromType(type: string): number {
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
  
  // Ajouter une variation aléatoire
  const baseValue = baseValues[type] || 50;
  return baseValue + Math.floor(Math.random() * 20) - 10;
}

// Construire la requête Overpass
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
export async function fetchOSMData(params: ApiParams): Promise<{
  data: ApiData[],
  total: number
}> {
  const { bounds, filters, pagination } = params;
  
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
  
  // Générer la clé de cache
  const cacheKey = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}${filters ? JSON.stringify(filters) : ''}`;
  
  // Vérifier si les données sont dans le cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < API_CACHE_DURATION)) {
    console.log('Utilisation des données du cache');
    
    // Appliquer la pagination si nécessaire
    if (pagination) {
      const { page, limit } = pagination;
      const startIndex = (page - 1) * limit;
      const paginatedData = cachedData.data.slice(startIndex, startIndex + limit);
      
      return {
        data: paginatedData,
        total: cachedData.total
      };
    }
    
    return {
      data: cachedData.data,
      total: cachedData.total
    };
  }
  
  // Limitation des appels API
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < THROTTLE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastCall));
  }
  
  let retryCount = 0;
  const maxRetries = 2;
  
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
      let transformedData: ApiData[] = osmData.elements
        .filter(element => element && typeof element.lat === 'number' && typeof element.lon === 'number')
        .map(element => ({
          id: `osm-${element.id}`,
          name: element.tags.name || `Point d'intérêt à ${element.lat.toFixed(5)}, ${element.lon.toFixed(5)}`,
          description: Object.entries(element.tags)
            .filter(([key]) => !['name'].includes(key))
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
          coordinates: [element.lat, element.lon],
          type: getTypeFromTags(element.tags),
          value: generateValueFromType(getTypeFromTags(element.tags))
        }));
      
      // Appliquer les filtres si nécessaire
      if (filters) {
        const { type, sortBy, sortOrder } = filters;
        
        if (type) {
          transformedData = transformedData.filter(item => item.type === type);
        }
        
        if (sortBy) {
          transformedData.sort((a, b) => {
            const valA = a[sortBy as keyof ApiData];
            const valB = b[sortBy as keyof ApiData];
            
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
      }
      
      // Mettre en cache les données complètes
      apiCache.set(cacheKey, {
        data: transformedData,
        total: transformedData.length,
        timestamp: Date.now()
      });
      
      // Appliquer la pagination si nécessaire et retourner
      if (pagination) {
        const { page, limit } = pagination;
        const startIndex = (page - 1) * limit;
        const paginatedData = transformedData.slice(startIndex, startIndex + limit);
        
        return {
          data: paginatedData,
          total: transformedData.length
        };
      }
      
      return {
        data: transformedData,
        total: transformedData.length
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des données OSM (tentative ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      retryCount++;
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('Requête interrompue pour cause de timeout');
      }
      
      if (retryCount <= maxRetries) {
        // Attendre un délai exponentiel avant de réessayer
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Nouvelle tentative dans ${delay/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // En cas d'erreur persistante, retourner un tableau vide
        return { data: [], total: 0 };
      }
    }
  }
  
  // Si toutes les tentatives ont échoué
  return { data: [], total: 0 };
}

// Vider le cache
export function clearOSMCache(): void {
  apiCache.clear();
}

// Obtenir des statistiques sur le cache
export function getOSMCacheStats(): { size: number; maxSize: number; duration: number } {
  return {
    size: apiCache.size,
    maxSize: 100, // Nombre maximal d'entrées dans le cache
    duration: API_CACHE_DURATION
  };
}

// Interface pour l'API OSM
export const osmApiService = {
  fetchData: fetchOSMData,
  clearCache: clearOSMCache,
  getCacheStats: getOSMCacheStats
}; 