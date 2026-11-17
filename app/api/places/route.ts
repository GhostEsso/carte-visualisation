import { NextRequest, NextResponse } from 'next/server';
import { fetchGeoapifyPlaces, MAX_PLACES } from '../../services/geoapify';

// Côté maximal d'une zone, en degrés (~55 km). Cette route est publique et consomme
// le quota Geoapify : on refuse les zones démesurées.
const MAX_BBOX_SPAN = 0.5;

/**
 * GET /api/places?bbox=south,west,north,east&max=2000
 * Proxy vers Geoapify Places : garde la clé API côté serveur.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEOAPIFY_API_KEY non configurée' }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const parts = (searchParams.get('bbox') ?? '').split(',').map(Number);
  const [south, west, north, east] = parts;

  const validBbox = parts.length === 4 && parts.every(Number.isFinite) &&
    south >= -90 && north <= 90 && west >= -180 && east <= 180 &&
    south < north && west < east &&
    north - south <= MAX_BBOX_SPAN && east - west <= MAX_BBOX_SPAN;

  if (!validBbox) {
    return NextResponse.json(
      { error: `bbox invalide : attendu south,west,north,east, ${MAX_BBOX_SPAN}° de côté au maximum` },
      { status: 400 }
    );
  }

  const maxParam = searchParams.get('max');
  const max = maxParam === null ? MAX_PLACES : Number(maxParam);
  if (!Number.isInteger(max) || max < 1) {
    return NextResponse.json({ error: 'max invalide : entier positif attendu' }, { status: 400 });
  }

  try {
    const places = await fetchGeoapifyPlaces({ south, west, north, east }, max, apiKey);

    return NextResponse.json({ places }, {
      // Cache CDN : une même zone redemandée ne consomme pas de crédits pendant 5 minutes
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (error) {
    console.error('Erreur Geoapify:', error);
    return NextResponse.json({ error: 'Service Geoapify indisponible' }, { status: 502 });
  }
}
