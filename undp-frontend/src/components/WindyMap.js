// src/components/WindyMap.js
import React, { useEffect, useRef, useState } from 'react';
import './WindyMap.css';

const WindyMap = ({ weatherData }) => {
  const windyContainerRef = useRef(null);
  const windyInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState('wind');

  // Initialize Windy API
  useEffect(() => {
    // Load Windy API script if not already loaded
    if (!window.windyInit && !document.getElementById('windy-api-script')) {
      const script = document.createElement('script');
      script.id = 'windy-api-script';
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;
      script.onload = initWindy;
      document.head.appendChild(script);
    } else if (window.windyInit) {
      initWindy();
    }

    return () => {
      // Cleanup when component unmounts
      if (windyInstanceRef.current) {
        // Windy doesn't provide a clear destroy method, so we'll just remove the content
        if (windyContainerRef.current) {
          windyContainerRef.current.innerHTML = '';
        }
      }
    };
  }, []);

  // Initialize Windy map
  const initWindy = () => {
    if (!windyContainerRef.current || windyInstanceRef.current) return;

    const options = {
      key: '',
      verbose: true,
      lat: 40,
      lon: -100,
      zoom: 4,
    };

    window.windyInit(options, windyAPI => {
      // Store the Windy instance
      windyInstanceRef.current = windyAPI;
      
      // Expose necessary parts of windyAPI
      const { map, store, picker, broadcast } = windyAPI;

      // Set mapReady state to true
      setMapReady(true);

      // Set default overlay
      store.set('overlay', 'wind');

      // Add event listener for map changes
      map.on('zoomend', () => {
        console.log('Map zoom level:', map.getZoom());
      });
    });
  };

  // Effect to update map markers when weatherData changes
  useEffect(() => {
    if (mapReady && weatherData.length > 0 && windyInstanceRef.current) {
      addWeatherMarkers();
    }
  }, [weatherData, mapReady]);

  // Function to add weather markers to the map
  const addWeatherMarkers = () => {
    const { map } = windyInstanceRef.current;
    
    // Clear existing markers (if any implementation exists)
    // This would depend on how you're storing markers

    // Add new markers for each weather data point
    weatherData.forEach(point => {
      const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
      
      // Create a marker using Leaflet (which Windy uses underneath)
      const marker = L.marker([lat, lon]).addTo(map);
      
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
    });
  };

  // Function to change the Windy layer
  const changeWindyLayer = (layer) => {
    if (windyInstanceRef.current) {
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
      <div id="windy-map-container" ref={windyContainerRef} style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
};

export default WindyMap;