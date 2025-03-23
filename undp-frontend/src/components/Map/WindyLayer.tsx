import React, { useEffect, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useWindyInitializer } from '../../hooks/useWindyInitializer';
import { WindyService } from '../../services/windyService';
import { env } from '../../config/env';

const WindyLayer: React.FC = () => {
  const {
    setLeafletMap,
    setWindyInstance,
    setWindyService
  } = useMap();
  
  const windyContainerRef = useRef<HTMLDivElement | null>(null);
  const { 
    initializeWindy, 
    windyInstance, 
    leafletMap, 
    isLoading, 
    error 
  } = useWindyInitializer();

  // Initialize Windy when the component mounts
  useEffect(() => {
    if (!windyContainerRef.current) return;
    
    // Find the Windy container - it must have id="windy"
    const windyContainer = document.getElementById('windy');
    if (!windyContainer) {
      console.error('Windy container not found. Make sure there is a div with id="windy" in the DOM.');
      return;
    }
    
    // Reference the container
    windyContainerRef.current = windyContainer;
    
    // Initialize Windy with the container
    initializeWindy(windyContainer, {
      key: env.WINDY_API_KEY,
      verbose: true,
      plugin: 'windy-plugin-api',
      lat: env.MAP_CENTER_LAT,
      lon: env.MAP_CENTER_LNG,
      zoom: env.MAP_DEFAULT_ZOOM,
      overlay: 'wind',
      level: 'surface',
      timestamp: Math.floor(Date.now() / 1000),
      hourFormat: '24h',
      graticule: true,
      units: {
        temperature: 'C',
        wind: 'm/s',
        pressure: 'hPa',
        distance: 'km'
      }
    });
  }, [initializeWindy]);

  // Update context when Windy is initialized
  useEffect(() => {
    if (windyInstance && leafletMap) {
      setWindyInstance(windyInstance);
      setLeafletMap(leafletMap);
      
      // Create WindyService instance
      const service = new WindyService(windyInstance, {
        key: env.WINDY_API_KEY,
        verbose: true,
        plugin: 'windy-plugin-api'
      });
      
      setWindyService(service);
      
      return () => {
        // Clean up
        service.cleanup();
      };
    }
  }, [windyInstance, leafletMap, setWindyInstance, setLeafletMap, setWindyService]);

  // Nothing to render - this component just initializes Windy
  return null;
};

export default WindyLayer;