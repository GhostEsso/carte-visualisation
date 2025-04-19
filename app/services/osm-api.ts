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
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') {
    return 'restaurant';
  } else if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'doctors') {
    return 'hospital';
  } else if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') {
    return 'school';
  } else if (tags.leisure === 'park' || tags.leisure === 'garden') {
    return 'park';
  } else if (tags.shop) {
    return 'store';
  } else {
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
      node["amenity"="restaurant"](${bbox});
      node["amenity"="cafe"](${bbox});
      node["amenity"="fast_food"](${bbox});
      node["amenity"="hospital"](${bbox});
      node["amenity"="clinic"](${bbox});
      node["amenity"="doctors"](${bbox});
      node["amenity"="school"](${bbox});
      node["amenity"="university"](${bbox});
      node["amenity"="college"](${bbox});
      node["leisure"="park"](${bbox});
      node["leisure"="garden"](${bbox});
      node["shop"](${bbox});
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
    throw new Error('Les limites de la zone sont requises pour interroger OpenStreetMap');
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
  
  try {
    // Construire la requête
    const query = buildOverpassQuery(bounds);
    
    // Faire l'appel API
    console.log('Appel à l\'API OpenStreetMap');
    lastCallTime = Date.now();
    const response = await fetch(`${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const osmData: OSMResponse = await response.json();
    
    // Transformer les données OSM au format de l'application
    let transformedData: ApiData[] = osmData.elements.map(element => ({
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
    console.error('Erreur lors de la récupération des données OSM:', error);
    
    // En cas d'erreur, retourner un tableau vide
    return {
      data: [],
      total: 0
    };
  }
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