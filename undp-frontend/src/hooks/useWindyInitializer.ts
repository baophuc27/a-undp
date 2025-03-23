import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { WindyOptions } from '../types/map';
import { env } from '../config/env';

// Define the complete Windy API interface
interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
  };
  overlays: {
    [key: string]: () => void;
  };
  map: L.Map;
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
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
    windyInit: (options: any, callback: (api: WindyAPI) => void) => void;
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
    key: "Pwcttu942nPWvQmFFMrLtIeOoywFyPPx",
    verbose: false,
    plugin: 'windy-plugin-api',
    lat: 10.8415958,
    lon: 106.751815,
    zoom: 13,
    overlay: 'wind',
    level: 'surface'
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
    // Skip if not ready or if script is already loaded
    if (!leafletScriptLoaded || windyScriptLoaded || window.windyInit) {
      if (window.windyInit) {
        setWindyScriptLoaded(true);
      }
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
      if (!window.windyInit) {
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