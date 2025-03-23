// src/types/map.ts
export interface MapConfig {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface WindyOptions {
  // Required properties
  key: string;
  verbose: boolean;
  plugin: string;
  
  // Map position properties
  lat?: number;
  lon?: number;
  zoom?: number;
  
  // Display options
  overlay?: string;     // e.g., 'wind', 'temp', 'clouds', 'pressure', 'rainClouds'
  level?: string;       // e.g., 'surface', '850h', '700h', '500h', '300h'
  timestamp?: number;   // Specific timestamp to display
  
  // Optional Leaflet map instance (when passing an existing map)
  map?: any;            // L.Map instance
  
  // Performance options
  reduceData?: boolean; // Reduces data loading for better performance
  
  // Misc options
  hourFormat?: string;  // '12h' or '24h'
  graticule?: boolean;  // Show lat/lon grid
  lang?: string;        // Language for UI elements
  
  // Units
  units?: {
    temperature?: string;  // 'C' (Celsius), 'F' (Fahrenheit), 'K' (Kelvin)
    wind?: string;         // 'kt' (Knots), 'm/s', 'km/h', 'mph'
    pressure?: string;     // 'hPa', 'mmHg', 'inHg'
    distance?: string;     // 'km', 'mi' (Miles)
  };
}

export interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  visible: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface WeatherStation {
  id: string;
  name: string;
  position: GeoPoint;
  data: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    precipitation: number;
    lastUpdated: Date;
  };
}

export interface WeatherAlert {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'critical';
  title: string;
  description: string;
  position: GeoPoint;
  radius?: number;  // Affected radius in kilometers
  startTime: Date;
  endTime?: Date;
}