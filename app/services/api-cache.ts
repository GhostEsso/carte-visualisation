'use client';

import { ApiParams, ApiData } from '../types';
import { fetchOSMData, clearOSMCache, getOSMCacheStats } from './osm-api';

// Le cache vit dans osm-api (une entrée par zone). Ce module n'ajoute pas de seconde
// couche : elle dupliquait les entrées par tri/page et mettait en cache les échecs.
export const apiCacheService = {
  fetchData: fetchOSMData,
  clearCache: clearOSMCache,
  getCacheStats: getOSMCacheStats
};

// Fonction pratique pour récupérer des données avec mise en cache
export const fetchDataWithCache = fetchOSMData;

// Fonction throttled pour limiter les appels trop fréquents
// Utile pour les opérations comme le déplacement de carte
let throttleTimer: number | null = null;
let rejectPending: ((reason: Error) => void) | null = null;
const throttleDelay = 500; // 500ms de délai entre les appels

export const throttledFetchData = async (params: ApiParams): Promise<{ data: ApiData[], total: number }> => {
  return new Promise((resolve, reject) => {
    // Annuler tout timer existant et rejeter l'appel qu'il remplace,
    // sinon sa promesse resterait en attente indéfiniment
    if (throttleTimer !== null) {
      clearTimeout(throttleTimer);
      rejectPending?.(new Error('Requête remplacée par une requête plus récente'));
    }

    rejectPending = reject;

    // Créer un nouveau timer
    throttleTimer = window.setTimeout(async () => {
      throttleTimer = null;
      rejectPending = null;

      try {
        resolve(await fetchDataWithCache(params));
      } catch (error) {
        reject(error);
      }
    }, throttleDelay);
  });
};
