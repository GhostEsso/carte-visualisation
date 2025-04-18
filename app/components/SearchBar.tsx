'use client';

import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';

// Simuler un service de géocodage pour rechercher des lieux
interface GeocodingResult {
  display_name: string;
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
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
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Simuler une recherche géographique
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Données simulées pour quelques villes
      const mockResults: Record<string, GeocodingResult[]> = {
        'paris': [
          { display_name: 'Paris, France', lat: 48.8566, lon: 2.3522, boundingbox: ['48.8155', '48.9021', '2.2250', '2.4699'] },
        ],
        'lyon': [
          { display_name: 'Lyon, Rhône, France', lat: 45.75, lon: 4.85, boundingbox: ['45.7077', '45.8083', '4.7692', '4.8909'] },
        ],
        'marseille': [
          { display_name: 'Marseille, Bouches-du-Rhône, France', lat: 43.2965, lon: 5.3698, boundingbox: ['43.1574', '43.3852', '5.2165', '5.4498'] },
        ],
        'bordeaux': [
          { display_name: 'Bordeaux, Gironde, France', lat: 44.8378, lon: -0.5792, boundingbox: ['44.7908', '44.9157', '-0.6435', '-0.5209'] },
        ],
        'toulouse': [
          { display_name: 'Toulouse, Haute-Garonne, France', lat: 43.6047, lon: 1.4442, boundingbox: ['43.5326', '43.6694', '1.3473', '1.5414'] },
        ],
        'nice': [
          { display_name: 'Nice, Alpes-Maritimes, France', lat: 43.7102, lon: 7.2620, boundingbox: ['43.6654', '43.7617', '7.1932', '7.3392'] },
        ],
        'nantes': [
          { display_name: 'Nantes, Loire-Atlantique, France', lat: 47.2184, lon: -1.5536, boundingbox: ['47.1669', '47.2901', '-1.6306', '-1.4878'] },
        ],
        'strasbourg': [
          { display_name: 'Strasbourg, Bas-Rhin, France', lat: 48.5734, lon: 7.7521, boundingbox: ['48.5139', '48.6245', '7.6747', '7.8249'] },
        ],
        'montpellier': [
          { display_name: 'Montpellier, Hérault, France', lat: 43.6112, lon: 3.8767, boundingbox: ['43.5487', '43.6552', '3.7683', '3.9402'] },
        ],
        'lille': [
          { display_name: 'Lille, Nord, France', lat: 50.6292, lon: 3.0573, boundingbox: ['50.5839', '50.6697', '2.9730', '3.1291'] },
        ],
        'lomé': [
          { display_name: 'Lomé, Togo', lat: 6.1319, lon: 1.2228, boundingbox: ['6.1219', '6.1819', '1.1928', '1.2528'] },
        ]
      };
      
      // Recherche insensible à la casse
      const lowerQuery = searchQuery.toLowerCase();
      
      // Rechercher parmi les entrées simulées
      let matchedResults: GeocodingResult[] = [];
      
      for (const [key, values] of Object.entries(mockResults)) {
        if (key.includes(lowerQuery)) {
          matchedResults = [...matchedResults, ...values];
        }
      }
      
      // Si aucun résultat exact, générer un résultat générique
      if (matchedResults.length === 0 && lowerQuery.length > 2) {
        matchedResults = [{
          display_name: `${searchQuery} (position approximative)`,
          lat: 48.8566 + (Math.random() - 0.5) * 10,
          lon: 2.3522 + (Math.random() - 0.5) * 10
        }];
      }
      
      setResults(matchedResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer le changement de la recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      searchLocations(value);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };
  
  // Gérer la sélection d'un résultat
  const handleResultSelect = (result: GeocodingResult) => {
    const center: [number, number] = [parseFloat(result.lat.toString()), parseFloat(result.lon.toString())];
    
    let bounds: L.LatLngBounds | undefined;
    if (result.boundingbox) {
      const [south, north, west, east] = result.boundingbox.map(parseFloat);
      bounds = L.latLngBounds(
        L.latLng(south, west),
        L.latLng(north, east)
      );
    }
    
    onLocationSelect({
      center,
      bounds,
      name: result.display_name
    });
    
    setQuery(result.display_name);
    setShowResults(false);
  };

  // Effacer la recherche
  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
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
    };
  }, []);
  
  return (
    <div 
      className={`search-bar-container ${hasFocus ? 'focused' : ''}`} 
      ref={searchRef}
      role="search"
      aria-label="Rechercher des lieux"
    >
      <div className="search-input-container">
        <div className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un lieu..."
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
          aria-controls={showResults ? "search-results" : undefined}
        />
        {loading ? (
          <div className="search-spinner" aria-hidden="true"></div>
        ) : query ? (
          <button 
            className="search-clear-button" 
            onClick={handleClearSearch}
            aria-label="Effacer la recherche"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
      
      {showResults && results.length > 0 && (
        <ul 
          className="search-results"
          id="search-results"
          role="listbox"
        >
          {results.map((result, index) => (
            <li 
              key={index} 
              className="search-result-item"
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
              <div className="result-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span>{result.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar; 