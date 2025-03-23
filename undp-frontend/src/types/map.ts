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
    overlay?: string;     // e.g., 'wind', 'temp', 'clouds', 'pressure'
    level?: string;       // e.g., 'surface', '850h', '700h'
    timestamp?: number;   // Specific timestamp to display
    
    // Optional Leaflet map instance (when passing an existing map)
    map?: any;            // L.Map instance
    
    // Performance options
    reduceData?: boolean; // Reduces data loading for better performance
    
    // Misc options
    hourFormat?: string;  // '12h' or '24h'
    graticule?: boolean;  // Show lat/lon grid
    lang?: string;        // Language for UI elements
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