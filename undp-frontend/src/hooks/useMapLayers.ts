import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { MapLayer } from '../types/map';
import { useMap } from '../context/MapContext';

interface UseMapLayersOptions {
  defaultBaseLayer?: string;
  defaultActiveLayers?: string[];
}

export const useMapLayers = (layers: MapLayer[], options: UseMapLayersOptions = {}) => {
  const { leafletMap } = useMap();
  const [layerInstances, setLayerInstances] = useState<Record<string, L.Layer>>({});
  const [activeLayers, setActiveLayers] = useState<string[]>(options.defaultActiveLayers || []);
  const [baseLayer, setBaseLayer] = useState<string>(options.defaultBaseLayer || '');
  const [layerControl, setLayerControl] = useState<L.Control.Layers | null>(null);

  // Initialize layers and layer control
  useEffect(() => {
    if (!leafletMap) return;

    const layerMap: Record<string, L.Layer> = {};
    const baseLayers: Record<string, L.Layer> = {};
    const overlays: Record<string, L.Layer> = {};

    // Create layer instances
    layers.forEach(layer => {
      // Safe type check for 'base' - this ensures TypeScript doesn't complain
      if (layer.type && layer.type === 'base') {
        const tileLayer = L.tileLayer(layer.url, {
          attribution: layer.attribution,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom
        });
        
        layerMap[layer.id] = tileLayer;
        baseLayers[layer.name] = tileLayer;
        
        // Add default base layer to map
        if (layer.id === baseLayer || (baseLayer === '' && layer.visible)) {
          tileLayer.addTo(leafletMap);
          setBaseLayer(layer.id);
        }
      } else {
        let overlayLayer: L.Layer;
        
        // Handle different types of overlay layers
        if (layer.type === 'tile') {
          overlayLayer = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            opacity: layer.opacity || 1,
            minZoom: layer.minZoom,
            maxZoom: layer.maxZoom
          });
        } else if (layer.type === 'wms') {
          overlayLayer = L.tileLayer.wms(layer.url, {
            layers: layer.wmsParams?.layers || '',
            format: layer.wmsParams?.format || 'image/png',
            transparent: layer.wmsParams?.transparent !== false,
            attribution: layer.attribution,
            opacity: layer.opacity || 1
          });
        } else if (layer.type === 'geoJson' && layer.geoJsonData) {
          overlayLayer = L.geoJSON(layer.geoJsonData, layer.geoJsonOptions);
        } else {
          // Default to regular tile layer
          overlayLayer = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            opacity: layer.opacity || 1
          });
        }
        
        layerMap[layer.id] = overlayLayer;
        overlays[layer.name] = overlayLayer;
        
        // Add layer to map if it's in active layers or marked as visible
        if (activeLayers.includes(layer.id) || layer.visible) {
          overlayLayer.addTo(leafletMap);
          if (!activeLayers.includes(layer.id)) {
            setActiveLayers(prev => [...prev, layer.id]);
          }
        }
      }
    });

    // Create layer control
    const control = L.control.layers(baseLayers, overlays).addTo(leafletMap);
    setLayerControl(control);
    setLayerInstances(layerMap);

    return () => {
      // Clean up on unmount
      if (layerControl) {
        leafletMap.removeControl(layerControl);
      }
      
      Object.values(layerMap).forEach(layer => {
        if (leafletMap.hasLayer(layer)) {
          leafletMap.removeLayer(layer);
        }
      });
    };
  }, [leafletMap, layers]);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    if (!leafletMap || !layerInstances[layerId]) return;
    
    const layer = layerInstances[layerId];
    const isActive = activeLayers.includes(layerId);
    
    if (isActive) {
      leafletMap.removeLayer(layer);
      setActiveLayers(prev => prev.filter(id => id !== layerId));
    } else {
      layer.addTo(leafletMap);
      setActiveLayers(prev => [...prev, layerId]);
    }
  }, [leafletMap, layerInstances, activeLayers]);

  // Change base layer
  const changeBaseLayer = useCallback((layerId: string) => {
    if (!leafletMap || !layerInstances[layerId]) return;
    
    // Remove current base layer
    const currentBaseLayer = layerInstances[baseLayer];
    if (currentBaseLayer && leafletMap.hasLayer(currentBaseLayer)) {
      leafletMap.removeLayer(currentBaseLayer);
    }
    
    // Add new base layer
    const newBaseLayer = layerInstances[layerId];
    newBaseLayer.addTo(leafletMap);
    setBaseLayer(layerId);
  }, [leafletMap, layerInstances, baseLayer]);

  // Add a new layer programmatically
  const addLayer = useCallback((layer: MapLayer) => {
    if (!leafletMap) return;
    
    let newLayer: L.Layer;
    
    if (layer.type === 'tile' || !layer.type) {
      newLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        opacity: layer.opacity || 1
      });
    } else if (layer.type === 'wms') {
      newLayer = L.tileLayer.wms(layer.url, {
        layers: layer.wmsParams?.layers || '',
        format: layer.wmsParams?.format || 'image/png',
        transparent: layer.wmsParams?.transparent !== false,
        attribution: layer.attribution
      });
    } else if (layer.type === 'geoJson' && layer.geoJsonData) {
      newLayer = L.geoJSON(layer.geoJsonData, layer.geoJsonOptions);
    } else {
      return;
    }
    
    if (layer.visible || activeLayers.includes(layer.id)) {
      newLayer.addTo(leafletMap);
      if (!activeLayers.includes(layer.id)) {
        setActiveLayers(prev => [...prev, layer.id]);
      }
    }
    
    // Update layer instances
    setLayerInstances(prev => ({
      ...prev,
      [layer.id]: newLayer
    }));
    
    // Add to layer control if it exists
    if (layerControl) {
      // Use type guard to safely check if this is a base layer
      // The issue is that by the time we reach this section, TypeScript has narrowed layer.type
      // to exclude 'base' type, so we need to check it differently
      if (String(layer.type) === 'base') {
        layerControl.addBaseLayer(newLayer, layer.name);
      } else {
        layerControl.addOverlay(newLayer, layer.name);
      }
    }
  }, [leafletMap, layerControl, activeLayers]);

  return {
    layerInstances,
    activeLayers,
    baseLayer,
    toggleLayer,
    changeBaseLayer,
    addLayer
  };
};