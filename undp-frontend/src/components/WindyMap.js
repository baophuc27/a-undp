// src/components/WindyMap.js
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './WindyMap.css';

const WindyMap = ({ weatherData }) => {
  const windyContainerRef = useRef(null);
  const windyInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState('wind');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const markersRef = useRef([]);

  // Load Windy API script
  useEffect(() => {
    // Check if script is already loaded
    if (window.windyInit) {
      setScriptLoaded(true);
      return;
    }

    // Check if we're already trying to load the script
    const existingScript = document.getElementById('windy-api-script');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'windy-api-script';
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Windy API script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Error loading Windy API script:', error);
      console.log(error)
      setScriptError(true);
    };
    
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on component unmount as it might be used elsewhere
    };
  }, []);

  // Initialize Windy map after script loads
  useEffect(() => {
    if (!scriptLoaded || !windyContainerRef.current || windyInstanceRef.current) {
      return;
    }

    // Give windyInit a moment to be defined
    const initializeTimeout = setTimeout(() => {
      if (typeof window.windyInit === 'function') {
        initWindy();
      } else {
        console.error('window.windyInit is still not a function after script loaded');
        setScriptError(true);
      }
    }, 500);

    return () => clearTimeout(initializeTimeout);
  }, [scriptLoaded]);

  // Initialize Windy map
  const initWindy = () => {
    try {
      console.log('Initializing Windy map...');
      
      const options = {
        key: '', // Replace with your Windy API key or use ''
        verbose: true,
        lat: 40,
        lon: -100,
        zoom: 4,
      };

      // Create a fallback if windyInit isn't ready yet
      if (typeof window.windyInit !== 'function') {
        console.error('windyInit not available');
        setScriptError(true);
        return;
      }

      window.windyInit(options, windyAPI => {
        console.log('Windy API initialized successfully');
        
        // Store the Windy instance
        windyInstanceRef.current = windyAPI;
        
        // Expose necessary parts of windyAPI
        const { map, store } = windyAPI;

        // Set mapReady state to true
        setMapReady(true);

        // Set default overlay
        store.set('overlay', 'wind');

        // Add event listener for map changes
        map.on('zoomend', () => {
          console.log('Map zoom level:', map.getZoom());
        });
        
        // Add weather markers if data is available
        if (weatherData && weatherData.length > 0) {
          addWeatherMarkers();
        }
      });
    } catch (error) {
      console.error('Error in initWindy:', error);
      setScriptError(true);
    }
  };

  // Effect to update map markers when weatherData changes
  useEffect(() => {
    if (mapReady && weatherData && weatherData.length > 0 && windyInstanceRef.current) {
      addWeatherMarkers();
    }
  }, [weatherData, mapReady]);

  // Function to add weather markers to the map
  const addWeatherMarkers = () => {
    if (!windyInstanceRef.current || !windyInstanceRef.current.map) {
      console.error('Windy map instance not available');
      return;
    }

    try {
      const { map } = windyInstanceRef.current;
      
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (marker && map) {
            marker.remove();
          }
        });
        markersRef.current = [];
      }

      // Add new markers for each weather data point
      weatherData.forEach(point => {
        const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
        
        // Check if Leaflet is available
        if (window.L) {
          // Create a marker using Leaflet (which Windy uses underneath)
          const marker = window.L.marker([lat, lon]).addTo(map);
          
          // Create popup content with weather information
          const popupContent = `
            <div class="weather-popup">
              <h3>Weather Station</h3>
              <p>Temperature: ${temperature}°C</p>
              <p>Humidity: ${humidity}%</p>
              <p>Wind Speed: ${windSpeed} m/s</p>
              <p>Pressure: ${pressure} hPa</p>
            </div>
          `;
          
          // Bind popup to marker
          marker.bindPopup(popupContent);
          
          // Store marker reference for later cleanup
          markersRef.current.push(marker);
        } else {
          console.error('Leaflet library (L) is not available');
        }
      });
    } catch (error) {
      console.error('Error adding weather markers:', error);
    }
  };

  // Function to change the Windy layer
  const changeWindyLayer = (layer) => {
    if (windyInstanceRef.current && windyInstanceRef.current.store) {
      const { store } = windyInstanceRef.current;
      store.set('overlay', layer);
      setActiveLayer(layer);
    }
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
          className={activeLayer === 'rain' ? 'active' : ''} 
          onClick={() => changeWindyLayer('rain')}
        >
          Precipitation
        </button>
        <button 
          className={activeLayer === 'clouds' ? 'active' : ''} 
          onClick={() => changeWindyLayer('clouds')}
        >
          Clouds
        </button>
      </div>
      
      {scriptError && (
        <div className="error-message" style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '1rem', borderRadius: '4px' }}>
          <p><strong>Error loading Windy map:</strong> There was a problem initializing the Windy API.</p>
          <p>Please check your internet connection and API key configuration.</p>
          <p>As a fallback, you might want to try using <a href="/google-earth">Google Earth Map</a> instead.</p>
        </div>
      )}
      
      <div 
        id="windy-map-container" 
        ref={windyContainerRef} 
        style={{ width: '100%', height: '600px', border: scriptError ? '1px dashed #ccc' : 'none' }}
      >
        {scriptError && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
            <p>Unable to load Windy map</p>
            <small>Check console for details</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindyMap;