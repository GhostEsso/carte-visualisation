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
  
  return (
    <div className="map-legend">
      <div className="legend-header">
        <h3>Légende</h3>
        <div className="legend-actions">
          <button onClick={() => handleSelectAll(true)}>Tout</button>
          <button onClick={() => handleSelectAll(false)}>Aucun</button>
        </div>
      </div>
      <div className="legend-items">
        {allTypes.map(type => (
          <div key={type.id} className="legend-item">
            <label className="legend-label">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.id)}
                onChange={() => handleCheckboxChange(type.id)}
              />
              <span
                className="legend-color"
                style={{ backgroundColor: type.color }}
              ></span>
              {type.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend; 