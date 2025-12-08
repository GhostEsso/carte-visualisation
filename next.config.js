/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactivé pour la compatibilité avec react-leaflet v4 (ne supporte pas le double-montage de Strict Mode)
  reactStrictMode: false,
  // Transpilation des modules nécessaires pour la compatibilité
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
  // Configuration webpack pour la compatibilité avec les modules ESM
  webpack: (config) => {
    // Ignorer les warnings pour les modules côté serveur uniquement
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // Configuration des images si nécessaire
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdnjs.cloudflare.com',
      },
    ],
  },
};

module.exports = nextConfig;
