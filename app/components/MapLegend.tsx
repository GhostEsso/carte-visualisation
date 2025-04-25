'use client';

import { useState } from 'react';

interface MapLegendProps {
  onFilterChange: (selectedTypes: string[]) => void;
}

const MapLegend = ({ onFilterChange }: MapLegendProps) => {
  // Liste complète des types de points
  const allTypes = [
    { id: 'restaurant', label: 'Restaurants', color: 'blue' },
    { id: 'hospital', label: 'Santé', color: 'red' },
    { id: 'school', label: 'Éducation', color: 'green' },
    { id: 'park', label: 'Loisirs & Parcs', color: 'darkgreen' },
    { id: 'store', label: 'Commerces', color: 'orange' },
    { id: 'transport', label: 'Transports', color: 'purple' },
    { id: 'public_service', label: 'Services Publics', color: 'brown' },
    { id: 'tourism', label: 'Tourisme & Culture', color: 'pink' },
    { id: 'bank', label: 'Banques', color: 'gold' },
    { id: 'worship', label: 'Lieux de Culte', color: 'gray' },
    { id: 'other', label: 'Autres', color: 'black' }
  ];
  
  // État pour suivre les types sélectionnés
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    allTypes.map(type => type.id)
  );

  // État pour suivre si la légende est ouverte ou réduite
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
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
    <div className={`absolute ${isExpanded ? 'bottom-5' : 'bottom-2'} left-5 w-64 bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-lg p-3 z-[1000] overflow-y-auto map-legend-container map-custom-overlay transition-all duration-200 ${isExpanded ? 'max-h-[60vh]' : 'max-h-12'}`}>
      <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700 mb-2">
        <div className="flex items-center">
          <button 
            onClick={toggleExpansion}
            className="mr-2 text-gray-500 hover:text-primary-500 focus:outline-none" 
            aria-label={isExpanded ? "Réduire la légende" : "Développer la légende"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Légende</h3>
        </div>
        {isExpanded && (
          <div className="flex space-x-1">
            <button 
              onClick={() => handleSelectAll(true)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded transition-colors"
            >
              Tout
            </button>
            <button 
              onClick={() => handleSelectAll(false)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded transition-colors"
            >
              Aucun
            </button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="grid grid-cols-2 gap-1 overflow-y-auto">
          {allTypes.map(type => (
            <div key={type.id} className="legend-item">
              <label className="flex items-center text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => handleCheckboxChange(type.id)}
                  className="mr-1 accent-primary-600"
                />
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1.5 ml-1"
                  style={{ backgroundColor: type.color }}
                ></span>
                <span className="text-gray-800 dark:text-gray-200 truncate">{type.label}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapLegend; 