'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
// Importer GeometryUtil pour les calculs d'aire
import 'leaflet-geometryutil';
import { DrawMode, DrawnShape, ApiData } from '../types';
import { fetchDataWithCache, throttledFetchData } from '../services/api-cache';
import DataVisualization from './DataVisualization';
import MapLegend from './MapLegend';
import ZoneInfo from './ZoneInfo';
import SearchBar from './SearchBar';

// Types étendus pour Leaflet
declare module 'leaflet' {
  interface IconDefaultPrototype {
    _getIconUrl?: string;
  }
  
  // eslint-disable-next-line
  namespace Icon {
    interface Default {
      prototype: IconDefaultPrototype;
    }
  }
}

// Correction pour les icônes Leaflet en environnement Next.js
// Importera les icônes côté client uniquement
const fixLeafletIcons = () => {
  // @ts-expect-error - _getIconUrl existe dans l'implémentation mais pas dans les types
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

// Composant pour centrer la vue de la carte et garder une référence
const MapController = ({ 
  center, 
  zoom,
  setMapRef
}: { 
  center: [number, number], 
  zoom: number,
  setMapRef: (map: L.Map) => void
}) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
    setMapRef(map);
  }, [center, zoom, map, setMapRef]);
  
  return null;
};

// Composant pour les actions sur la forme sélectionnée
interface ShapeActionsProps {
  onEdit: () => void;
  onCenter: () => void;
  onDelete: () => void;
}

const ShapeActions = ({ onEdit, onCenter, onDelete }: ShapeActionsProps) => {
  return (
    <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-[1000] bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg">
      <button 
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center"
        onClick={onEdit}
        aria-label="Éditer la forme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Éditer
      </button>
      <button 
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center"
        onClick={onCenter}
        aria-label="Centrer sur la forme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Centrer
      </button>
      <button 
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center"
        onClick={onDelete}
        aria-label="Supprimer la forme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Supprimer
      </button>
    </div>
  );
};

// Ajouter une interface pour l'événement de création
interface DrawCreatedEvent {
  layerType: string;
  layer: L.Layer & {
    getBounds?: () => L.LatLngBounds;
    getLatLng?: () => L.LatLng;
    getRadius?: () => number;
    getLatLngs?: () => L.LatLng[][];
  };
}

// Interface pour l'événement d'édition
interface DrawEditedEvent {
  layers: {
    eachLayer: (callback: (layer: L.Layer & {
      getBounds?: () => L.LatLngBounds;
      getLatLng?: () => L.LatLng;
      getRadius?: () => number;
      getLatLngs?: () => L.LatLng[][];
    }) => void) => void;
  };
}

