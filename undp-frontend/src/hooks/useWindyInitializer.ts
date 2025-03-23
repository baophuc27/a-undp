// src/hooks/useWindyInitializer.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { WindyOptions } from '../types/map';
import { env } from '../config/env';

// Define the complete Windy API interface
interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
    close: () => void;
    getParams: () => any;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
    fire: (event: string, data?: any) => void;
    // Note: Windy broadcast doesn't have an 'off' method
  };
  overlays: {
    [key: string]: () => void;
  };
  map: L.Map;
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    on: (key: string, callback: (value: any) => void) => void;
    // Note: Windy store doesn't have an 'off' method for removing listeners
  };
  products: {
    availableLevels: string[];
    availableOverlays: string[];
    availableTimestamps: number[];
  };
  utils: {
    wind2obj: (uv: [number, number]) => { wind: number; dir: number };
    dateFormat: (timestamp: number) => string;
  };
  [key: string]: any; // Allow for additional properties
}
interface UseWindyInitializerReturn {
  initializeWindy: (mapContainer: HTMLElement, initialOptions?: Partial<WindyOptions>) => Promise<void>;
  windyInstance: WindyAPI | null;
  isLoading: boolean;
  error: Error | null;
  leafletMap: L.Map | null;
}

declare global {
  interface Window {
    L: typeof L;
    windyInit?: (options: any, callback: (api: WindyAPI) => void) => void;
    W: any;
  }
}

export const useWindyInitializer = (): UseWindyInitializerReturn => {
  const [windyInstance, setWindyInstance] = useState<WindyAPI | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [leafletScriptLoaded, setLeafletScriptLoaded] = useState<boolean>(false);
  const [windyScriptLoaded, setWindyScriptLoaded] = useState<boolean>(false);
  const initializationAttemptedRef = useRef<boolean>(false);
  
  // Default Windy options
  const defaultOptions: WindyOptions = {
    key: env.WINDY_API_KEY || "3HFvxAW5zvdalES1JlOw6kNyHybrp1j7",
    verbose: false,
    plugin: 'windy-plugin-api',
    lat: 10.8415958,
    lon: 106.751815,
    zoom: 13,
    overlay: 'wind',
    level: 'surface',
    hourFormat: '24h',
    graticule: true,
    // Default units
    units: {
      temperature: 'C',
      wind: 'm/s',
      pressure: 'hPa',
      distance: 'km'
    }
  };

  // Load Leaflet script first
  useEffect(() => {
    // Skip if script is already loaded or if window.L is already available
    if (leafletScriptLoaded || window.L) {
      setLeafletScriptLoaded(true);
      return;
    }

    const existingLeafletScript = document.getElementById('leaflet-script');
    if (existingLeafletScript) {
      setLeafletScriptLoaded(true);
      return;
    }

    setIsLoading(true);
    const leafletScript = document.createElement('script');
    leafletScript.id = 'leaflet-script';
    leafletScript.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
    leafletScript.async = true;
    
    leafletScript.onload = () => {
      console.log('Leaflet loaded successfully');
      setLeafletScriptLoaded(true);
      setIsLoading(false);
    };
    
    leafletScript.onerror = (e) => {
      setError(new Error('Failed to load Leaflet library'));
      setIsLoading(false);
      console.error('Error loading Leaflet:', e);
    };
    
    document.head.appendChild(leafletScript);
    
    // Add Leaflet CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
    document.head.appendChild(leafletCss);
    
    return () => {
      if (leafletScript && document.head.contains(leafletScript)) {
        document.head.removeChild(leafletScript);
      }
    };
  }, []);

  // Load Windy API script after Leaflet is ready
  useEffect(() => {
    // Check if Windy is already available
    if (typeof window.windyInit === 'function') {
      setWindyScriptLoaded(true);
      return;
    }
    
    // Skip if not ready or if script is already loaded
    if (!leafletScriptLoaded || windyScriptLoaded) {
      return;
    }

    const existingScript = document.getElementById('windy-api-script');
    if (existingScript) {
      setWindyScriptLoaded(true);
      return;
    }

    setIsLoading(true);
    const script = document.createElement('script');
    script.id = 'windy-api-script';
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Windy API script loaded successfully');
      setWindyScriptLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = (e) => {
      setError(new Error('Failed to load Windy API'));
      setIsLoading(false);
      console.error('Error loading Windy API:', e);
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [leafletScriptLoaded]);

  // Initialize Windy with a DOM container
  const initializeWindy = useCallback(async (
    mapContainer: HTMLElement, 
    initialOptions: Partial<WindyOptions> = {}
  ): Promise<void> => {
    // Ensure container has id="windy" which is required by Windy API
    if (mapContainer.id !== 'windy') {
      console.warn('Container element should have id="windy" for Windy API to work properly');
      mapContainer.id = 'windy';
    }
    // Prevent multiple initialization attempts
    if (initializationAttemptedRef.current || windyInstance) {
      return;
    }

    if (!leafletScriptLoaded || !windyScriptLoaded) {
      console.warn('Leaflet or Windy scripts not loaded yet.');
      setError(new Error('Required scripts not loaded yet'));
      return;
    }

    initializationAttemptedRef.current = true;
    setIsLoading(true);

    try {
      if (typeof window.windyInit !== 'function') {
        throw new Error('Windy API not properly loaded');
      }

      // Combine default options with any provided initialOptions
      const options = {
        ...defaultOptions,
        ...initialOptions,
      };

      // Initialize Windy with the container
      window.windyInit(options, (windyAPI: WindyAPI) => {
        console.log('Windy initialized successfully');
        
        // Configure Windy display options
        if (options.units) {
          const { units } = options;
          if (units.temperature) windyAPI.store.set('tempUnit', units.temperature);
          if (units.wind) windyAPI.store.set('windUnit', units.wind);
          if (units.pressure) windyAPI.store.set('pressureUnit', units.pressure);
          if (units.distance) windyAPI.store.set('distanceUnit', units.distance);
        }
        
        // Set graticule option if specified
        if (options.graticule !== undefined) {
          windyAPI.store.set('graticule', options.graticule);
        }
        
        // Set hour format if specified
        if (options.hourFormat) {
          windyAPI.store.set('hourFormat', options.hourFormat);
        }
        
        // Register listener for overlay changes
        windyAPI.store.on('overlay', (overlay: string) => {
          console.log('Overlay changed to:', overlay);
        });
        
        // Register listener for level changes
        windyAPI.store.on('level', (level: string) => {
          console.log('Level changed to:', level);
        });
        
        setWindyInstance(windyAPI);
        setLeafletMap(windyAPI.map);
        initializationAttemptedRef.current = false;
        setIsLoading(false);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Windy');
      setError(error);
      initializationAttemptedRef.current = false;
      setIsLoading(false);
      console.error('Error initializing Windy:', error);
    }
  }, [leafletScriptLoaded, windyScriptLoaded, defaultOptions, windyInstance]);

  return { initializeWindy, windyInstance, isLoading, error, leafletMap };
};