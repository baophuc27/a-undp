// src/services/windyService.ts
import L from 'leaflet';
import { WindyOptions } from '../types/map';

// Define interface for the Windy API
export interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
    close: () => void;
    getParams: () => any;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
    fire: (event: string, data?: any) => void;
  };
  overlays: {
    [key: string]: () => void;
  };
  map: L.Map;
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    on: (key: string, callback: (value: any) => void) => void;
  };
  products: {
    availableLevels: string[];
    availableOverlays: string[];
    availableTimestamps: number[];
  };
  utils: {
    wind2obj: (uv: [number, number]) => { wind: number; dir: number };
    dateFormat: (timestamp: number) => string;
  };
  [key: string]: any;
}

// Interface for Windy layers
export interface WindyLayer {
  id: string;
  name: string;
  overlayFunction: string;
}

// Sample weather data interface
export interface WeatherData {
  lat: number;
  lon: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

// Sample overlay data interface
export interface OverlayPoint {
  lat: number;
  lon: number;
  title: string;
  type: 'info' | 'warning' | 'alert';
}

/**
 * WindyService - A service for interacting with the Windy API
 */
export class WindyService {
  private windyApi: WindyAPI;
  private options: WindyOptions;
  private markersLayer: L.LayerGroup | null = null;
  private overlayLayer: L.LayerGroup | null = null;
  private changeListeners: Array<(event: string, data: any) => void> = [];
  
  constructor(windyApi: WindyAPI, options: WindyOptions) {
    this.windyApi = windyApi;
    this.options = options;
    
    // Initialize layers if map is available
    if (this.windyApi.map) {
      this.markersLayer = L.layerGroup().addTo(this.windyApi.map);
      this.overlayLayer = L.layerGroup().addTo(this.windyApi.map);
      
      // Setup broadcast listeners
      this.setupBroadcastListeners();
    }
  }
  
  /**
   * Setup listeners for Windy broadcast events
   */
  private setupBroadcastListeners(): void {
    if (!this.windyApi.broadcast) return;
    
    // Listen for redraw events
    this.windyApi.broadcast.on('redrawFinished', () => {
      this.notifyListeners('redraw', {});
    });
    
    // Listen for parameter changes
    this.windyApi.broadcast.on('paramsChanged', (params) => {
      this.notifyListeners('params', params);
    });
    
    // Listen for store changes
    this.windyApi.store.on('overlay', (overlay) => {
      this.notifyListeners('overlay', { overlay });
    });
    
    this.windyApi.store.on('level', (level) => {
      this.notifyListeners('level', { level });
    });
  }
  
