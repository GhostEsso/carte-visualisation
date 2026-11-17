// Client Geoapify Places, exécuté côté serveur uniquement (la clé API ne doit pas atteindre le navigateur)

import { Place } from '../types';

const GEOAPIFY_PLACES_URL = 'https://api.geoapify.com/v2/places';
const PAGE_SIZE = 500; // maximum accepté par Geoapify
const REQUEST_TIMEOUT = 15000;

// ponytail: plafond fixe. Geoapify facture 1 crédit pour 20 lieux (3 000 crédits/jour en gratuit) :
// 2 000 lieux = 100 crédits par zone. Au-delà la zone est tronquée ; monter le plafond avec un plan payant.
export const MAX_PLACES = 2000;

// Catégories Geoapify demandées : l'équivalent des tags interrogés sur Overpass
const CATEGORIES = [
  'catering',
  'healthcare',
  'education',
  'childcare.kindergarten',
  'leisure.park',
  'leisure.playground',
  'sport.sports_centre',
  'sport.stadium',
  'sport.pitch',
  'commercial',
  'public_transport',
  'service.taxi',
  'service.police',
  'service.fire_station',
  'service.post',
  'office.government',
  'tourism',
  'heritage',
  'entertainment.museum',
  'entertainment.culture.gallery',
  'accommodation.hotel',
  'service.financial',
  'religion.place_of_worship'
];

// Préfixe de catégorie Geoapify -> type de l'application. L'ordre fixe la priorité,
// comme getTypeFromTags côté Overpass.
const TYPE_BY_CATEGORY: [string, string][] = [
  ['catering', 'restaurant'],
  ['healthcare', 'hospital'],
  ['education', 'school'],
  ['childcare.kindergarten', 'school'],
  ['leisure.park', 'park'],
  ['leisure.playground', 'park'],
  ['sport', 'park'],
  ['commercial', 'store'],
  ['public_transport', 'transport'],
  ['service.taxi', 'transport'],
  ['service.police', 'public_service'],
  ['service.fire_station', 'public_service'],
  ['service.post', 'public_service'],
  ['office.government', 'public_service'],
  ['tourism', 'tourism'],
  ['heritage', 'tourism'],
  ['entertainment', 'tourism'],
  ['accommodation', 'tourism'],
  ['service.financial', 'bank'],
  ['religion', 'worship']
];

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface GeoapifyFeature {
  properties?: {
    name?: string;
    lat?: number;
    lon?: number;
    place_id?: string;
    categories?: string[];
    formatted?: string;
    address_line2?: string;
    website?: string;
    contact?: { phone?: string; email?: string };
    datasource?: { raw?: Record<string, unknown> };
  };
}

export function typeFromCategories(categories: string[] = []): string {
  for (const [prefix, type] of TYPE_BY_CATEGORY) {
    if (categories.some(category => category === prefix || category.startsWith(`${prefix}.`))) {
      return type;
    }
  }
  return 'other';
}

// Entier stable dérivé d'un identifiant texte (sert de graine à la valeur affichée)
function hashToInt(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

export function toPlace(feature: GeoapifyFeature): Place | null {
  const p = feature.properties;
  if (!p || typeof p.lat !== 'number' || typeof p.lon !== 'number') return null;

  const raw = p.datasource?.raw ?? {};
  const osmId = typeof raw.osm_id === 'number' ? raw.osm_id : undefined;
  const placeId = p.place_id ?? `${p.lat},${p.lon}`;

  return {
    id: osmId !== undefined ? `osm-${osmId}` : `geo-${placeId}`,
    seed: osmId ?? hashToInt(placeId),
    name: p.name || `Point d'intérêt à ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`,
    description: p.address_line2 || p.formatted || '',
    coordinates: [p.lat, p.lon],
    type: typeFromCategories(p.categories),
    phone: asString(p.contact?.phone) ?? asString(raw.phone) ?? asString(raw['contact:phone']),
    email: asString(p.contact?.email) ?? asString(raw.email) ?? asString(raw['contact:email']),
    website: asString(p.website) ?? asString(raw.website) ?? asString(raw['contact:website'])
  };
}

/**
 * Récupère les lieux d'une zone via Geoapify Places, page par page.
 *
 * @param bbox - Zone à interroger.
 * @param max - Nombre maximal de lieux à renvoyer (borné à MAX_PLACES).
 * @param apiKey - Clé API Geoapify.
 * @throws Si Geoapify répond par une erreur ou ne répond pas à temps.
 */
export async function fetchGeoapifyPlaces(bbox: BoundingBox, max: number, apiKey: string): Promise<Place[]> {
  const wanted = Math.min(Math.max(1, Math.floor(max)), MAX_PLACES);
  const places: Place[] = [];

  for (let offset = 0; places.length < wanted; offset += PAGE_SIZE) {
    const limit = Math.min(PAGE_SIZE, wanted - places.length);
    const query = new URLSearchParams({
      categories: CATEGORIES.join(','),
      // Geoapify attend la longitude en premier
      filter: `rect:${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
      limit: String(limit),
      offset: String(offset),
      lang: 'fr',
      apiKey
    });

    const response = await fetch(`${GEOAPIFY_PLACES_URL}?${query}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`Geoapify: ${response.status} ${response.statusText}`);
    }

    const body: { features?: GeoapifyFeature[] } = await response.json();
    const features = body.features ?? [];

    for (const feature of features) {
      const place = toPlace(feature);
      if (place) places.push(place);
    }

    // Dernière page atteinte
    if (features.length < limit) break;
  }

  return places;
}
