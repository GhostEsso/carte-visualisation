'use client';

import { DrawnShape } from '../types';
import L from 'leaflet';

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
  return L.latLng(point1[0], point1[1]).distanceTo(L.latLng(point2[0], point2[1]));
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
    <div className="zone-info">
      <h4>Informations sur la zone sélectionnée</h4>
      <div className="zone-info-details">
        <div className="zone-info-item">
          <span className="zone-info-label">Type:</span>
          <span className="zone-info-value">
            {shape.type === 'rectangle' && 'Rectangle'}
            {shape.type === 'circle' && 'Cercle'}
            {shape.type === 'polygon' && 'Polygone'}
          </span>
        </div>
        <div className="zone-info-item">
          <span className="zone-info-label">Aire:</span>
          <span className="zone-info-value">{formattedArea}</span>
        </div>
        <div className="zone-info-item">
          <span className="zone-info-label">
            {shape.type === 'circle' ? 'Circonférence:' : 'Périmètre:'}
          </span>
          <span className="zone-info-value">{formattedPerimeter}</span>
        </div>
        <div className="zone-info-item">
          <span className="zone-info-label">Centre:</span>
          <span className="zone-info-value">{center}</span>
        </div>
        {shape.type === 'circle' && shape.radius && (
          <div className="zone-info-item">
            <span className="zone-info-label">Rayon:</span>
            <span className="zone-info-value">
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