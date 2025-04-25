'use client';

import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';

// Interface pour les résultats de géocodage
interface GeocodingResult {
  display_name: string;
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
  importance?: number;
  type?: string;
  place_id?: number;
}

// Interface pour les props
interface SearchBarProps {
  onLocationSelect: (location: { 
    center: [number, number]; 
    bounds?: L.LatLngBounds;
    name: string;
  }) => void;
}

const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Recherche via Nominatim OpenStreetMap API avec gestion d'erreur améliorée
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Appel à l'API Nominatim pour la recherche d'adresses avec paramètres améliorés
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1&accept-language=fr`,
        {
          headers: {
            'Accept-Language': 'fr', // Préférer les résultats en français
            'User-Agent': 'Vision Geo App (https://example.com)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setError('Aucun résultat trouvé. Essayez de modifier votre recherche.');
      } else {
        // Trier les résultats par importance (si disponible) pour privilégier les lieux plus connus
        const sortedData = data.sort((a: GeocodingResult, b: GeocodingResult) => 
          (b.importance || 0) - (a.importance || 0)
        );
        setResults(sortedData);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setError('Impossible de compléter la recherche. Veuillez réessayer plus tard.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Utiliser un délai pour éviter trop d'appels API pendant la saisie
  const debounceSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 500); // 500ms de délai
  };
  
  // Gérer le changement de la recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      debounceSearch(value);
      setShowResults(true);
    } else {
      setResults([]);
      setError(null);
      setShowResults(false);
    }
  };
  
  // Gérer la sélection d'un résultat avec validation renforcée
  const handleResultSelect = (result: GeocodingResult) => {
    // Valider les coordonnées
    if (isNaN(parseFloat(result.lat.toString())) || isNaN(parseFloat(result.lon.toString()))) {
      setError('Coordonnées invalides pour ce lieu. Veuillez sélectionner un autre résultat.');
      return;
    }
    
    const center: [number, number] = [parseFloat(result.lat.toString()), parseFloat(result.lon.toString())];
    
    let bounds: L.LatLngBounds | undefined;
    if (result.boundingbox) {
      const [south, north, west, east] = result.boundingbox.map(parseFloat);
      
      // Vérifier que les coordonnées des limites sont valides
      if (!isNaN(south) && !isNaN(north) && !isNaN(west) && !isNaN(east)) {
        bounds = L.latLngBounds(
          L.latLng(south, west),
          L.latLng(north, east)
        );
      }
    }
    
    onLocationSelect({
      center,
      bounds,
      name: result.display_name
    });
    
    setQuery(result.display_name);
    setShowResults(false);
    setError(null);
  };

  // Gérer la soumission du formulaire (recherche par Enter)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (results.length > 0) {
      // Sélectionner automatiquement le premier résultat si disponible
      handleResultSelect(results[0]);
    } else if (query.trim().length > 2) {
      // Si pas de résultats mais requête valide, forcer une recherche
      searchLocations(query);
    }
  };

  // Effacer la recherche
  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Gérer la navigation au clavier dans les résultats
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };
  
  // Fermer les résultats lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setHasFocus(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      
      // Nettoyer le timeout pour éviter les fuites de mémoire
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <form 
      className="w-full max-w-md mb-4"
      onSubmit={handleSubmit}
    >
      <div 
        className={`relative w-full ${hasFocus ? 'ring-2 ring-primary-500 rounded-lg' : ''}`}
        ref={searchRef}
        role="search"
        aria-label="Rechercher des lieux"
      >
        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-12 py-2 rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800"
            placeholder="Rechercher un lieu (ville, adresse, point d'intérêt...)"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => {
              setHasFocus(true);
              if (results.length > 0) setShowResults(true);
            }}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            aria-expanded={showResults}
            aria-autocomplete="list"
            autoComplete="off"
            aria-controls={showResults ? "search-results" : undefined}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="animate-spin-slow h-5 w-5 text-primary-500">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}
          {!loading && query && (
            <button 
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={handleClearSearch}
              aria-label="Effacer la recherche"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {error && !loading && (
          <div className="mt-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}
        
        {showResults && results.length > 0 && (
          <ul 
            className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg max-h-80 overflow-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            id="search-results"
            role="listbox"
          >
            {results.map((result, index) => (
              <li 
                key={`${result.place_id || index}`} 
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-slate-700"
                onClick={() => handleResultSelect(result)}
                role="option"
                aria-selected={false}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleResultSelect(result);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-primary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 block truncate">
                    <div className="font-medium">{result.display_name}</div>
                    {result.type && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Type: {result.type}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {showResults && query.length > 2 && results.length === 0 && !loading && !error && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg py-3 px-4 text-center text-gray-500 dark:text-gray-400">
            Aucun résultat trouvé pour cette recherche
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar; 