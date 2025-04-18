'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
// Importer GeometryUtil pour les calculs d'aire
import 'leaflet-geometryutil';
import { DrawMode, DrawnShape, ApiData } from '../types';
import DataVisualization from './DataVisualization';
import MapLegend from './MapLegend';
import ZoneInfo from './ZoneInfo';
import SearchBar from './SearchBar';
import { throttledFetchData } from '../services/api';

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
    <div className="shape-actions">
      <button 
        className="shape-action-button action-edit"
        onClick={onEdit}
        aria-label="Éditer la forme"
      >
        Éditer
      </button>
      <button 
        className="shape-action-button action-center"
        onClick={onCenter}
        aria-label="Centrer sur la forme"
      >
        Centrer
      </button>
      <button 
        className="shape-action-button action-delete"
        onClick={onDelete}
        aria-label="Supprimer la forme"
      >
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
  const [filteredTypes, setFilteredTypes] = useState<string[]>(['restaurant', 'hospital', 'school', 'park', 'store']);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris
  const [mapZoom, setMapZoom] = useState(13);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string | null>(null);
  
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
        const response = await throttledFetchData({
          bounds: new L.LatLngBounds(
            [mapCenter[0] - 0.05, mapCenter[1] - 0.05],
            [mapCenter[0] + 0.05, mapCenter[1] + 0.05]
          ),
          pagination: { page: 1, limit: 30 }
        });
        setPointsOfInterest(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des points d\'intérêt:', error);
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
      default: return 'gray';
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
        <div className="search-location-info">
          Lieu sélectionné: <strong>{searchLocation}</strong>
          <button 
            className="search-location-clear"
            onClick={() => setSearchLocation(null)}
            aria-label="Effacer le lieu"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="controls-container">
        <button
          className={`control-button rectangle ${drawMode === 'rectangle' ? 'active' : ''}`}
          onClick={() => handleSetDrawMode('rectangle')}
          aria-label="Dessiner un rectangle"
        >
          Rectangle
        </button>
        <button
          className={`control-button circle ${drawMode === 'circle' ? 'active' : ''}`}
          onClick={() => handleSetDrawMode('circle')}
          aria-label="Dessiner un cercle"
        >
          Cercle
        </button>
        <button
          className={`control-button polygon ${drawMode === 'polygon' ? 'active' : ''}`}
          onClick={() => handleSetDrawMode('polygon')}
          aria-label="Dessiner un polygone"
        >
          Polygone
        </button>
        <button
          className="control-button clear"
          onClick={handleClearShapes}
          aria-label="Effacer les formes"
        >
          Effacer
        </button>
      </div>
      
      <div className="map-container">
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
                circle: drawMode === 'circle',
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
          
          {/* Légende de la carte */}
          <MapLegend onFilterChange={handleFilterChange} />
          
          <MapController center={mapCenter} zoom={mapZoom} setMapRef={setMapRef} />
        </MapContainer>
        
        {/* Afficher les informations sur la zone sélectionnée */}
        {selectedShape && <ZoneInfo shape={selectedShape} />}
        
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
        <div className="loading-indicator">Chargement des points d&apos;intérêt...</div>
      )}
      
      {selectedShape && <DataVisualization shape={selectedShape} />}
    </div>
  );
};

export default MapComponent;