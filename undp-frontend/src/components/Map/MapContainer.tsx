import React, { useCallback, useEffect, useState, memo } from 'react';
import { useMap } from '../../context/MapContext';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useTurfAnalysis } from '../../hooks/useTurfAnalysis';
import WindyLayer from './WindyLayer';
import BackupLayer from './BackupLayer';
import DataLayer from './DataLayer';
import MapControls from './MapControls';
import { MapLayer } from '../../types/map';
import './MapContainer.css';

interface MapContainerProps {
  additionalLayers?: MapLayer[];
  dataUrl?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  additionalLayers = [],
  dataUrl
}) => {
  const { 
    leafletMap,
    windyInstance,
    windyService,
    isMapLoading,
    mapError,
    currentZoom,
    handleMapClick, 
    setCurrentZoom
  } = useMap();

  const { calculateDistance } = useTurfAnalysis();
  const [showBackupLayer, setShowBackupLayer] = useState<boolean>(false);
  const [showDataLayer, setShowDataLayer] = useState<boolean>(!!dataUrl);
  const [markers, setMarkers] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Define available map layers
  const mapLayers: MapLayer[] = [
    {
      id: 'backup',
      name: 'Satellite Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      type: 'tile' as 'tile', // Type assertion to ensure it matches MapLayer's type definition
      visible: false,
      minZoom: 10,
      maxZoom: 19,
      opacity: 0.7
    },
    ...additionalLayers
  ];

  // Use the map layers hook to manage layers
  const { 
    activeLayers, 
    toggleLayer 
  } = useMapLayers(mapLayers);

  // Handle map click for distance measurement
  const onMapClick = useCallback((e: any) => {
    if (!leafletMap) return;
    
    // Use the handleMapClick from context
    handleMapClick(e);
    
    if (markers.length === 1) {
      const point1 = { lat: markers[0].getLatLng().lat, lng: markers[0].getLatLng().lng };
      const point2 = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      const dist = calculateDistance(point1, point2);
      setDistance(dist);
    }
  }, [leafletMap, markers.length, calculateDistance, handleMapClick]);

  // Check zoom level and toggle backup layer accordingly
  useEffect(() => {
    if (!windyInstance || !leafletMap) return;
    
    const checkZoom = () => {
      try {
        if (windyInstance.store) {
          const mapCoords = windyInstance.store.get('mapCoords');
          if (mapCoords && typeof mapCoords.zoom === 'number') {
            setCurrentZoom(mapCoords.zoom);
            
            // Toggle backup layer based on zoom level
            const shouldShowBackup = mapCoords.zoom > 11;
            if (shouldShowBackup !== showBackupLayer) {
              setShowBackupLayer(shouldShowBackup);
              
              // Toggle the layer visibility if needed
              if (shouldShowBackup && !activeLayers.includes('backup')) {
                toggleLayer('backup');
              } else if (!shouldShowBackup && activeLayers.includes('backup')) {
                toggleLayer('backup');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking zoom level:', err);
      }
    };
    
    // Initial check
    checkZoom();
    
    // Set up event listeners for zoom changes
    if (windyInstance.broadcast) {
      windyInstance.broadcast.on('redrawFinished', checkZoom);
      windyInstance.broadcast.on('paramsChanged', checkZoom);
    }
    
    if (leafletMap) {
      leafletMap.on('zoomend', checkZoom);
      leafletMap.on('moveend', checkZoom);
    }
    
    return () => {
      // Clean up listeners
      if (windyInstance.broadcast) {
        // Note: Windy broadcast doesn't have an 'off' method,
        // so we can't properly remove these listeners
      }
      
      if (leafletMap) {
        leafletMap.off('zoomend', checkZoom);
        leafletMap.off('moveend', checkZoom);
      }
    };
  }, [windyInstance, leafletMap, showBackupLayer, activeLayers, toggleLayer, setCurrentZoom]);

  return (
    <div className="map-container">
      {/* Zoom level indicator */}
      <div className="zoom-indicator">
        Zoom: {currentZoom.toFixed(1)} 
        {showBackupLayer && ' (Detailed View)'}
      </div>
      
      {/* Main map container */}
      <div id="windy" className="windy-container" />

      
      {/* Error message */}
      {mapError && (
        <div className="error-overlay">
          <p>Error: {mapError.message}</p>
        </div>
      )}
      
      {/* Distance measurement display */}
      {distance !== null && (
        <div className="distance-overlay">
          <p>Distance: {distance.toFixed(2)} km</p>
        </div>
      )}
      
      {/* Layer components */}
      <WindyLayer />
      {showBackupLayer && <BackupLayer />}
      
      {/* Map controls */}
      {windyService && <MapControls />}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(MapContainer);