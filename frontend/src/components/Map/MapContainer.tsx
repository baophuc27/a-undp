import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { env } from '@/config/env';
import { useWindyInitializer } from '@/hooks/useWindyInitializer';
import { MapLayer } from '@/types/map';
import WindyControls from './WindyControls';
import { WindyService } from '@/services/windy.service';
import { useTurfAnalysis } from '@/hooks/useTurfAnalysis';


import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Set default icon for all markers
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
  additionalLayers?: MapLayer[];
}

const MapContainer: React.FC<MapContainerProps> = ({ additionalLayers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const { initializeWindy, windyInstance } = useWindyInitializer();
  const [windyService, setWindyService] = useState<WindyService | null>(null);
  const { calculateDistance, createBuffer } = useTurfAnalysis();

  // Default map config from environment variables
  const mapConfig = {
    center: [env.MAP_CENTER_LAT, env.MAP_CENTER_LNG] as [number, number],
    zoom: env.MAP_DEFAULT_ZOOM,
    minZoom: 3,
    maxZoom: 18
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const leafletMap = L.map(mapRef.current).setView(
        mapConfig.center,
        mapConfig.zoom
      );

      leafletMap.markers = [];
      // Add base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: mapConfig.maxZoom,
        minZoom: mapConfig.minZoom
      }).addTo(leafletMap);

      setMap(leafletMap);
      
      // Initialize Windy with this map instance
      initializeWindy(leafletMap);

      leafletMap.on('click', (e) => {
        // Create a marker
        const marker = L.marker(e.latlng).addTo(leafletMap);
        
        // Initialize markers array if it doesn't exist
        if (!leafletMap.markers) {
          leafletMap.markers = [];
        }
        
        // Add marker to array
        leafletMap.markers.push(marker);
        
        // If two markers exist, calculate distance
        if (leafletMap.markers.length === 2) {
          const point1 = { 
            lat: leafletMap.markers[0].getLatLng().lat, 
            lng: leafletMap.markers[0].getLatLng().lng 
          };
          const point2 = { 
            lat: leafletMap.markers[1].getLatLng().lat, 
            lng: leafletMap.markers[1].getLatLng().lng 
          };
          
          const distance = calculateDistance(point1, point2);
          console.log(`Distance: ${distance.toFixed(2)} km`);
          
          // Create buffer around first point
          const buffer = createBuffer(point1, 1); // 1km buffer
          
          if (leafletMap.bufferLayer) {
            leafletMap.removeLayer(leafletMap.bufferLayer);
          }
          
          leafletMap.bufferLayer = L.geoJSON(buffer).addTo(leafletMap);
        }
      });

      // Cleanup function
      return () => {
        leafletMap.remove();
      };
    }
  }, [mapRef, calculateDistance, createBuffer]);

  // Initialize Windy service when windyInstance is available
  useEffect(() => {
    if (windyInstance && !windyService) {
      const service = new WindyService(windyInstance, {
        key: env.WINDY_API_KEY,
        verbose: false,
        plugin: 'windy-plugin-api'
      });
      setWindyService(service);
    }
  }, [windyInstance, windyService]);

  // Handle additional layers
  useEffect(() => {
    if (!map) return;

    const layerControls: Record<string, L.Layer> = {};
    
    additionalLayers.forEach(layer => {
      if (layer.visible) {
        const tileLayer = L.tileLayer(layer.url, {
          attribution: layer.attribution
        });
        
        tileLayer.addTo(map);
        layerControls[layer.name] = tileLayer;
      }
    });
    
    if (Object.keys(layerControls).length > 0) {
      L.control.layers({}, layerControls).addTo(map);
    }
    
    return () => {
      additionalLayers.forEach(layer => {
        map.eachLayer(mapLayer => {
          if ((mapLayer as L.TileLayer).options?.attribution === layer.attribution) {
            map.removeLayer(mapLayer);
          }
        });
      });
    };
  }, [map, additionalLayers]);

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100vh' }}
        data-testid="map-container"
      />
      {windyService && <WindyControls windyService={windyService} />}
    </div>
  );
};

export default MapContainer;