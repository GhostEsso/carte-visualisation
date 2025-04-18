import { LatLngBounds, LatLngTuple, LatLng } from 'leaflet';

// Types pour les formes dessinées
export interface DrawnShape {
  id: string;
  type: 'rectangle' | 'circle' | 'polygon';
  coordinates: LatLngTuple[] | LatLngTuple[][];
  bounds?: LatLngBounds;
  radius?: number;
  center?: LatLng;
}

// Type pour les modes de dessin
export type DrawMode = 'rectangle' | 'circle' | 'polygon' | null;

// Types pour les états de chargement
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Types pour les données récupérées (à adapter selon l'API utilisée)
export interface ApiData {
  id: string;
  name: string;
  description?: string;
  value: number;
  coordinates: LatLngTuple;
  type: string;
  // Autres propriétés selon l'API
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