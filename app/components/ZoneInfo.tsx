'use client';

import { DrawnShape } from '../types';
import L from 'leaflet';

// Étendre les types pour Leaflet-GeometryUtil
declare module 'leaflet' {
  // eslint-disable-next-line
  namespace GeometryUtil {
    function geodesicArea(latLngs: L.LatLng[]): number;
  }
}

interface ZoneInfoProps {
  shape: DrawnShape;
}

// Fonction pour calculer l'aire en m² d'un polygone
const calculatePolygonArea = (coordinates: [number, number][]) => {
  const latlngs = coordinates.map(([lat, lng]) => L.latLng(lat, lng));
  return L.GeometryUtil.geodesicArea(latlngs);
};

// Fonction pour calculer l'aire d'un cercle
const calculateCircleArea = (radius: number) => {
  return Math.PI * (radius * radius);
};

// Fonction pour calculer la distance entre deux points
const calculateDistance = (point1: [number, number], point2: [number, number]) => {
  try {
    const distance = L.latLng(point1[0], point1[1]).distanceTo(L.latLng(point2[0], point2[1]));
    // Vérifier que la distance est un nombre valide
    return typeof distance === 'number' && !isNaN(distance) ? distance : 0;
  } catch (error) {
    console.error('Erreur lors du calcul de la distance:', error);
    return 0;
  }
};

// Formater les nombres pour l'affichage
const formatNumber = (num: number, decimals = 2) => {
  return num.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
};

const ZoneInfo = ({ shape }: ZoneInfoProps) => {
  // Calculer l'aire selon le type de forme
  const calculateArea = () => {
    if (shape.type === 'rectangle' || shape.type === 'polygon') {
      return calculatePolygonArea(shape.coordinates as [number, number][]);
    } else if (shape.type === 'circle' && shape.radius) {
      return calculateCircleArea(shape.radius);
    }
    return 0;
  };

  // Calculer le périmètre/circonférence
  const calculatePerimeter = () => {
    if (shape.type === 'rectangle' || shape.type === 'polygon') {
      const coords = shape.coordinates as [number, number][];
      let perimeter = 0;
      
      for (let i = 0; i < coords.length; i++) {
        const nextIndex = (i + 1) % coords.length;
        perimeter += calculateDistance(coords[i], coords[nextIndex]);
      }
      
      return perimeter;
    } else if (shape.type === 'circle' && shape.radius) {
      return 2 * Math.PI * shape.radius;
    }
    return 0;
  };

  // Obtenir le centre de la forme
  const getCenter = () => {
    if (shape.center) {
      return `${shape.center.lat.toFixed(6)}, ${shape.center.lng.toFixed(6)}`;
    } else if (shape.bounds) {
      const center = shape.bounds.getCenter();
      return `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
    }
    return 'Non disponible';
  };

  const area = calculateArea();
  const perimeter = calculatePerimeter();
  const center = getCenter();

  // Formater l'aire pour l'affichage
  const formattedArea = area > 1000000 
    ? `${formatNumber(area / 1000000)} km²` 
    : `${formatNumber(area)} m²`;

  // Formater le périmètre pour l'affichage
  const formattedPerimeter = perimeter > 1000 
    ? `${formatNumber(perimeter / 1000)} km` 
    : `${formatNumber(perimeter)} m`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Informations sur la zone sélectionnée</h4>
      <div className="space-y-2">
        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {shape.type === 'rectangle' && 'Rectangle'}
            {shape.type === 'circle' && 'Cercle'}
            {shape.type === 'polygon' && 'Polygone'}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Aire:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{formattedArea}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {shape.type === 'circle' ? 'Circonférence:' : 'Périmètre:'}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{formattedPerimeter}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Centre:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{center}</span>
        </div>
        {shape.type === 'circle' && shape.radius && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Rayon:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {shape.radius > 1000 
                ? `${formatNumber(shape.radius / 1000)} km` 
                : `${formatNumber(shape.radius)} m`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneInfo; 