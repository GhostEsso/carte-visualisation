import { ApiData, ApiParams } from '../types';

// Simuler un délai pour les appels API
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Générer des données de test aléatoires basées sur les coordonnées
const generateMockData = (params: ApiParams): ApiData[] => {
  const { bounds, center, radius, coordinates } = params;
  const mockData: ApiData[] = [];
  
  // Vérifier si la zone est petite/spécifique
  let isSmallArea = false;
  
  if (bounds) {
    const areaWidth = bounds.getEast() - bounds.getWest();
    const areaHeight = bounds.getNorth() - bounds.getSouth();
    isSmallArea = areaWidth < 0.01 && areaHeight < 0.01;
  } else if (center && radius) {
    isSmallArea = radius < 200; // Moins de 200 mètres
  } else if (coordinates && coordinates.length > 2) {
    // Polygone avec peu de points et zone restreinte
    isSmallArea = coordinates.length < 5;
  }
  
  // Probabilité que la zone soit vide (50% pour les petites zones)
  const emptyAreaProbability = isSmallArea ? 0.5 : 0.05;
  
  if (Math.random() < emptyAreaProbability) {
    // Retourner un tableau vide pour simuler une zone sans points d'intérêt
    return [];
  }
  
  // Nombre d'éléments à générer
  const count = Math.floor(Math.random() * 30) + 5;
  
  // Types de données possibles
  const types = ['restaurant', 'hospital', 'school', 'park', 'store'];
  
  // Générer des données dans les limites ou autour du centre
  for (let i = 0; i < count; i++) {
    let lat: number, lng: number;
    
    if (bounds) {
      // Générer des coordonnées dans les limites
      lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
      lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
    } else if (center && radius) {
      // Générer des coordonnées dans un rayon autour du centre
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const latOffset = distance * Math.cos(angle) / 111111;
      const lngOffset = distance * Math.sin(angle) / (111111 * Math.cos(center.lat * Math.PI / 180));
      lat = center.lat + latOffset;
      lng = center.lng + lngOffset;
    } else if (coordinates && coordinates.length > 0) {
      // Utiliser la première coordonnée comme base
      const [baseLat, baseLng] = coordinates[0];
      lat = baseLat + (Math.random() - 0.5) * 0.1;
      lng = baseLng + (Math.random() - 0.5) * 0.1;
    } else {
      // Coordonnées par défaut si aucune forme n'est fournie
      lat = 48.8566 + (Math.random() - 0.5) * 0.1;
      lng = 2.3522 + (Math.random() - 0.5) * 0.1;
    }
    
    // Créer une entrée de données
    mockData.push({
      id: `id-${i}-${Date.now()}`,
      name: `Point d'intérêt ${i + 1}`,
      description: `Description pour le point d'intérêt ${i + 1}`,
      value: Math.floor(Math.random() * 100),
      coordinates: [lat, lng],
      type: types[Math.floor(Math.random() * types.length)]
    });
  }
  
  return mockData;
};

// Fonction pour récupérer les données depuis l'API
export const fetchDataByRegion = async (params: ApiParams): Promise<{
  data: ApiData[],
  total: number
}> => {
  try {
    // Simuler une latence réseau
    await simulateDelay(800);
    
    // Générer des données aléatoires
    let data = generateMockData(params);
    const total = data.length;
    
    // Appliquer les filtres si présents
    if (params.filters) {
      const { type, minValue, maxValue, sortBy, sortOrder } = params.filters;
      
      if (type) {
        data = data.filter(item => item.type === type);
      }
      
      if (minValue !== undefined) {
        data = data.filter(item => item.value >= minValue);
      }
      
      if (maxValue !== undefined) {
        data = data.filter(item => item.value <= maxValue);
      }
      
      if (sortBy) {
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
    }
    
    // Appliquer la pagination
    if (params.pagination) {
      const { page, limit } = params.pagination;
      const startIndex = (page - 1) * limit;
      data = data.slice(startIndex, startIndex + limit);
    }
    
    return { data, total };
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw new Error('Impossible de récupérer les données pour cette région.');
  }
};

// Variables pour limiter les appels API
let lastCallTime = 0;
const throttleDelay = 500; // ms

// Fonction avec limitation des appels API
export const throttledFetchData = async (params: ApiParams): Promise<{
  data: ApiData[],
  total: number
}> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < throttleDelay) {
    await simulateDelay(throttleDelay - timeSinceLastCall);
  }
  
  lastCallTime = Date.now();
  return await fetchDataByRegion(params);
}; 