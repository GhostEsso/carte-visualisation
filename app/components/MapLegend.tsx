'use client';

import { useState } from 'react';

const poiTypes = [
  { id: 'restaurant', name: 'Restaurant', color: 'blue' },
  { id: 'hospital', name: 'Hôpital', color: 'red' },
  { id: 'school', name: 'École', color: 'green' },
  { id: 'park', name: 'Parc', color: 'darkgreen' },
  { id: 'store', name: 'Magasin', color: 'orange' },
];

interface MapLegendProps {
  onFilterChange: (selectedTypes: string[]) => void;
}

const MapLegend = ({ onFilterChange }: MapLegendProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(poiTypes.map(type => type.id));
  
  const toggleLegend = () => {
    setIsOpen(!isOpen);
  };
  
  const handleTypeToggle = (typeId: string) => {
    const newSelectedTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newSelectedTypes);
    onFilterChange(newSelectedTypes);
  };
  
  return (
    <div className={`map-legend ${isOpen ? 'open' : 'closed'}`}>
      <div className="legend-header" onClick={toggleLegend}>
        <h3>Légende</h3>
        <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>
      </div>
      
      {isOpen && (
        <div className="legend-content">
          <p><strong>Types de points d&apos;intérêt</strong></p>
          <ul className="legend-items">
            {poiTypes.map(type => (
              <li key={type.id} className="legend-item">
                <label className="legend-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => handleTypeToggle(type.id)}
                  />
                  <span 
                    className="legend-marker"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.name}</span>
                </label>
              </li>
            ))}
          </ul>
          
          <div className="legend-section">
            <p><strong>Zones de sélection</strong></p>
            <div className="legend-shapes">
              <div className="legend-shape">
                <div className="shape-rectangle"></div>
                <span>Rectangle</span>
              </div>
              <div className="legend-shape">
                <div className="shape-circle"></div>
                <span>Cercle</span>
              </div>
              <div className="legend-shape">
                <div className="shape-polygon"></div>
                <span>Polygone</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend; 