  /**
   * Notify all registered listeners of changes
   */
  private notifyListeners(event: string, data: any): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in Windy listener:', error);
      }
    });
  }
  
  /**
   * Register a listener for Windy changes
   */
  public addChangeListener(callback: (event: string, data: any) => void): void {
    this.changeListeners.push(callback);
  }
  
  /**
   * Remove a registered listener
   */
  public removeChangeListener(callback: (event: string, data: any) => void): void {
    this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
  }
  
  /**
   * Returns a list of available Windy layers
   */
  public getAvailableLayers(): WindyLayer[] {
    return [
      {
        id: 'wind',
        name: 'Wind Layer',
        overlayFunction: 'wind'
      },
      {
        id: 'temp',
        name: 'Temperature',
        overlayFunction: 'temp'
      },
      {
        id: 'clouds',
        name: 'Clouds',
        overlayFunction: 'clouds'
      },
      {
        id: 'pressure',
        name: 'Pressure',
        overlayFunction: 'pressure'
      },
      {
        id: 'rainClouds',
        name: 'Rain & Clouds',
        overlayFunction: 'rainClouds'
      }
    ];
  }
  
  /**
   * Sets the active Windy layer
   * @param layerId The ID of the layer to activate
   */
  public setActiveLayer(layerId: string): void {
    try {
      // Direct store manipulation for setting the overlay
      this.windyApi.store.set('overlay', layerId);
      
      // Also try to call the overlay function if it exists
      const layers = this.getAvailableLayers();
      const layer = layers.find(l => l.id === layerId);
      
      if (layer && this.windyApi.overlays[layer.overlayFunction]) {
        this.windyApi.overlays[layer.overlayFunction]();
      }
      
      this.notifyListeners('layerChange', { layerId });
    } catch (error) {
      console.error('Error setting active layer:', error);
    }
  }
  
  /**
   * Register picker events for point forecasts
   * @param callback Function to call when picker is opened
   */
  public registerPickerEvents(callback: (data: any) => void): void {
    if (this.windyApi && this.windyApi.picker) {
      this.windyApi.picker.on('pickerOpened', callback);
    } else {
      console.warn('Windy picker is not available');
    }
  }
  
  /**
   * Opens the Windy point forecast picker at specified coordinates
   */
  public openPicker(lat: number, lon: number): void {
    if (this.windyApi && this.windyApi.picker) {
      this.windyApi.picker.open({ lat, lon });
    } else {
      console.warn('Windy picker is not available');
    }
  }
  
  /**
   * Add weather data markers to the map
   */
  public addWeatherMarkers(weatherData: WeatherData[]): void {
    if (!this.windyApi.map || !this.markersLayer) {
      console.warn('Map or markers layer not available');
      return;
    }
    
    // Clear existing markers
    this.markersLayer.clearLayers();
    
    // Add new markers for each weather data point
    weatherData.forEach(point => {
      const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
      
      // Create marker with custom icon for better visibility
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'weather-marker',
          html: `<div class="marker-temp">${Math.round(temperature)}°</div>`,
          iconSize: [40, 40] as [number, number]
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
      if (this.markersLayer) {
        marker.addTo(this.markersLayer);
      }
    });
  }
  
  /**
   * Add overlay markers to the map
   */
  public addOverlayMarkers(overlayData: OverlayPoint[]): void {
    if (!this.windyApi.map || !this.overlayLayer) {
      console.warn('Map or overlay layer not available');
      return;
    }
    
    // Clear existing overlay markers
    this.overlayLayer.clearLayers();
    
    // Add new markers for each overlay data point
    overlayData.forEach(point => {
      const { lat, lon, title, type } = point;
      
      // Determine marker color based on type
      let markerColor = '#4a90e2'; // default blue
      if (type === 'warning') markerColor = '#f39c12'; // warning orange
      if (type === 'alert') markerColor = '#e74c3c'; // alert red
      
      // Create marker with custom icon
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'overlay-marker',
          html: `<div class="marker-overlay" style="background-color: ${markerColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);">!</div>`,
          iconSize: [40, 40] as [number, number]
        })
      });
      
      // Create popup content
      const popupContent = `
        <div class="overlay-popup">
          <h3>${title}</h3>
          <p><strong>Type:</strong> ${type}</p>
        </div>
      `;
      
      // Bind popup to marker
      marker.bindPopup(popupContent);
      
      // Add marker to the overlay layer group
      if (this.overlayLayer) {
        marker.addTo(this.overlayLayer);
      }
    });
  }
  
  /**
   * Toggle overlay visibility
   */
  public toggleOverlayVisibility(visible: boolean): void {
    if (!this.windyApi.map || !this.overlayLayer) return;
    
    if (visible) {
      if (!this.windyApi.map.hasLayer(this.overlayLayer)) {
        this.overlayLayer.addTo(this.windyApi.map);
      }
    } else {
      this.windyApi.map.removeLayer(this.overlayLayer);
    }
  }
  
  /**
   * Set the forecast time
   * @param timestamp Unix timestamp in milliseconds
   */
  public setForecastTime(timestamp: number): void {
    if (!this.windyApi.store) return;
    
    this.windyApi.store.set('timestamp', timestamp);
    this.notifyListeners('timeChange', { timestamp });
  }
  
  /**
   * Set altitude level for forecasts
   * @param level Altitude level (e.g., 'surface', '850h', '700h')
   */
  public setAltitudeLevel(level: string): void {
    if (!this.windyApi.store) return;
    
    this.windyApi.store.set('level', level);
    this.notifyListeners('levelChange', { level });
  }
  
  /**
   * Get all available altitude levels
   * @returns Array of available levels
   */
  public getAvailableLevels(): string[] {
    if (this.windyApi.products && this.windyApi.products.availableLevels) {
      return this.windyApi.products.availableLevels;
    }
    
    // Default levels if Windy API doesn't provide them
    return ['surface', '850h', '700h', '500h', '300h'];
  }
  
  /**
   * Get all available forecast timestamps
   * @returns Array of available timestamps
   */
  public getAvailableTimestamps(): number[] {
    if (this.windyApi.products && this.windyApi.products.availableTimestamps) {
      return this.windyApi.products.availableTimestamps;
    }
    
    return [];
  }
  
  /**
   * Get the current zoom level from Windy store
   * @returns Current zoom level or null if not available
   */
  public getCurrentZoom(): number | null {
    try {
      const mapCoords = this.windyApi.store.get('mapCoords');
      if (mapCoords && typeof mapCoords.zoom === 'number') {
        return mapCoords.zoom;
      }
      return null;
    } catch (error) {
      console.error('Error getting zoom level:', error);
      return null;
    }
  }
  
  /**
   * Get the current center coordinates from Windy store
   * @returns Current center coordinates or null if not available
   */
  public getCurrentCenter(): { lat: number; lon: number } | null {
    try {
      const mapCoords = this.windyApi.store.get('mapCoords');
      if (mapCoords && typeof mapCoords.lat === 'number' && typeof mapCoords.lon === 'number') {
        return { lat: mapCoords.lat, lon: mapCoords.lon };
      }
      return null;
    } catch (error) {
      console.error('Error getting center coordinates:', error);
      return null;
    }
  }
  
  /**
   * Get the current Windy API instance
   */
  public getApi(): WindyAPI {
    return this.windyApi;
  }
  
  /**
   * Get the Leaflet map instance
   */
  public getMap(): L.Map {
    return this.windyApi.map;
  }
  
  /**
   * Clean up resources when the service is no longer needed
   */
  public cleanup(): void {
    // Clear markers
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }
    
    // Clear overlays
    if (this.overlayLayer) {
      this.overlayLayer.clearLayers();
    }
    
    // Clear listeners
    this.changeListeners = [];
  }
}