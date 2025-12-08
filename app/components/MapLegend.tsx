'use client';

import { useState } from 'react';

interface MapLegendProps {
  onFilterChange: (selectedTypes: string[]) => void;
}

const MapLegend = ({ onFilterChange }: MapLegendProps) => {
  // Liste complète des types de points avec emojis
  const allTypes = [
    { id: 'restaurant', label: 'Restaurants', color: 'blue', emoji: '🍽️' },
    { id: 'hospital', label: 'Santé', color: 'red', emoji: '🏥' },
    { id: 'school', label: 'Éducation', color: 'green', emoji: '🏫' },
    { id: 'park', label: 'Loisirs', color: 'darkgreen', emoji: '🌳' },
    { id: 'store', label: 'Commerces', color: 'orange', emoji: '🏪' },
    { id: 'transport', label: 'Transports', color: 'purple', emoji: '🚌' },
    { id: 'public_service', label: 'Services', color: 'brown', emoji: '🏛️' },
    { id: 'tourism', label: 'Tourisme', color: 'pink', emoji: '🎭' },
    { id: 'bank', label: 'Banques', color: 'gold', emoji: '🏦' },
    { id: 'worship', label: 'Culte', color: 'gray', emoji: '⛪' },
    { id: 'other', label: 'Autres', color: 'black', emoji: '📍' }
  ];

  // État pour suivre les types sélectionnés
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    allTypes.map(type => type.id)
  );

  // État pour suivre si la légende est ouverte ou réduite
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Gérer le changement d'état d'une case à cocher
  const handleCheckboxChange = (typeId: string) => {
    const newSelectedTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];

    setSelectedTypes(newSelectedTypes);
    onFilterChange(newSelectedTypes);
  };

  // Sélectionner/désélectionner tous les types
  const handleSelectAll = (select: boolean) => {
    const newSelectedTypes = select ? allTypes.map(type => type.id) : [];
    setSelectedTypes(newSelectedTypes);
    onFilterChange(newSelectedTypes);
  };

  // Gérer le basculement de l'état d'expansion de la légende
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`
        absolute z-[1000] map-legend-container map-custom-overlay 
        transition-all duration-300 ease-in-out
        ${isExpanded
          ? 'bottom-2 left-2 right-2 sm:right-auto sm:left-4 sm:bottom-4 sm:w-72'
          : 'bottom-2 left-2 sm:left-4 sm:bottom-4'
        }
      `}
    >
      <div className={`
        bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-lg 
        transition-all duration-300
        ${isExpanded ? 'p-3' : 'p-2'}
      `}>
        {/* Header de la légende */}
        <div className="flex justify-between items-center">
          <button
            onClick={toggleExpansion}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-target"
            aria-label={isExpanded ? "Réduire la légende" : "Développer la légende"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-medium">
              Légende
              {!isExpanded && (
                <span className="ml-1 text-xs text-gray-500">
                  ({selectedTypes.length}/{allTypes.length})
                </span>
              )}
            </span>
          </button>

          {isExpanded && (
            <div className="flex gap-1">
              <button
                onClick={() => handleSelectAll(true)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300 rounded transition-colors touch-target"
              >
                Tout
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300 rounded transition-colors touch-target"
              >
                Aucun
              </button>
            </div>
          )}
        </div>

        {/* Liste des types */}
        {isExpanded && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-2 gap-1 max-h-[40vh] overflow-y-auto hide-scrollbar animate-fade-in">
            {allTypes.map(type => (
              <label
                key={type.id}
                className={`
                  flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors touch-target
                  ${selectedTypes.includes(type.id)
                    ? 'bg-gray-50 dark:bg-slate-700/50'
                    : 'opacity-50 hover:opacity-75'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => handleCheckboxChange(type.id)}
                  className="w-4 h-4 accent-primary-600 rounded"
                />
                <span className="text-base">{type.emoji}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLegend;