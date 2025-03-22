// src/components/GoogleEarthMap.js
import React, { useEffect, useRef, useState } from 'react';
import './GoogleEarthMap.css';

const GoogleEarthMap = ({ weatherData }) => {
  const mapRef = useRef(null);
  const googleEarthInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Google Earth Engine API
  useEffect(() => {
    // Load Google Earth Engine script if not already loaded
    if (!window.google || !window.google.earth) {
      // First, load Google Maps API which is required for Earth
      const mapsScript = document.createElement('script');
      mapsScript.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_API_KEY&libraries=visualization`;
      mapsScript.async = true;
      mapsScript.defer = true;
      
      mapsScript.onload = () => {
        // After Google Maps loads, load Earth Engine API
        const earthScript = document.createElement('script');
        earthScript.src = 'https://earthengine.googleapis.com/api/ee_api_js.js';
        earthScript.async = true;
        earthScript.onload = initGoogleEarth;
        document.head.appendChild(earthScript);
      };
      
      document.head.appendChild(mapsScript);
    } else {
      initGoogleEarth();
    }

    return () => {
      // Cleanup when component unmounts
      if (googleEarthInstanceRef.current) {
        // If there's a clear way to destroy Google Earth instance, do it here
      }
    };
  }, []);

  // Initialize Google Earth map
  const initGoogleEarth = () => {
    if (!mapRef.current || googleEarthInstanceRef.current) return;

    try {
      // Initialize Earth Engine
      ee.initialize('YOUR_EARTH_ENGINE_TOKEN', () => {
        // Create a Google Map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40, lng: -100 },
          zoom: 4,
          mapTypeId: 'hybrid',
          tilt: 0, // Start with 2D view
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
          }
        });

        // Store the map instance
        googleEarthInstanceRef.current = map;
        
        // Set mapReady state to true
        setMapReady(true);

        // Add controls for 3D tilting
        addTiltControls(map);
      });
    } catch (error) {
      console.error('Error initializing Google Earth:', error);
    }
  };

  // Add custom controls for tilting the map (3D view)
  const addTiltControls = (map) => {
    const controlDiv = document.createElement('div');
    
    // Set CSS for the control div
    controlDiv.style.padding = '10px';
    controlDiv.style.backgroundColor = 'white';
    controlDiv.style.borderRadius = '3px';
    controlDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlDiv.style.margin = '10px';
    controlDiv.style.cursor = 'pointer';
    
    // Create control interior
    const controlText = document.createElement('div');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.padding = '5px';
    controlText.innerHTML = '3D View';
    controlDiv.appendChild(controlText);
    
    // Set up the click event listener
    controlDiv.addEventListener('click', () => {
      const currentTilt = map.getTilt();
      if (currentTilt === 0) {
        map.setTilt(45);
        controlText.innerHTML = '2D View';
      } else {
        map.setTilt(0);
        controlText.innerHTML = '3D View';
      }
    });
    
    // Add the control to the map
    controlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
  };

  // Effect to update map markers when weatherData changes
  useEffect(() => {
    if (mapReady && weatherData.length > 0 && googleEarthInstanceRef.current) {
      addWeatherMarkers();
    }
  }, [weatherData, mapReady]);

  // Function to add weather markers to the map
  const addWeatherMarkers = () => {
    const map = googleEarthInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for each weather data point
    weatherData.forEach(point => {
      const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
      
      // Create marker
      const marker = new google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
        title: `Temp: ${temperature}°C, Humidity: ${humidity}%`
      });
      
      // Create info window with weather information
      const infoContent = `
        <div class="weather-info-window">
          <h3>Weather Station</h3>
          <p>Temperature: ${temperature}°C</p>
          <p>Humidity: ${humidity}%</p>
          <p>Wind Speed: ${windSpeed} m/s</p>
          <p>Pressure: ${pressure} hPa</p>
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });
      
      // Add click event listener to marker
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      // Store marker reference for later cleanup
      markersRef.current.push(marker);
    });

    // Optional: Create a heatmap layer if there are many data points
    if (weatherData.length > 10) {
      createHeatmap(map, weatherData);
    }
  };

  // Create a heatmap visualization for temperature data
  const createHeatmap = (map, data) => {
    // Prepare data for heatmap
    const heatmapData = data.map(point => {
      return {
        location: new google.maps.LatLng(point.lat, point.lon),
        weight: point.temperature // Weight by temperature
      };
    });
    
    // Create and add heatmap layer
    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 20,
      opacity: 0.7
    });
    
    // Add a UI control to toggle heatmap
    const heatmapControlDiv = document.createElement('div');
    heatmapControlDiv.style.padding = '10px';
    heatmapControlDiv.style.backgroundColor = 'white';
    heatmapControlDiv.style.borderRadius = '3px';
    heatmapControlDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    heatmapControlDiv.style.margin = '10px';
    heatmapControlDiv.style.cursor = 'pointer';
    
    const heatmapControlText = document.createElement('div');
    heatmapControlText.style.fontFamily = 'Arial,sans-serif';
    heatmapControlText.style.fontSize = '12px';
    heatmapControlText.style.padding = '5px';
    heatmapControlText.innerHTML = 'Show Heatmap';
    heatmapControlDiv.appendChild(heatmapControlText);
    
    let heatmapVisible = false;
    
    heatmapControlDiv.addEventListener('click', () => {
      if (heatmapVisible) {
        heatmap.setMap(null);
        heatmapControlText.innerHTML = 'Show Heatmap';
      } else {
        heatmap.setMap(map);
        heatmapControlText.innerHTML = 'Hide Heatmap';
      }
      heatmapVisible = !heatmapVisible;
    });
    
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(heatmapControlDiv);
  };

  return (
    <div className="map-container">
      <div className="layer-controls">
        <p>Google Earth provides high-detail satellite imagery for precise location analysis</p>
      </div>
      <div id="google-earth-container" ref={mapRef} style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
};

export default GoogleEarthMap;