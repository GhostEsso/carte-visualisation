/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Assurez-vous que le transpilage est activé pour les modules nécessaires
  transpilePackages: [
    'react-leaflet',
    'leaflet',
    'leaflet-draw',
    'leaflet-geometryutil'
  ],
  // Configuration supplémentaire pour les variables d'environnement si nécessaire
  env: {
    // ajoutez vos variables d'environnement ici si besoin
  },
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig; 