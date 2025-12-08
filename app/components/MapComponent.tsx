'use client';

import { useState, useEffect, useId } from 'react';
import ClientOnly from './ClientOnly';

// Chargement dynamique du contenu de la carte pour éviter les problèmes SSR
const LazyMapContent = () => {
  const [MapContent, setMapContent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMapContent = async () => {
      try {
        const module = await import('./MapContent');
        if (isMounted) {
          setMapContent(() => module.default);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur lors du chargement de MapContent:', err);
          setError('Impossible de charger la carte. Veuillez rafraîchir la page.');
        }
      }
    };

    loadMapContent();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center p-8">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  if (!MapContent) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-500">
        <div className="animate-spin-slow mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        Chargement de la carte...
      </div>
    );
  }

  return <MapContent />;
};

/**
 * MapComponent - Composant wrapper pour la carte Leaflet
 * 
 * Ce composant gère :
 * - Le rendu côté client uniquement (via ClientOnly)
 * - Le chargement dynamique du contenu de la carte
 * - La compatibilité avec React Strict Mode via une clé unique
 */
const MapComponent = () => {
  // Générer une clé unique stable pour ce composant
  const mapId = useId();

  return (
    <ClientOnly
      fallback={
        <div className="flex items-center justify-center h-[70vh] text-gray-500">
          <div className="animate-spin-slow mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          Initialisation de la carte...
        </div>
      }
    >
      <div key={mapId}>
        <LazyMapContent />
      </div>
    </ClientOnly>
  );
};

export default MapComponent;