const MapComponent = () => {
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [selectedShape, setSelectedShape] = useState<DrawnShape | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<ApiData[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<string[]>([
    'restaurant', 'hospital', 'school', 'park', 'store', 
    'transport', 'public_service', 'tourism', 'bank', 'worship', 'other'
  ]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris
  const [mapZoom, setMapZoom] = useState(13);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string | null>(null);
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  
  useEffect(() => {
    // Corriger les icônes Leaflet
    fixLeafletIcons();
  }, []);
  
  // Récupérer les points d'intérêt initiaux
  useEffect(() => {
    const fetchInitialPoints = async () => {
      setLoading(true);
      try {
        // Créer une zone plus large autour du centre pour les points initiaux
        const padding = 0.05; // ~5km à cette latitude
        const response = await throttledFetchData({
          bounds: new L.LatLngBounds(
            [mapCenter[0] - padding, mapCenter[1] - padding],
            [mapCenter[0] + padding, mapCenter[1] + padding]
          ),
          pagination: { page: 1, limit: 100 } // Augmenter la limite pour récupérer plus de points
        });
        
        if (response && response.data) {
          setPointsOfInterest(response.data);
        } else {
          console.warn('Aucun point d\'intérêt trouvé pour cette zone');
          setPointsOfInterest([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des points d\'intérêt:', error);
        setPointsOfInterest([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialPoints();
  }, [mapCenter]);
  
  // Gestionnaire pour les formes créées
  const handleCreated = (e: DrawCreatedEvent) => {
    const { layerType, layer } = e;
    
    let newShape: DrawnShape;
    
    if (layerType === 'rectangle') {
      if (!layer.getBounds) return;
      const bounds = layer.getBounds();
      const corners = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest()
      ];
      
      newShape = {
        id: `rect-${Date.now()}`,
        type: 'rectangle',
        coordinates: corners.map(corner => [corner.lat, corner.lng]),
        bounds: bounds
      };
      
      // Centrer la carte sur la forme
      setMapCenter([
        (bounds.getNorth() + bounds.getSouth()) / 2,
        (bounds.getEast() + bounds.getWest()) / 2
      ]);
      setMapZoom(14);
    } else if (layerType === 'circle') {
      if (!layer.getLatLng || !layer.getRadius) return;
      newShape = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        coordinates: [[layer.getLatLng().lat, layer.getLatLng().lng]],
        center: layer.getLatLng(),
        radius: layer.getRadius()
      };
      
      // Centrer la carte sur le cercle
      setMapCenter([layer.getLatLng().lat, layer.getLatLng().lng]);
      setMapZoom(Math.max(14, 16 - Math.log2(layer.getRadius() / 100)));
    } else if (layerType === 'polygon') {
      if (!layer.getLatLngs || !layer.getBounds) return;
      const latlngs = layer.getLatLngs()[0];
      const bounds = layer.getBounds();
      
      newShape = {
        id: `poly-${Date.now()}`,
        type: 'polygon',
        coordinates: latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]),
        bounds: bounds
      };
      
      // Centrer la carte sur le polygone
      setMapCenter([
        (bounds.getNorth() + bounds.getSouth()) / 2,
        (bounds.getEast() + bounds.getWest()) / 2
      ]);
      setMapZoom(14);
    } else {
      // Type non supporté
      return;
    }
    
    setSelectedShape(newShape);
    setDrawMode(null);
  };
  
  // Gestionnaire pour les formes éditées
  const handleEdited = (e: DrawEditedEvent) => {
    const layers = e.layers;
    
    layers.eachLayer((layer) => {
      if (!selectedShape) return;
      
      if (selectedShape.type === 'rectangle') {
        if (!layer.getBounds) return;
        const bounds = layer.getBounds();
        const corners = [
          bounds.getNorthWest(),
          bounds.getNorthEast(),
          bounds.getSouthEast(),
          bounds.getSouthWest()
        ];
        
        setSelectedShape({
          ...selectedShape,
          coordinates: corners.map(corner => [corner.lat, corner.lng]),
          bounds: bounds
        });
      } else if (selectedShape.type === 'circle') {
        if (!layer.getLatLng || !layer.getRadius) return;
        setSelectedShape({
          ...selectedShape,
          coordinates: [[layer.getLatLng().lat, layer.getLatLng().lng]],
          center: layer.getLatLng(),
          radius: layer.getRadius()
        });
      } else if (selectedShape.type === 'polygon') {
        if (!layer.getLatLngs || !layer.getBounds) return;
        const latlngs = layer.getLatLngs()[0];
        
        setSelectedShape({
          ...selectedShape,
          coordinates: latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]),
          bounds: layer.getBounds()
        });
      }
    });
    
    setIsEditMode(false);
  };
  
  // Gérer le changement de mode de dessin
  const handleSetDrawMode = (mode: DrawMode) => {
    if (featureGroupRef.current) {
      // Effacer les formes existantes
      featureGroupRef.current.clearLayers();
      setSelectedShape(null);
    }
    
    setDrawMode(mode);
    setIsEditMode(false);
  };
  
  // Effacer toutes les formes
  const handleClearShapes = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setSelectedShape(null);
    }
    setIsEditMode(false);
  };
  
  // Activer le mode d'édition
  const handleEditShape = () => {
    setIsEditMode(true);
  };
  
  // Centrer la carte sur la forme sélectionnée
  const handleCenterOnShape = () => {
    if (!selectedShape || !mapRef.current) return;
    
    if (selectedShape.bounds) {
      mapRef.current.fitBounds(selectedShape.bounds);
    } else if (selectedShape.center && selectedShape.radius) {
      mapRef.current.setView(
        [selectedShape.center.lat, selectedShape.center.lng],
        Math.max(14, 16 - Math.log2(selectedShape.radius / 100))
      );
    }
  };
  
  // Gérer la suppression de la forme
  const handleDeleteShape = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setSelectedShape(null);
    }
  };
  
  // Gérer le changement de filtres dans la légende
  const handleFilterChange = (selectedTypes: string[]) => {
    setFilteredTypes(selectedTypes);
  };
  
  // Déterminer la couleur du marqueur en fonction du type
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'blue';
      case 'hospital': return 'red';
      case 'school': return 'green';
      case 'park': return 'darkgreen';
      case 'store': return 'orange';
      case 'transport': return 'purple';
      case 'public_service': return 'brown';
      case 'tourism': return 'pink';
      case 'bank': return 'gold';
      case 'worship': return 'gray';
      default: return 'black';
    }
  };
  
  // Créer une icône personnalisée pour les marqueurs
  const createIcon = (type: string) => {
    const color = getMarkerColor(type);
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };
  
  // Gérer la sélection de lieu depuis la recherche
  const handleLocationSelect = (location: { 
    center: [number, number]; 
    bounds?: L.LatLngBounds;
    name: string;
  }) => {
    setLoading(true);
    
    // Définir le centre de la carte et le niveau de zoom
    setMapCenter(location.center);
    
    if (location.bounds) {
      if (mapRef.current) {
        mapRef.current.fitBounds(location.bounds);
      } else {
        setMapZoom(12); // Zoom par défaut si on ne peut pas ajuster sur les limites
      }
    } else {
      setMapZoom(14);
    }
    
    setSearchLocation(location.name);
    
    // Effacer les formes existantes si nécessaire
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setSelectedShape(null);
    }
    
    // Charger les nouveaux points d'intérêt pour cette zone
    const fetchPointsForLocation = async () => {
      try {
        // Créer une zone plus large autour du centre pour récupérer les points
        const padding = 0.05; // ~5km d'extension autour du point
        const response = await throttledFetchData({
          bounds: location.bounds || new L.LatLngBounds(
            [location.center[0] - padding, location.center[1] - padding],
            [location.center[0] + padding, location.center[1] + padding]
          ),
          pagination: { page: 1, limit: 150 }
        });
        
        if (response && response.data) {
          setPointsOfInterest(response.data);
        } else {
          console.warn('Aucun point d\'intérêt trouvé pour cette recherche');
          setPointsOfInterest([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des points d\'intérêt pour la recherche:', error);
        setPointsOfInterest([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPointsForLocation();
  };
  
  // Mettre à jour la référence de la carte
  const setMapRef = (map: L.Map) => {
    mapRef.current = map;
  };
  
  return (
    <div>
      {/* Ajouter la barre de recherche au-dessus des contrôles de dessin */}
      <SearchBar onLocationSelect={handleLocationSelect} />
      
      {searchLocation && (
        <div className="flex items-center p-2 mb-3 bg-gray-50 dark:bg-slate-700 rounded text-sm">
          Lieu sélectionné: <strong className="mx-1">{searchLocation}</strong>
          <button 
            className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 focus:outline-none"
            onClick={() => setSearchLocation(null)}
            aria-label="Effacer le lieu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4 mt-6">
        <button
          className={`px-4 py-2 text-sm font-medium rounded text-white transition-colors ${
            drawMode === 'rectangle' 
              ? 'bg-primary-700' 
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
          onClick={() => handleSetDrawMode('rectangle')}
          aria-label="Dessiner un rectangle"
        >
          Rectangle
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded text-white transition-colors ${
            drawMode === 'polygon' 
              ? 'bg-purple-700' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          onClick={() => handleSetDrawMode('polygon')}
          aria-label="Dessiner un polygone"
        >
          Polygone
        </button>
        <button
          className="px-4 py-2 text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
          onClick={handleClearShapes}
          aria-label="Effacer les formes"
        >
          Effacer
        </button>
      </div>
      
      <div className="relative w-full h-[70vh] rounded-lg overflow-hidden shadow-md mb-6">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Afficher les points d'intérêt filtrés */}
          {!selectedShape && pointsOfInterest
            .filter(point => filteredTypes.includes(point.type))
            .map(point => (
              <Marker 
                key={point.id} 
                position={point.coordinates as [number, number]}
                icon={createIcon(point.type)}
              >
                <Popup>
                  <div>
                    <h3>{point.name}</h3>
                    <p>Type: {point.type}</p>
                    <p>Valeur: {point.value}</p>
                    {point.description && <p>{point.description}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              draw={{
                rectangle: drawMode === 'rectangle',
                circle: false,
                polygon: drawMode === 'polygon',
                polyline: false,
                circlemarker: false,
                marker: false,
              }}
              edit={{
                edit: isEditMode,
                remove: false,
                poly: {
                  allowIntersection: false
                },
                featureGroup: featureGroupRef.current
              }}
            />
          </FeatureGroup>
          
          {/* Afficher les informations sur la zone sélectionnée au-dessus de la légende */}
          {selectedShape && (
            <div className="leaflet-top leaflet-right" style={{ marginTop: '60px', marginRight: '10px', zIndex: 1000 }}>
              <div className="leaflet-control bg-white/95 dark:bg-slate-800/95 p-2 rounded-lg shadow-sm max-w-[200px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">Zone sélectionnée</span>
                  <button 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-0.5 rounded"
                    onClick={() => setInfoCollapsed(!infoCollapsed)}
                    aria-label={infoCollapsed ? "Développer" : "Réduire"}
                  >
                    {infoCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </div>
                {!infoCollapsed && <ZoneInfo shape={selectedShape} />}
              </div>
            </div>
          )}
          
          {/* Légende de la carte */}
          <MapLegend onFilterChange={handleFilterChange} />
          
          <MapController center={mapCenter} zoom={mapZoom} setMapRef={setMapRef} />
        </MapContainer>
        
        {/* Afficher les actions sur la forme sélectionnée */}
        {selectedShape && !isEditMode && (
          <ShapeActions 
            onEdit={handleEditShape}
            onCenter={handleCenterOnShape}
            onDelete={handleDeleteShape}
          />
        )}
      </div>
      
      {loading && !selectedShape && (
        <div className="flex items-center justify-center p-6 bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin-slow h-10 w-10 text-primary-500">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="text-gray-600 dark:text-gray-300">Chargement des points d&apos;intérêt...</div>
          </div>
        </div>
      )}
      
      {selectedShape && <DataVisualization shape={selectedShape} />}
    </div>
  );
};

export default MapComponent;