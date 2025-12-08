'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geometryutil';
import { DrawMode, DrawnShape, ApiData } from '../types';
import { throttledFetchData } from '../services/api-cache';
import DataVisualization from './DataVisualization';
import MapLegend from './MapLegend';
import ZoneInfo from './ZoneInfo';
import SearchBar from './SearchBar';
import Tooltip from './Tooltip';

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

// Correction pour les icônes Leaflet - exécutée une seule fois
let leafletIconsFixed = false;
/**
 * Corrige le problème des chemins d'icônes par défaut de Leaflet avec Webpack/Next.js.
 * Réinitialise les prototypes d'icônes et définit les URL manuelles vers les assets Leaflet.
 */
const fixLeafletIcons = () => {
    if (leafletIconsFixed) return;
    // @ts-expect-error - _getIconUrl existe dans l'implémentation
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    leafletIconsFixed = true;
};

/**
 * Composant Helper pour contrôler la carte Leaflet de manière déclarative.
 * Gère le centrage, le zoom et signale quand la carte est prête.
 * 
 * @param props.center - Coordonnées du centre de la carte [lat, lng]
 * @param props.zoom - Niveau de zoom (ex: 13)
 * @param props.onMapReady - Callback appelé une fois lors de l'initialisation
 */
const MapController = ({
    center,
    zoom,
    onMapReady
}: {
    center: [number, number];
    zoom: number;
    onMapReady: (map: L.Map) => void;
}) => {
    const map = useMap();
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            onMapReady(map);
        }
        map.setView(center, zoom);
    }, [center, zoom, map, onMapReady]);

    return null;
};

// Composant pour les actions sur la forme
interface ShapeActionsProps {
    onEdit: () => void;
    onCenter: () => void;
    onDelete: () => void;
}

/**
 * Barre d'outils flottante pour les actions sur la forme dessinée.
 * Affiche des boutons pour éditer, centrer ou supprimer la zone sélectionnée.
 * Responsive : s'adapte horizontalement sur mobile et verticalement sur desktop.
 * 
 * @param props.onEdit - Fonction pour activer le mode édition
 * @param props.onCenter - Fonction pour recentrer la carte sur la forme
 * @param props.onDelete - Fonction pour supprimer la forme
 */
const ShapeActions = ({ onEdit, onCenter, onDelete }: ShapeActionsProps) => (
    <div className="absolute bottom-16 sm:bottom-24 right-2 sm:right-4 flex flex-row sm:flex-col gap-1 sm:gap-2 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg shadow-lg">
        <Tooltip content="Éditer la forme" position="left">
            <button
                className="p-2 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center touch-target active:scale-95"
                onClick={onEdit}
                aria-label="Éditer la forme"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Éditer</span>
            </button>
        </Tooltip>

        <Tooltip content="Centrer sur la forme" position="left">
            <button
                className="p-2 sm:px-3 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center touch-target active:scale-95"
                onClick={onCenter}
                aria-label="Centrer sur la forme"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">Centrer</span>
            </button>
        </Tooltip>

        <Tooltip content="Supprimer la forme" position="left">
            <button
                className="p-2 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded shadow-md transition-colors flex items-center justify-center touch-target active:scale-95"
                onClick={onDelete}
                aria-label="Supprimer la forme"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Supprimer</span>
            </button>
        </Tooltip>
    </div>
);

// Interfaces pour les événements
interface DrawCreatedEvent {
    layerType: string;
    layer: L.Layer & {
        getBounds?: () => L.LatLngBounds;
        getLatLng?: () => L.LatLng;
        getRadius?: () => number;
        getLatLngs?: () => L.LatLng[][];
    };
}

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

// Couleurs des marqueurs
const MARKER_COLORS: Record<string, string> = {
    restaurant: 'blue',
    hospital: 'red',
    school: 'green',
    park: 'darkgreen',
    store: 'orange',
    transport: 'purple',
    public_service: 'brown',
    tourism: 'pink',
    bank: 'gold',
    worship: 'gray',
    other: 'black'
};

// Cache des icônes
const iconCache = new Map<string, L.Icon>();

const getIcon = (type: string): L.Icon => {
    if (iconCache.has(type)) {
        return iconCache.get(type)!;
    }

    const color = MARKER_COLORS[type] || 'black';
    const icon = new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    iconCache.set(type, icon);
    return icon;
};

