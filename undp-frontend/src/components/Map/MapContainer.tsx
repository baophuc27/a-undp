// src/components/Map/MapContainer.tsx
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
  backupLayer?: MapLayer; // Optional backup layer for high zoom levels
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  additionalLayers = [],
  backupLayer = {
    id: 'backup',
    name: 'Detailed View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    visible: false
  } 
}) => {
  // Container ref for Windy initialization
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const bufferLayerRef = useRef<L.GeoJSON | null>(null);
  const backupLayerRef = useRef<L.TileLayer | null>(null);
  
  // Use the modified hook that initializes Windy with a DOM element
  const { initializeWindy, windyInstance, leafletMap, isLoading, error } = useWindyInitializer();
  const [windyService, setWindyService] = useState<WindyService | null>(null);
  const { calculateDistance, createBuffer } = useTurfAnalysis();
  const layerControlRef = useRef<L.Control.Layers | null>(null);
  
  // State to track if backup layer is active
  const [isBackupLayerActive, setIsBackupLayerActive] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  
  // Keep track of the last checked timestamp to avoid duplicate checks
  const lastCheckRef = useRef<number>(0);

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

  // Function to check zoom level and toggle the backup layer
  const checkZoomAndToggleBackupLayer = useCallback(() => {
    if (!windyInstance || !leafletMap) return;
    
    try {
      // Use current timestamp to prevent duplicate checks
      const now = Date.now();
      if (now - lastCheckRef.current < 50) return; // Throttle checks to avoid excessive updates
      lastCheckRef.current = now;
      
      // Get zoom level from Windy store
      const mapCoords = windyInstance.store.get('mapCoords');
      
      if (mapCoords && typeof mapCoords.zoom === 'number') {
        const zoom = mapCoords.zoom;
        setCurrentZoom(zoom);
        
        // Log current zoom level for debugging
        console.log(`Current Windy zoom level: ${zoom}`);
        
        // Toggle backup layer based on zoom level
        if (zoom > 11) {
          // Only add the layer if it's not already active
          if (!isBackupLayerActive) {
            if (!backupLayerRef.current) {
              // Create a new layer
              backupLayerRef.current = L.tileLayer(backupLayer.url, {
                attribution: backupLayer.attribution,
                minZoom: 11, // Only show at zoom levels > 11
                maxZoom: 22,
                opacity: 0.7 // Semi-transparent to allow seeing Windy data
              }).addTo(leafletMap);
              
              // Add to layer control if it exists
              if (layerControlRef.current && backupLayerRef.current) {
                layerControlRef.current.addOverlay(backupLayerRef.current, backupLayer.name);
              }
            } else if (!leafletMap.hasLayer(backupLayerRef.current)) {
              // Reuse existing layer
              backupLayerRef.current.addTo(leafletMap);
            }
            
            setIsBackupLayerActive(true);
            console.log('Backup layer activated (zoom level > 11)');
          }
        } else {
          // Only remove the layer if it's currently active
          if (isBackupLayerActive && backupLayerRef.current && leafletMap.hasLayer(backupLayerRef.current)) {
            leafletMap.removeLayer(backupLayerRef.current);
            setIsBackupLayerActive(false);
            console.log('Backup layer deactivated (zoom level <= 11)');
          }
        }
      }
    } catch (err) {
      console.error('Error checking zoom level:', err);
    }
  }, [windyInstance, leafletMap, isBackupLayerActive, backupLayer]);

  // Initialize Windy with the container
  useEffect(() => {
    if (mapContainerRef.current && !windyInstance && !isLoading) {
      initializeWindy(mapContainerRef.current, {
        key: env.WINDY_API_KEY,
        verbose: true, // Set to true for more detailed console logs
        plugin: 'windy-plugin-api',
        lat: mapConfig.center[0],
        lon: mapConfig.center[1],
        zoom: mapConfig.zoom,
        overlay: 'wind', // Default overlay
        level: 'surface', // Default level
        timestamp: Math.floor(Date.now() / 1000), // Current time
        hourFormat: '24h', // Use 24-hour format
        graticule: true // Show lat/lon grid
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

  // Setup listeners for detecting zoom changes
  useEffect(() => {
    if (windyInstance && leafletMap) {
      console.log('Setting up zoom change listeners');
      
      // Initial check
      setTimeout(() => {
        checkZoomAndToggleBackupLayer();
      }, 500);
      
      // Method 1: Monitor store change for mapCoords
      windyInstance.store.on('mapCoords', checkZoomAndToggleBackupLayer);
      
      // Method 2: Use Leaflet's zoomend event
      leafletMap.on('zoomend', checkZoomAndToggleBackupLayer);
      
      // Method 3: Use Leaflet's moveend event which also fires on zoom
      leafletMap.on('moveend', checkZoomAndToggleBackupLayer);
      
      // Method 4: Use a polling mechanism as a fallback - check zoom level every 200ms
      const intervalId = setInterval(() => {
        if (windyInstance && windyInstance.store) {
          const mapCoords = windyInstance.store.get('mapCoords');
          if (mapCoords && mapCoords.zoom !== currentZoom) {
            checkZoomAndToggleBackupLayer();
          }
        }
      }, 200);
      
      return () => {
        // Clean up event listeners
        if (leafletMap) {
          leafletMap.off('zoomend', checkZoomAndToggleBackupLayer);
          leafletMap.off('moveend', checkZoomAndToggleBackupLayer);
        }
        
        // Clear interval
        clearInterval(intervalId);
      };
    }
  }, [windyInstance, leafletMap, checkZoomAndToggleBackupLayer, currentZoom]);

  // Initialize Windy service when windyInstance is available
  useEffect(() => {
    if (windyInstance && !windyService) {
      const service = new WindyService(windyInstance, {
        key: env.WINDY_API_KEY,
        verbose: true,
        plugin: 'windy-plugin-api'
      });
      setWindyService(service);
      
      // Additional broadcast listener to catch map changes
      if (windyInstance.broadcast) {
        windyInstance.broadcast.on('redrawFinished', checkZoomAndToggleBackupLayer);
        windyInstance.broadcast.on('paramsChanged', checkZoomAndToggleBackupLayer);
      }
    }
  }, [windyInstance, windyService, checkZoomAndToggleBackupLayer]);

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
      
      // Add backup layer to layer control if it's active
      if (isBackupLayerActive && backupLayerRef.current) {
        layerControlRef.current.addOverlay(backupLayerRef.current, backupLayer.name);
      }
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
  }, [leafletMap, additionalLayers, isBackupLayerActive, backupLayer]);

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
        
        // Clean up backup layer
        if (backupLayerRef.current) {
          backupLayerRef.current.removeFrom(leafletMap);
          backupLayerRef.current = null;
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
      {/* Zoom level indicator */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '5px 10px',
        borderRadius: 4,
        zIndex: 1000,
        fontSize: 12,
        fontWeight: 'bold'
      }}>
        Zoom: {currentZoom.toFixed(1)} {isBackupLayerActive && '(Detailed View Active)'}
      </div>
      
      {/* Windy container - MUST have id="windy" for the Windy API to work */}
      <div 
        id="windy"
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%' }}
      />
      
      
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
      
      {/* WindyControls component */}
      {windyService && <WindyControls windyService={windyService} />}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(MapContainer);