'use client';

import { ApiParams, ApiData } from '../types';
import { throttledFetchData } from './api';

interface CachedResponse {
  data: ApiData[];
  total: number;
  timestamp: number;
}

interface CacheItem {
  key: string;
  response: CachedResponse;
}

class ApiCacheService {
  private cache: Map<string, CacheItem>;
  private cacheSize: number;
  private cacheDuration: number; // durée de validité du cache en ms

  constructor(cacheSize = 50, cacheDuration = 5 * 60 * 1000) { // 5 minutes par défaut
    this.cache = new Map();
    this.cacheSize = cacheSize;
    this.cacheDuration = cacheDuration;
  }

  // Génère une clé de cache unique basée sur les paramètres de la requête
  private generateCacheKey(params: ApiParams): string {
    const { bounds, center, radius, coordinates, filters, pagination } = params;
    
    let key = '';
    
    if (bounds) {
      key += `bounds:${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()},${bounds.getWest()}`;
    } else if (center && radius) {
      key += `center:${center.lat},${center.lng}|radius:${radius}`;
    } else if (coordinates && coordinates.length > 0) {
      key += `coords:${coordinates.map(c => `${c[0]},${c[1]}`).join('|')}`;
    }
    
    if (filters) {
      key += `|filters:${JSON.stringify(filters)}`;
    }
    
    if (pagination) {
      key += `|page:${pagination.page}|limit:${pagination.limit}`;
    }
    
    return key;
  }

  // Nettoyage des entrées périmées du cache
  private cleanCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.response.timestamp > this.cacheDuration) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Gestion de la taille maximale du cache (LRU)
  private ensureCacheSize(): void {
    if (this.cache.size <= this.cacheSize) return;
    
    // Trier les entrées par timestamp (les plus anciennes d'abord)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].response.timestamp - b[1].response.timestamp);
    
    // Supprimer les entrées les plus anciennes jusqu'à atteindre la taille souhaitée
    const toDelete = entries.slice(0, entries.length - this.cacheSize);
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  // Récupérer les données avec mise en cache
  async fetchData(params: ApiParams): Promise<{ data: ApiData[], total: number }> {
    this.cleanCache(); // Nettoyer le cache des entrées périmées
    
    const cacheKey = this.generateCacheKey(params);
    const cachedItem = this.cache.get(cacheKey);
    
    // Si les données sont en cache et valides, les retourner
    if (cachedItem) {
      console.log('Utilisation du cache pour la requête:', cacheKey);
      return {
        data: cachedItem.response.data,
        total: cachedItem.response.total
      };
    }
    
    // Sinon, faire un appel API
    console.log('Appel API pour la requête:', cacheKey);
    const response = await throttledFetchData(params);
    
    // Mettre en cache la réponse
    this.cache.set(cacheKey, {
      key: cacheKey,
      response: {
        data: response.data,
        total: response.total,
        timestamp: Date.now()
      }
    });
    
    this.ensureCacheSize(); // Vérifier la taille du cache
    
    return response;
  }

  // Vider le cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtenir des informations sur l'état du cache
  getCacheStats(): { size: number, maxSize: number, duration: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize,
      duration: this.cacheDuration
    };
  }
}

// Exporter une instance unique du service de cache
export const apiCacheService = new ApiCacheService();

// Fonction pratique pour récupérer des données avec mise en cache
export const fetchDataWithCache = async (params: ApiParams): Promise<{ data: ApiData[], total: number }> => {
  return apiCacheService.fetchData(params);
}; 