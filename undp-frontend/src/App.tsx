import React from 'react';
import MapContainer from './components/Map/MapComponent';
import { MapLayer } from './types/map';
import './App.css';

const App: React.FC = () => {
  // Define additional map layers
  const additionalLayers: MapLayer[] = [
    {
      id: 'cycling',
      name: 'Cycling Map',
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a>',
      visible: false
    },
    {
      id: 'topo',
      name: 'Topographic',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      visible: false
    }
  ];

  return (
    <div className="App">
      <MapContainer additionalLayers={additionalLayers} />
    </div>
  );
};

export default App;