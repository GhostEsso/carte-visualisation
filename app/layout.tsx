/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable react/jsx-no-comment-textnodes */
import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import "./styles/map.css";

export const metadata: Metadata = {
  title: "Visualisation de Données Cartographiques",
  description: "Application de visualisation de données basée sur une carte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-inter"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
