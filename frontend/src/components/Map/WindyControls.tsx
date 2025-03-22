import React, { useEffect, useState } from 'react';
import { WindyService } from '@/services/windy.service';
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

  useEffect(() => {
    if (windyService) {
      const layers = windyService.getAvailableLayers();
      setAvailableLayers(layers);
      
      // Set default active layer
      if (layers.length > 0 && !activeLayer) {
        handleLayerChange(layers[0].id);
      }
    }
  }, [windyService, activeLayer]);

  const handleLayerChange = (layerId: string) => {
    if (windyService) {
      windyService.setActiveLayer(layerId);
      setActiveLayer(layerId);
      
      if (onLayerChange) {
        onLayerChange(layerId);
      }
    }
  };

  if (!windyService || availableLayers.length === 0) {
    return null;
  }

  return (
    <div className="windy-controls">
      <div className="windy-controls__header">
        <h3>Windy Layers</h3>
      </div>
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
    </div>
  );
};

export default React.memo(WindyControls);