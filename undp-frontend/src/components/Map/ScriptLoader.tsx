import React, { useEffect, useState } from 'react';

interface ScriptLoaderProps {
  onLoad: () => void;
  onError: (error: Error) => void;
}

const ScriptLoader: React.FC<ScriptLoaderProps> = ({ onLoad, onError }) => {
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);
  const [windyLoaded, setWindyLoaded] = useState<boolean>(false);

  // Load Leaflet script first
  useEffect(() => {
    // Skip if script is already loaded or if window.L is already available
    if (window.L) {
      console.log('Leaflet already available in window object');
      setLeafletLoaded(true);
      return;
    }

    const existingLeafletScript = document.getElementById('leaflet-script');
    if (existingLeafletScript) {
      console.log('Leaflet script already in DOM');
      setLeafletLoaded(true);
      return;
    }

    console.log('Loading Leaflet script...');
    const leafletScript = document.createElement('script');
    leafletScript.id = 'leaflet-script';
    leafletScript.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
    leafletScript.async = true;
    
    leafletScript.onload = () => {
      console.log('Leaflet loaded successfully');
      setLeafletLoaded(true);
    };
    
    leafletScript.onerror = (e) => {
      console.error('Error loading Leaflet:', e);
      onError(new Error('Failed to load Leaflet library'));
    };
    
    document.head.appendChild(leafletScript);
    
    // Add Leaflet CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
    document.head.appendChild(leafletCss);
    
    return () => {
      // Don't remove the script on unmount as it may be needed later
    };
  }, [onError]);

  // Load Windy API script after Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded) {
      console.log('Waiting for Leaflet to load before loading Windy...');
      return;
    }

    // Check if Windy is already available
    if (typeof window.windyInit === 'function') {
      console.log('Windy API already available in window object');
      setWindyLoaded(true);
      return;
    }
    
    const existingScript = document.getElementById('windy-api-script');
    if (existingScript) {
      console.log('Windy script already in DOM');
      setWindyLoaded(true);
      return;
    }

    console.log('Loading Windy API script...');
    const script = document.createElement('script');
    script.id = 'windy-api-script';
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Windy API script loaded successfully');
      setWindyLoaded(true);
    };
    
    script.onerror = (e) => {
      console.error('Error loading Windy API:', e);
      onError(new Error('Failed to load Windy API'));
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount as it may be needed later
    };
  }, [leafletLoaded, onError]);

  // Notify when both scripts are loaded
  useEffect(() => {
    if (leafletLoaded && windyLoaded) {
      console.log('Both Leaflet and Windy scripts loaded successfully');
      // Add a small delay to ensure scripts are fully initialized
      setTimeout(() => {
        onLoad();
      }, 500);
    }
  }, [leafletLoaded, windyLoaded, onLoad]);

  return null; // This component doesn't render anything
};

export default ScriptLoader;