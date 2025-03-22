describe('WindyService', () => {
    const mockWindyApi = {
      picker: {
        on: jest.fn(),
        open: jest.fn()
      },
      broadcast: {
        on: jest.fn()
      },
      overlays: {
        wind: jest.fn(),
        rainClouds: jest.fn(),
        temperature: jest.fn(),
        pressure: jest.fn()
      }
    };
  
    const options = {
      key: 'test-key',
      verbose: false,
      plugin: 'test-plugin'
    };
  
    // Import within test to use the mock
    const { WindyService } = require('@/services/windy.service');
    
    let service;
  
    beforeEach(() => {
      jest.clearAllMocks();
      service = new WindyService(mockWindyApi, options);
    });
  
    it('should return available layers', () => {
      const layers = service.getAvailableLayers();
      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0]).toHaveProperty('id');
      expect(layers[0]).toHaveProperty('name');
      expect(layers[0]).toHaveProperty('overlayFunction');
    });
  
    it('should set active layer', () => {
      service.setActiveLayer('wind');
      expect(mockWindyApi.overlays.wind).toHaveBeenCalled();
  
      service.setActiveLayer('temperature');
      expect(mockWindyApi.overlays.temperature).toHaveBeenCalled();
    });
  
    it('should handle invalid layer gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.setActiveLayer('invalid-layer');
      expect(consoleSpy).toHaveBeenCalled();
    });
  
    it('should register picker events', () => {
      const callback = jest.fn();
      service.registerPickerEvents(callback);
      expect(mockWindyApi.picker.on).toHaveBeenCalledWith('pickerOpened', callback);
    });
  
    it('should open picker at specified coordinates', () => {
      service.openPicker(51.5, -0.09);
      expect(mockWindyApi.picker.open).toHaveBeenCalledWith({ lat: 51.5, lon: -0.09 });
    });
  });