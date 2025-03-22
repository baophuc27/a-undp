import { WindyOptions } from '@/types/map';

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
  // Add other Windy API properties as needed
}

export class WindyService {
  private windyApi: WindyAPI;
  private options: WindyOptions;
  
  constructor(windyApi: WindyAPI, options: WindyOptions) {
    this.windyApi = windyApi;
    this.options = options;
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
        id: 'rainClouds',
        name: 'Rain & Clouds',
        overlayFunction: 'rainClouds'
      },
      {
        id: 'temperature',
        name: 'Temperature',
        overlayFunction: 'temperature'
      },
      {
        id: 'pressure',
        name: 'Pressure',
        overlayFunction: 'pressure'
      }
    ];
  }
  
  /**
   * Sets the active Windy layer
   * @param layerId The ID of the layer to activate
   */
  public setActiveLayer(layerId: string): void {
    try {
      const layers = this.getAvailableLayers();
      const layer = layers.find(l => l.id === layerId);
      
      if (layer && this.windyApi.overlays[layer.overlayFunction]) {
        this.windyApi.overlays[layer.overlayFunction]();
      } else {
        console.warn(`Layer ${layerId} not found or not available`);
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
   * Get the current Windy API instance
   */
  public getApi(): WindyAPI {
    return this.windyApi;
  }
}
