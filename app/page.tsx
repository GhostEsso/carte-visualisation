'use client';

import dynamic from 'next/dynamic';

// Importation dynamique côté client pour éviter les problèmes de SSR avec Leaflet
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => <div className="loading-indicator">Chargement de la carte...</div>
});

export default function Home() {
  return (
    <div className="container">
      <header>
        <h1>Visualisation de Données Cartographiques</h1>
        <p>
          Sélectionnez une région sur la carte pour visualiser les données associées.
          Vous pouvez dessiner un rectangle, un cercle ou un polygone.
        </p>
      </header>
      
      <main>
        <MapComponent />
      </main>
      
      <footer>
        <p>Application de visualisation de données cartographiques - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
