const L = {
    map: jest.fn(() => ({
      setView: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
    })),
    tileLayer: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
    })),
    marker: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
    })),
    icon: jest.fn(),
    latLng: jest.fn(),
    DomEvent: {
      on: jest.fn(),
      off: jest.fn(),
    },
    control: {
      layers: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
      })),
    },
  };
  
  module.exports = L;