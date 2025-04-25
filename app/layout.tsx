/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable react/jsx-no-comment-textnodes */
import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import "./styles/map.css";
import "./styles/leaflet-fixes.css";

export const metadata: Metadata = {
  title: "Vision | Visualisation de Données Cartographiques",
  description: "Vision - Application de visualisation de données géospatiales basée sur une carte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased text-gray-900 bg-gray-50 dark:bg-slate-900 dark:text-white min-h-full"
        suppressHydrationWarning={true}
      >
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
