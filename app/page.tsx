'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

// Importation dynamique côté client pour éviter les problèmes de SSR avec Leaflet
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen text-gray-500">
    <div className="animate-spin-slow mr-2">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
    Chargement de la carte...
  </div>
});

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="py-6 mb-6 border-b border-gray-200">
        <div className="flex items-center mb-4">
          <img src="/vision-logo.svg" alt="Vision Logo" className="h-10 mr-3" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visualisation de Données Cartographiques</h1>
        <p className="text-gray-600">
          Sélectionnez une région sur la carte pour visualiser les données associées.
          Vous pouvez dessiner un rectangle, un cercle ou un polygone.
        </p>
      </header>
      
      <main className="min-h-[70vh]">
        <MapComponent />
      </main>
      
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Vision - Application de visualisation de données cartographiques - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
