import React, { useEffect, useState, memo, useCallback } from 'react';
import { WindyService } from '../../services/windy.service';
import './WindyControls.css';

interface WindyLayer {
  id: string;
  name: string;
  overlayFunction: string;
}

interface WindyControlsProps {
  windyService: WindyService;
  onLayerChange?: (layerId: string) => void;
}

const WindyControls: React.FC<WindyControlsProps> = ({ 
  windyService,
  onLayerChange 
}) => {
  const [availableLayers, setAvailableLayers] = useState<WindyLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (windyService) {
      // Only get layers once
      const layers = windyService.getAvailableLayers();
      setAvailableLayers(layers);
      
      // Set default active layer
      if (layers.length > 0 && !activeLayer) {
        // Use a memoized version of handleLayerChange if needed
        handleLayerChange(layers[0].id);
      }
    }
  }, [windyService]); // Do not include activeLayer in dependency array to avoid re-runs

  const handleLayerChange = useCallback((layerId: string) => {
    if (windyService) {
      windyService.setActiveLayer(layerId);
      setActiveLayer(layerId);
      
      if (onLayerChange) {
        onLayerChange(layerId);
      }
    }
  }, [windyService, onLayerChange]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (!windyService || availableLayers.length === 0) {
    return null;
  }

  return (
    <div className="windy-controls">
      <div className="windy-controls__header" onClick={toggleExpanded}>
        <h3>Windy Layers {isExpanded ? '▼' : '►'}</h3>
      </div>
      {isExpanded && (
        <div className="windy-controls__layers">
          {availableLayers.map(layer => (
            <button
              key={layer.id}
              className={`windy-controls__layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
              onClick={() => handleLayerChange(layer.id)}
            >
              {layer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(WindyControls);