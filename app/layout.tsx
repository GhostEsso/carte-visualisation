import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./styles/map.css";

const geist = Geist({
  subsets: ["latin"],
});

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
      </head>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}
