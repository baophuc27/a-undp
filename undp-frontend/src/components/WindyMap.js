// src/components/WindyMap.js
import React, { useEffect, useRef, useState } from 'react';
import './WindyMap.css';

const WindyMap = ({ weatherData }) => {
  const windyContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const windyInstanceRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('wind');
  const [mapReady, setMapReady] = useState(false);
  const markersLayerRef = useRef(null);

  // Load Leaflet script first, as required by Windy API
  useEffect(() => {
    // Check if leaflet script is already loaded
    if (window.L) {
      loadWindyAPI();
      return;
    }

    const existingLeafletScript = document.getElementById('leaflet-script');
    if (existingLeafletScript) return;

    const leafletScript = document.createElement('script');
    leafletScript.id = 'leaflet-script';
    leafletScript.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
    leafletScript.async = true;
    
    leafletScript.onload = () => {
      console.log('Leaflet loaded successfully');
      loadWindyAPI();
    };
    
    leafletScript.onerror = (error) => {
      console.error('Error loading Leaflet:', error);
    };
    
    document.head.appendChild(leafletScript);
  }, []);

  // Load Windy API after Leaflet is ready
  const loadWindyAPI = () => {
    // Check if Windy API script is already loaded
    if (window.windyInit) {
      initializeWindyMap();
      return;
    }

    const existingScript = document.getElementById('windy-api-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'windy-api-script';
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Windy API script loaded successfully');
      initializeWindyMap();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Windy API script:', error);
    };
    
    document.head.appendChild(script);
  };

  // Initialize Windy map after both scripts are loaded
  const initializeWindyMap = () => {
    if (!windyContainerRef.current || windyInstanceRef.current || !window.windyInit) {
      return;
    }

    // Create options for Windy initialization
    const options = {
      // Replace with your actual Windy API key
      key: '',
      verbose: true,
      // Initial coordinates and zoom
      lat: 10.8415958,
      lon: 106.751815,
      zoom: 13
    };

    // Initialize Windy
    window.windyInit(options, windyAPI => {
      // Store the Windy instance for later use
      windyInstanceRef.current = windyAPI;
      
      // Extract the elements we need
      const { map, store, overlays } = windyAPI;
      
      // Store the leaflet map reference
      leafletMapRef.current = map;
      
      // Set default overlay
      store.set('overlay', activeLayer);
      
      // Initialize a layer group for our weather markers
      markersLayerRef.current = window.L.layerGroup().addTo(map);
      
      // Set map as ready
      setMapReady(true);
      
      // Add weather data markers if available
      if (weatherData && weatherData.length > 0) {
        addWeatherMarkers();
      }
    });
  };

  // Update markers when weather data changes
  useEffect(() => {
    if (mapReady && weatherData && weatherData.length > 0) {
      addWeatherMarkers();
    }
  }, [weatherData, mapReady]);

  // Add weather data markers to the map
  const addWeatherMarkers = () => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;
    
    // Clear existing markers
    markersLayerRef.current.clearLayers();
    
    // Add new markers for each weather data point
    weatherData.forEach(point => {
      const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
      
      // Create marker with custom icon for better visibility
      const marker = window.L.marker([lat, lon], {
        icon: window.L.divIcon({
          className: 'weather-marker',
          html: `<div class="marker-temp">${Math.round(temperature)}°</div>`,
          iconSize: [40, 40]
        })
      });
      
      // Create popup content
      const popupContent = `
        <div class="weather-popup">
          <h3>Weather Station</h3>
          <p><strong>Temperature:</strong> ${temperature}°C</p>
          <p><strong>Humidity:</strong> ${humidity}%</p>
          <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
          <p><strong>Pressure:</strong> ${pressure} hPa</p>
        </div>
      `;
      
      // Bind popup to marker
      marker.bindPopup(popupContent);
      
      // Add marker to the layer group
      marker.addTo(markersLayerRef.current);
    });
  };

  // Change the active Windy overlay/layer
  const changeWindyLayer = (layer) => {
    if (!windyInstanceRef.current) return;
    
    const { store } = windyInstanceRef.current;
    store.set('overlay', layer);
    setActiveLayer(layer);
  };

  return (
    <div className="map-container">
      <div className="layer-controls">
        <button 
          className={activeLayer === 'wind' ? 'active' : ''} 
          onClick={() => changeWindyLayer('wind')}
        >
          Wind
        </button>
        <button 
          className={activeLayer === 'temp' ? 'active' : ''} 
          onClick={() => changeWindyLayer('temp')}
        >
          Temperature
        </button>
        <button 
          className={activeLayer === 'clouds' ? 'active' : ''} 
          onClick={() => changeWindyLayer('clouds')}
        >
          Clouds
        </button>
        <button 
          className={activeLayer === 'pressure' ? 'active' : ''} 
          onClick={() => changeWindyLayer('pressure')}
        >
          Pressure
        </button>
      </div>
      
      <div id="windy" ref={windyContainerRef} style={{ width: '100%', height: '600px' }}></div>
      
      {!mapReady && (
        <div className="loading-overlay">
          <p>Loading Windy map...</p>
        </div>
      )}
    </div>
  );
};

export default WindyMap;