import { LatLngBounds, LatLngTuple, LatLng } from 'leaflet';

// Types pour les formes dessinées
/**
 * Représente une forme géométrique dessinée sur la carte (Rectangle, Polygone, etc.).
 * Contient toutes les informations géospatiales nécessaires pour interroger l'API.
 */
export interface DrawnShape {
  id: string;
  type: 'rectangle' | 'circle' | 'polygon';
  coordinates: LatLngTuple[] | LatLngTuple[][];
  bounds?: LatLngBounds;
  radius?: number;
  center?: LatLng;
}

// Type pour les modes de dessin
export type DrawMode = 'rectangle' | 'polygon' | null;

// Types pour les états de chargement
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Types pour les données récupérées (à adapter selon l'API utilisée)
/**
 * Interface normalisée pour les données récupérées depuis l'API (ex: Overpass).
 * Standardise les POI (Points of Interest) pour l'affichage dans l'application.
 */
export interface ApiData {
  id: string;
  name: string;
  description?: string;
  value: number; // Valeur arbitraire d'importance ou statistique
  coordinates: LatLngTuple;
  type: string; // Type du lieu (restaurant, école, etc.)
  // Informations de contact
  phone?: string;
  email?: string;
  website?: string;
}

// Configuration pour les filtres
export interface FilterOptions {
  type?: string;
  minValue?: number;
  maxValue?: number;
  sortBy?: keyof ApiData;
  sortOrder?: 'asc' | 'desc';
}

// Options de pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

// Paramètres pour les appels API
/**
 * Arguments passés aux services pour récupérer les données.
 * Combine géographie, filtres et pagination.
 */
export interface ApiParams {
  bounds?: LatLngBounds;
  center?: LatLng;
  radius?: number;
  coordinates?: LatLngTuple[];
  filters?: FilterOptions;
  pagination?: {
    page: number;
    limit: number;
  };
} 