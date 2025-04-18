'use client';

import { ApiData } from '../types';

/**
 * Convertit des données en CSV
 */
export const convertToCSV = (data: ApiData[]): string => {
  if (data.length === 0) return '';
  
  // Entêtes
  const headers = Object.keys(data[0]).filter(key => key !== 'id');
  const headerRow = headers.join(',');
  
  // Lignes de données
  const dataRows = data.map(item => {
    return headers
      .map(header => {
        const value = item[header as keyof ApiData];
        
        // Gérer les types spéciaux (arrays, objects) et échapper les chaînes contenant des virgules
        if (Array.isArray(value)) {
          return `"${value.join(' ')}"`;
        } else if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      })
      .join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Convertit des données en GeoJSON
 */
export const convertToGeoJSON = (data: ApiData[]): string => {
  const features = data.map(item => {
    const [lat, lng] = item.coordinates;
    
    return {
      type: 'Feature',
      properties: {
        id: item.id,
        name: item.name,
        description: item.description || '',
        value: item.value,
        type: item.type
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON utilise [longitude, latitude]
      }
    };
  });
  
  const geoJSON = {
    type: 'FeatureCollection',
    features
  };
  
  return JSON.stringify(geoJSON, null, 2);
};

/**
 * Convertit des données en JSON
 */
export const convertToJSON = (data: ApiData[]): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Exporte les données au format spécifié et déclenche le téléchargement
 */
export const exportData = (data: ApiData[], format: 'csv' | 'json' | 'geojson', fileName?: string): void => {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }
  
  let content = '';
  let mimeType = '';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  let defaultFileName = `export-donnees-${timestamp}`;
  
  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv;charset=utf-8';
      defaultFileName += '.csv';
      break;
    case 'json':
      content = convertToJSON(data);
      mimeType = 'application/json';
      defaultFileName += '.json';
      break;
    case 'geojson':
      content = convertToGeoJSON(data);
      mimeType = 'application/geo+json';
      defaultFileName += '.geojson';
      break;
    default:
      console.error('Format d\'export non reconnu:', format);
      return;
  }
  
  // Créer un blob et un lien de téléchargement
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || defaultFileName;
  document.body.appendChild(a);
  a.click();
  
  // Nettoyer
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}; 