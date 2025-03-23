import React, { useEffect, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useWindyInitializer } from '../../hooks/useWindyInitializer';
import { WindyService } from '../../services/windyService';
import { env } from '../../config/env';

const WindyLayer: React.FC = () => {
  const {
    setLeafletMap,
    setWindyInstance,
    setWindyService,
    setIsMapLoading,
    setMapError
  } = useMap();
  
  const initAttemptedRef = useRef<boolean>(false);
  
  const { 
    initializeWindy, 
    windyInstance, 
    leafletMap, 
    isLoading, 
    error 
  } = useWindyInitializer();

  // Pass errors from the hook to the context
  useEffect(() => {
    if (error) {
      console.error('Windy initialization error:', error);
      setMapError(error);
    }
  }, [error, setMapError]);

  // Initialize Windy when the component mounts
  useEffect(() => {
    if (initAttemptedRef.current) return;
    
    initAttemptedRef.current = true;
    console.log('Attempting to initialize Windy API...');
    
    // Find the Windy container - it must have id="windy"
    const windyContainer = document.getElementById('windy');
    if (!windyContainer) {
      console.error('Windy container not found. Make sure there is a div with id="windy" in the DOM.');
      setMapError(new Error('Windy container not found in the DOM'));
      return;
    }
    
    // Wait a moment to ensure scripts are fully initialized
    setTimeout(() => {
      console.log('Initializing Windy with container:', windyContainer);
      console.log('windyInit available:', typeof window.windyInit === 'function');
      
      // Initialize Windy with the container
      initializeWindy(windyContainer, {
        key: env.WINDY_API_KEY || "3HFvxAW5zvdalES1JlOw6kNyHybrp1j7", // Fallback to demo key if env is missing
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
      }).catch(err => {
        console.error('Error during Windy initialization:', err);
        setMapError(new Error(`Failed to initialize map: ${err.message}`));
        initAttemptedRef.current = false; // Allow retry
      });
    }, 1000); // Add a 1-second delay to ensure scripts are loaded completely
  }, [initializeWindy, setMapError]);

  // Update context when Windy is initialized
  useEffect(() => {
    if (windyInstance && leafletMap) {
      console.log('Windy and Leaflet map instances are ready');
      
      try {
        setWindyInstance(windyInstance);
        setLeafletMap(leafletMap);
        
        // Create WindyService instance
        const service = new WindyService(windyInstance, {
          key: env.WINDY_API_KEY || "3HFvxAW5zvdalES1JlOw6kNyHybrp1j7",
          verbose: true,
          plugin: 'windy-plugin-api'
        });
        
        setWindyService(service);
        
        // Only set loading to false when everything is ready
        setIsMapLoading(false);
        console.log('WindyService created and map is ready');
        
        return () => {
          // Clean up
          service.cleanup();
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error creating WindyService');
        console.error('Error creating WindyService:', error);
        setMapError(error);
      }
    }
  }, [windyInstance, leafletMap, setWindyInstance, setLeafletMap, setWindyService, setIsMapLoading, setMapError]);

  // Nothing to render - this component just initializes Windy
  return null;
};

export default WindyLayer;