// Composant principal de la carte
const MapContent = () => {
    const [drawMode, setDrawMode] = useState<DrawMode>(null);
    const [selectedShape, setSelectedShape] = useState<DrawnShape | null>(null);
    const [pointsOfInterest, setPointsOfInterest] = useState<ApiData[]>([]);
    const [filteredTypes, setFilteredTypes] = useState<string[]>(Object.keys(MARKER_COLORS));
    const [loading, setLoading] = useState(false);
    // Centre par défaut : Lomé, Togo (Afrique de l'Ouest)
    const [mapCenter, setMapCenter] = useState<[number, number]>([6.1725, 1.2314]);
    const [mapZoom, setMapZoom] = useState(12);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchLocation, setSearchLocation] = useState<string | null>(null);
    const [infoCollapsed, setInfoCollapsed] = useState(false);

    const mapRef = useRef<L.Map | null>(null);
    const featureGroupRef = useRef<L.FeatureGroup>(null);

    // Fix icônes au montage
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    // Récupérer les points d'intérêt initiaux
    useEffect(() => {
        let isCancelled = false;

        const fetchInitialPoints = async () => {
            setLoading(true);
            try {
                const padding = 0.05;
                const response = await throttledFetchData({
                    bounds: new L.LatLngBounds(
                        [mapCenter[0] - padding, mapCenter[1] - padding],
                        [mapCenter[0] + padding, mapCenter[1] + padding]
                    ),
                    pagination: { page: 1, limit: 100 }
                });

                if (!isCancelled && response?.data) {
                    setPointsOfInterest(response.data);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Erreur lors du chargement des points d\'intérêt:', error);
                    setPointsOfInterest([]);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchInitialPoints();

        return () => {
            isCancelled = true;
        };
    }, [mapCenter]);

    // Callback pour la référence de la carte
    const handleMapReady = useCallback((map: L.Map) => {
        mapRef.current = map;
    }, []);

    // Gestionnaire pour les formes créées
    const handleCreated = useCallback((e: DrawCreatedEvent) => {
        const { layerType, layer } = e;
        let newShape: DrawnShape | null = null;

        if (layerType === 'rectangle' && layer.getBounds) {
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

            setMapCenter([
                (bounds.getNorth() + bounds.getSouth()) / 2,
                (bounds.getEast() + bounds.getWest()) / 2
            ]);
            setMapZoom(14);
        } else if (layerType === 'circle' && layer.getLatLng && layer.getRadius) {
            const center = layer.getLatLng();
            const radius = layer.getRadius();

            newShape = {
                id: `circle-${Date.now()}`,
                type: 'circle',
                coordinates: [[center.lat, center.lng]],
                center: center,
                radius: radius
            };

            setMapCenter([center.lat, center.lng]);
            setMapZoom(Math.max(14, 16 - Math.log2(radius / 100)));
        } else if (layerType === 'polygon' && layer.getLatLngs && layer.getBounds) {
            const latlngs = layer.getLatLngs()[0];
            const bounds = layer.getBounds();

            newShape = {
                id: `poly-${Date.now()}`,
                type: 'polygon',
                coordinates: latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]),
                bounds: bounds
            };

            setMapCenter([
                (bounds.getNorth() + bounds.getSouth()) / 2,
                (bounds.getEast() + bounds.getWest()) / 2
            ]);
            setMapZoom(14);
        }

        if (newShape) {
            setSelectedShape(newShape);
            setDrawMode(null);
        }
    }, []);

    // Gestionnaire pour les formes éditées
    const handleEdited = useCallback((e: DrawEditedEvent) => {
        e.layers.eachLayer((layer) => {
            setSelectedShape(prev => {
                if (!prev) return null;

                if (prev.type === 'rectangle' && layer.getBounds) {
                    const bounds = layer.getBounds();
                    const corners = [
                        bounds.getNorthWest(),
                        bounds.getNorthEast(),
                        bounds.getSouthEast(),
                        bounds.getSouthWest()
                    ];
                    return { ...prev, coordinates: corners.map(corner => [corner.lat, corner.lng]), bounds };
                } else if (prev.type === 'circle' && layer.getLatLng && layer.getRadius) {
                    const center = layer.getLatLng();
                    return {
                        ...prev,
                        coordinates: [[center.lat, center.lng]],
                        center,
                        radius: layer.getRadius()
                    };
                } else if (prev.type === 'polygon' && layer.getLatLngs && layer.getBounds) {
                    const latlngs = layer.getLatLngs()[0];
                    return {
                        ...prev,
                        coordinates: latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]),
                        bounds: layer.getBounds()
                    };
                }
                return prev;
            });
        });

        setIsEditMode(false);
    }, []);

    const handleSetDrawMode = useCallback((mode: DrawMode) => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            setSelectedShape(null);
        }
        setDrawMode(mode);
        setIsEditMode(false);
    }, []);

    const handleClearShapes = useCallback(() => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            setSelectedShape(null);
        }
        setIsEditMode(false);
    }, []);

    const handleEditShape = useCallback(() => {
        setIsEditMode(true);
    }, []);

    const handleCenterOnShape = useCallback(() => {
        if (!selectedShape || !mapRef.current) return;

        if (selectedShape.bounds) {
            mapRef.current.fitBounds(selectedShape.bounds);
        } else if (selectedShape.center && selectedShape.radius) {
            mapRef.current.setView(
                [selectedShape.center.lat, selectedShape.center.lng],
                Math.max(14, 16 - Math.log2(selectedShape.radius / 100))
            );
        }
    }, [selectedShape]);

    const handleDeleteShape = useCallback(() => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            setSelectedShape(null);
        }
    }, []);

    const handleFilterChange = useCallback((selectedTypes: string[]) => {
        setFilteredTypes(selectedTypes);
    }, []);

    const handleLocationSelect = useCallback((location: {
        center: [number, number];
        bounds?: L.LatLngBounds;
        name: string;
    }) => {
        setLoading(true);
        setMapCenter(location.center);

        if (location.bounds && mapRef.current) {
            mapRef.current.fitBounds(location.bounds);
        } else {
            setMapZoom(14);
        }

        setSearchLocation(location.name);

        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            setSelectedShape(null);
        }

        const fetchPointsForLocation = async () => {
            try {
                const padding = 0.05;
                const response = await throttledFetchData({
                    bounds: location.bounds || new L.LatLngBounds(
                        [location.center[0] - padding, location.center[1] - padding],
                        [location.center[0] + padding, location.center[1] + padding]
                    ),
                    pagination: { page: 1, limit: 150 }
                });

                if (response?.data) {
                    setPointsOfInterest(response.data);
                } else {
                    setPointsOfInterest([]);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des points d\'intérêt:', error);
                setPointsOfInterest([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPointsForLocation();
    }, []);

    // Mémoiser les points filtrés
    const filteredPoints = useMemo(() => {
        if (selectedShape) return [];
        return pointsOfInterest.filter(point => filteredTypes.includes(point.type));
    }, [pointsOfInterest, filteredTypes, selectedShape]);

    // Mémoiser les options de dessin
    const drawOptions = useMemo(() => ({
        rectangle: drawMode === 'rectangle',
        circle: false,
        polygon: drawMode === 'polygon',
        polyline: false,
        circlemarker: false,
        marker: false,
    }), [drawMode]);

    const editOptions = useMemo(() => ({
        edit: isEditMode,
        remove: false,
        poly: { allowIntersection: false },
        featureGroup: featureGroupRef.current
    }), [isEditMode]);

    return (
        <div>
            <SearchBar onLocationSelect={handleLocationSelect} />

            {searchLocation && (
                <div className="flex items-center p-2 mb-3 bg-gray-50 dark:bg-slate-700 rounded text-xs sm:text-sm">
                    <span className="hidden sm:inline">Lieu sélectionné:</span>
                    <span className="sm:hidden">📍</span>
                    <strong className="mx-1 truncate max-w-[150px] sm:max-w-none">{searchLocation}</strong>
                    <button
                        className="ml-auto p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 focus:outline-none touch-target"
                        onClick={() => setSearchLocation(null)}
                        aria-label="Effacer le lieu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 mt-4 sm:mt-6">
                <button
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded text-white transition-colors touch-target active:scale-95 flex items-center justify-center gap-1 ${drawMode === 'rectangle' ? 'bg-primary-700' : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                    onClick={() => handleSetDrawMode('rectangle')}
                    aria-label="Dessiner un rectangle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                    </svg>
                    <span>Rectangle</span>
                </button>
                <button
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded text-white transition-colors touch-target active:scale-95 flex items-center justify-center gap-1 ${drawMode === 'polygon' ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    onClick={() => handleSetDrawMode('polygon')}
                    aria-label="Dessiner un polygone"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <polygon points="12,2 22,8 22,14 12,20 2,14 2,8" strokeWidth={2} />
                    </svg>
                    <span>Polygone</span>
                </button>
                <button
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors touch-target active:scale-95 flex items-center justify-center gap-1"
                    onClick={handleClearShapes}
                    aria-label="Effacer les formes"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Effacer</span>
                </button>
            </div>

            <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] rounded-lg overflow-hidden shadow-md mb-4 sm:mb-6">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {filteredPoints.map(point => (
                        <Marker
                            key={point.id}
                            position={point.coordinates as [number, number]}
                            icon={getIcon(point.type)}
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
                            draw={drawOptions}
                            edit={editOptions}
                        />
                    </FeatureGroup>

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

                    <MapLegend onFilterChange={handleFilterChange} />
                    <MapController center={mapCenter} zoom={mapZoom} onMapReady={handleMapReady} />
                </MapContainer>

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

            {selectedShape && <DataVisualization shape={selectedShape} filteredTypes={filteredTypes} />}
        </div>
    );
};

export default MapContent;
