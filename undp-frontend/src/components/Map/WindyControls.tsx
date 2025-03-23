// src/components/Map/WindyControls.tsx
import React, { useEffect, useState, memo, useCallback } from 'react';
import { WindyService, OverlayPoint } from '../../services/windy.service';
import './WindyControls.css';

// Sample weather data for testing
const sampleWeatherData = [
  { 
    lat: 10.835, 
    lon: 106.769, 
    temperature: 32.5, 
    humidity: 80, 
    windSpeed: 4.2, 
    pressure: 1012 
  },
  { 
    lat: 10.855, 
    lon: 106.789, 
    temperature: 31.8, 
    humidity: 75, 
    windSpeed: 3.8, 
    pressure: 1010 
  },
  { 
    lat: 10.815, 
    lon: 106.749, 
    temperature: 33.2, 
    humidity: 73, 
    windSpeed: 5.1, 
    pressure: 1011 
  }
];

// Sample overlay data
const sampleOverlayData: OverlayPoint[] = [
  { lat: 10.8215, lon: 106.731, title: 'Overlay Point 1', type: 'warning' },
  { lat: 10.8615, lon: 106.771, title: 'Overlay Point 2', type: 'info' },
  { lat: 10.8015, lon: 106.761, title: 'Overlay Point 3', type: 'alert' }
];

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
  const [activeLayer, setActiveLayer] = useState<string>('wind');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [weatherMarkersVisible, setWeatherMarkersVisible] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('surface');
  
  // Available altitude levels
  const altitudeLevels = [
    { id: 'surface', name: 'Surface' },
    { id: '850h', name: '850 hPa' },
    { id: '700h', name: '700 hPa' },
    { id: '500h', name: '500 hPa' },
    { id: '300h', name: '300 hPa' }
  ];

  useEffect(() => {
    if (windyService) {
      // Get available layers
      const layers = windyService.getAvailableLayers();
      setAvailableLayers(layers);
      
      // Set default active layer
      if (layers.length > 0 && !activeLayer) {
        handleLayerChange(layers[0].id);
      }
      
      // Add sample weather markers
      if (weatherMarkersVisible) {
        windyService.addWeatherMarkers(sampleWeatherData);
      }
      
      // Add sample overlay markers
      windyService.addOverlayMarkers(sampleOverlayData);
      windyService.toggleOverlayVisibility(overlayVisible);
    }
  }, [windyService]); // Initialize once when service is available

  const handleLayerChange = useCallback((layerId: string) => {
    if (windyService) {
      windyService.setActiveLayer(layerId);
      setActiveLayer(layerId);
      
      if (onLayerChange) {
        onLayerChange(layerId);
      }
    }
  }, [windyService, onLayerChange]);

  const handleLevelChange = useCallback((level: string) => {
    if (windyService) {
      windyService.setAltitudeLevel(level);
      setSelectedLevel(level);
    }
  }, [windyService]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const toggleOverlay = useCallback(() => {
    const newVisibility = !overlayVisible;
    setOverlayVisible(newVisibility);
    if (windyService) {
      windyService.toggleOverlayVisibility(newVisibility);
    }
  }, [overlayVisible, windyService]);
  
  const toggleWeatherMarkers = useCallback(() => {
    const newVisibility = !weatherMarkersVisible;
    setWeatherMarkersVisible(newVisibility);
    if (windyService) {
      if (newVisibility) {
        windyService.addWeatherMarkers(sampleWeatherData);
      } else {
        // Clear weather markers by passing empty array
        windyService.addWeatherMarkers([]);
      }
    }
  }, [weatherMarkersVisible, windyService]);

  if (!windyService) {
    return null;
  }

  return (
    <div className="windy-controls">
      <div className="windy-controls__header" onClick={toggleExpanded}>
        <h3>Windy Controls {isExpanded ? '▼' : '►'}</h3>
      </div>
      {isExpanded && (
        <div className="windy-controls__content">
          <div className="windy-controls__section">
            <h4>Map Layers</h4>
            <div className="windy-controls__buttons">
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
          
          <div className="windy-controls__section">
            <h4>Altitude Level</h4>
            <div className="windy-controls__buttons">
              {altitudeLevels.map(level => (
                <button
                  key={level.id}
                  className={`windy-controls__level-btn ${selectedLevel === level.id ? 'active' : ''}`}
                  onClick={() => handleLevelChange(level.id)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="windy-controls__section">
            <h4>Data Overlays</h4>
            <div className="windy-controls__buttons">
              <button
                className={`windy-controls__toggle-btn ${overlayVisible ? 'active' : ''}`}
                onClick={toggleOverlay}
              >
                Warning Markers {overlayVisible ? 'ON' : 'OFF'}
              </button>
              
              <button
                className={`windy-controls__toggle-btn ${weatherMarkersVisible ? 'active' : ''}`}
                onClick={toggleWeatherMarkers}
              >
                Weather Stations {weatherMarkersVisible ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(WindyControls);