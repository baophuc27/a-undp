import { useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { WindyOptions } from '@/types/map';
import { env } from '@/config/env';

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
  // Add other Windy API properties as needed
}

interface UseWindyInitializerReturn {
  initializeWindy: (map: L.Map) => Promise<void>;
  windyInstance: WindyAPI | null;
  isLoading: boolean;
  error: Error | null;
}

export const useWindyInitializer = (): UseWindyInitializerReturn => {
  const [windyInstance, setWindyInstance] = useState<WindyAPI | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  // Default Windy options
  const defaultOptions: WindyOptions = {
    key: env.WINDY_API_KEY,
    verbose: false,
    plugin: 'windy-plugin-api'
  };

  // Load Windy API script
  useEffect(() => {
    if (!scriptLoaded && env.WINDY_API_KEY) {
      setIsLoading(true);
      
      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;
      
      script.onload = () => {
        setScriptLoaded(true);
        setIsLoading(false);
      };
      
      script.onerror = (e) => {
        setError(new Error('Failed to load Windy API'));
        setIsLoading(false);
        console.error('Error loading Windy API:', e);
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [scriptLoaded]);

  // Initialize Windy with the Leaflet map
  const initializeWindy = useCallback(async (map: L.Map): Promise<void> => {
    if (!scriptLoaded) {
      console.warn('Windy script not loaded yet. Make sure you have a valid API key.');
      setError(new Error('Windy script not loaded yet'));
      return;
    }

    if (!env.WINDY_API_KEY) {
      console.warn('Missing Windy API key. Set REACT_APP_WINDY_API_KEY in your environment.');
      setError(new Error('Missing Windy API key'));
      return;
    }

    setIsLoading(true);

    try {
      // @ts-ignore - Windy is loaded through the script and attached to window
      const windyAPI = await window.windyInit({
        ...defaultOptions,
        // Pass the Leaflet map instance to Windy
        map: map
      });

      setWindyInstance(windyAPI);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Windy');
      setError(error);
      setIsLoading(false);
      console.error('Error initializing Windy:', error);
    }
  }, [scriptLoaded, defaultOptions]);

  return { initializeWindy, windyInstance, isLoading, error };
};