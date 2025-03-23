import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { env } from '../../config/env';
import { useWindyInitializer } from '../../hooks/useWindyInitializer';
import { MapLayer } from '../../types/map';
import WindyControls from './WindyControls';
import { WindyService } from '../../services/windy.service';
import { useTurfAnalysis } from '../../hooks/useTurfAnalysis';

// Import Leaflet default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon in CRA - only do this once
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
  additionalLayers?: MapLayer[];
}

const MapContainer: React.FC<MapContainerProps> = ({ additionalLayers = [] }) => {
  // Container ref for Windy initialization
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const bufferLayerRef = useRef<L.GeoJSON | null>(null);
  
  // Use the modified hook that initializes Windy with a DOM element
  const { initializeWindy, windyInstance, leafletMap, isLoading, error } = useWindyInitializer();
  const [windyService, setWindyService] = useState<WindyService | null>(null);
  const { calculateDistance, createBuffer } = useTurfAnalysis();
  const layerControlRef = useRef<L.Control.Layers | null>(null);

  // Default map config from environment variables
  const mapConfig = {
    center: [
      env.MAP_CENTER_LAT || 10.8415958, 
      env.MAP_CENTER_LNG || 106.751815
    ] as [number, number],
    zoom: env.MAP_DEFAULT_ZOOM || 13,
    minZoom: 3,
    maxZoom: 18
  };

  // Handle map click - memoize to prevent recreation on each render
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!leafletMap) return;
    
    // Clear markers if there are already 2 to prevent memory buildup
    if (markersRef.current.length >= 2) {
      markersRef.current.forEach(marker => {
        if (leafletMap) marker.removeFrom(leafletMap);
      });
      markersRef.current = [];
      
      // Clear buffer layer
      if (bufferLayerRef.current) {
        bufferLayerRef.current.removeFrom(leafletMap);
        bufferLayerRef.current = null;
      }
    }
    
    // Create a marker
    const marker = L.marker(e.latlng).addTo(leafletMap);
    
    // Add marker to array
    markersRef.current.push(marker);
    
    // If two markers exist, calculate distance
    if (markersRef.current.length === 2) {
      const point1 = { 
        lat: markersRef.current[0].getLatLng().lat, 
        lng: markersRef.current[0].getLatLng().lng 
      };
      const point2 = { 
        lat: markersRef.current[1].getLatLng().lat, 
        lng: markersRef.current[1].getLatLng().lng 
      };
      
      const distance = calculateDistance(point1, point2);
      console.log(`Distance: ${distance.toFixed(2)} km`);
      
      // Create buffer around first point
      const buffer = createBuffer(point1, 1); // 1km buffer
      
      if (bufferLayerRef.current && leafletMap) {
        leafletMap.removeLayer(bufferLayerRef.current);
      }
      
      bufferLayerRef.current = L.geoJSON(buffer).addTo(leafletMap);
    }
  }, [leafletMap, calculateDistance, createBuffer]);

  // Initialize Windy with the container
  useEffect(() => {
    if (mapContainerRef.current && !windyInstance && !isLoading) {
      initializeWindy(mapContainerRef.current, {
        key: env.WINDY_API_KEY,
        verbose: false,
        plugin: 'windy-plugin-api',
        lat: mapConfig.center[0],
        lon: mapConfig.center[1],
        zoom: mapConfig.zoom
      });
    }
  }, [mapContainerRef, windyInstance, isLoading, initializeWindy, mapConfig]);

  // Add click event listener to the map when it's available
  useEffect(() => {
    if (leafletMap) {
      leafletMap.on('click', handleMapClick);

      return () => {
        leafletMap.off('click', handleMapClick);
      };
    }
  }, [leafletMap, handleMapClick]);

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

  // Handle additional layers - optimized to prevent unnecessary updates
  useEffect(() => {
    if (!leafletMap || !additionalLayers.length) return;

    // Clean up previous layer control if it exists
    if (layerControlRef.current) {
      leafletMap.removeControl(layerControlRef.current);
      layerControlRef.current = null;
    }

    const layerControls: Record<string, L.Layer> = {};
    const activeLayersRef: L.TileLayer[] = [];
    
    additionalLayers.forEach(layer => {
      const tileLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        // Add performance options
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2
      });
      
      if (layer.visible) {
        tileLayer.addTo(leafletMap);
        activeLayersRef.push(tileLayer);
      }
      
      layerControls[layer.name] = tileLayer;
    });
    
    if (Object.keys(layerControls).length > 0) {
      layerControlRef.current = L.control.layers({}, layerControls).addTo(leafletMap);
    }
    
    return () => {
      // Clean up all added layers
      activeLayersRef.forEach(layer => {
        if (leafletMap) leafletMap.removeLayer(layer);
      });
      
      // Remove layer control
      if (layerControlRef.current && leafletMap) {
        leafletMap.removeControl(layerControlRef.current);
        layerControlRef.current = null;
      }
    };
  }, [leafletMap, additionalLayers]);

  // Cleanup event listeners and resources on unmount
  useEffect(() => {
    return () => {
      if (leafletMap) {
        // Clean up markers
        markersRef.current.forEach(marker => {
          marker.removeFrom(leafletMap);
        });
        markersRef.current = [];
        
        // Clean up buffer layer
        if (bufferLayerRef.current) {
          bufferLayerRef.current.removeFrom(leafletMap);
          bufferLayerRef.current = null;
        }
        
        // Clean up layer control
        if (layerControlRef.current) {
          leafletMap.removeControl(layerControlRef.current);
          layerControlRef.current = null;
        }
      }
    };
  }, [leafletMap]);

  return (
    <div className="map-container" style={{ width: '100%', height: '100vh' }}>
      {/* Windy container - MUST have id="windy" for the Windy API to work */}
      <div 
        id="windy"
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000
        }}>
          <p>Loading map...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-overlay" style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '10px 15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          <p>Error: {error.message}</p>
        </div>
      )}
      
      {windyService && <WindyControls windyService={windyService} />}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(MapContainer);