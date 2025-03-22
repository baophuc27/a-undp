export interface MapConfig {
    center: [number, number];
    zoom: number;
    minZoom: number;
    maxZoom: number;
  }
  
  export interface WindyOptions {
    key: string;
    verbose: boolean;
    plugin: string;
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