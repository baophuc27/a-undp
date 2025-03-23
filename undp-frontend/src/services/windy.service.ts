// src/services/windy.service.ts
import L from 'leaflet';
import { WindyOptions } from '../types/map';

export interface WindyLayer {
  id: string;
  name: string;
  overlayFunction: string;
}

interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
  };
  overlays: {
    [key: string]: () => void;
  };
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
  };
  map: L.Map;
  [key: string]: any; // Allow for additional properties
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

export class WindyService {
  private windyApi: WindyAPI;
  private options: WindyOptions;
  private markersLayer: L.LayerGroup | null = null;
  private overlayLayer: L.LayerGroup | null = null;
  
  constructor(windyApi: WindyAPI, options: WindyOptions) {
    this.windyApi = windyApi;
    this.options = options;
    
    // Initialize layers if map is available
    if (this.windyApi.map) {
      this.markersLayer = L.layerGroup().addTo(this.windyApi.map);
      this.overlayLayer = L.layerGroup().addTo(this.windyApi.map);
    }
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
      
      // Add marker to the layer group (check if layer exists first)
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
      
      // Add marker to the overlay layer group (check if layer exists first)
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
  }
  
  /**
   * Set altitude level for forecasts
   * @param level Altitude level (e.g., 'surface', '850h', '700h')
   */
  public setAltitudeLevel(level: string): void {
    if (!this.windyApi.store) return;
    
    this.windyApi.store.set('level', level);
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
}