// src/components/DataUploader.js
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import './DataUploader.css';

const DataUploader = ({ onDataUpload }) => {
  const [uploadType, setUploadType] = useState('csv');
  const [dataPreview, setDataPreview] = useState([]);
  const [mapLayers, setMapLayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    if (uploadType === 'csv') {
      processCSV(file);
    } else if (uploadType === 'geojson') {
      processGeoJSON(file);
    } else if (uploadType === 'image') {
      processImageLayer(file);
    }
  };

  // Process CSV file (for weather data points)
  const processCSV = (file) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length) {
          setError('Error parsing CSV: ' + results.errors[0].message);
          setIsLoading(false);
          return;
        }

        try {
          // Validate and transform data
          const transformedData = results.data
            .filter(row => row.lat && row.lon) // Ensure we have coordinates
            .map(row => ({
              lat: parseFloat(row.lat),
              lon: parseFloat(row.lon),
              temperature: parseFloat(row.temperature || row.temp || 0),
              humidity: parseFloat(row.humidity || row.humid || 0),
              windSpeed: parseFloat(row.windSpeed || row.wind || 0),
              pressure: parseFloat(row.pressure || 0),
              // Add additional data if present
              ...row
            }));

          if (transformedData.length === 0) {
            setError('No valid data points found. CSV must include lat and lon columns.');
            setIsLoading(false);
            return;
          }

          // Set preview and send data to parent component
          setDataPreview(transformedData.slice(0, 5)); // Show first 5 items
          onDataUpload(transformedData);
          setIsLoading(false);
        } catch (err) {
          setError('Error processing data: ' + err.message);
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError('Error reading file: ' + err.message);
        setIsLoading(false);
      }
    });
  };

  // Process GeoJSON file (for map layers)
  const processGeoJSON = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target.result);
        
        // Validate GeoJSON
        if (!geojson.type || !geojson.features) {
          throw new Error('Invalid GeoJSON format');
        }
        
        // Process GeoJSON into a format usable by maps
        const layerInfo = {
          id: `layer-${Date.now()}`,
          name: file.name.replace('.geojson', ''),
          type: 'geojson',
          data: geojson,
          visible: true
        };
        
        // Add to layers list
        setMapLayers(prevLayers => [...prevLayers, layerInfo]);
        
        // You can also convert GeoJSON points to the weather data format
        const pointData = extractPointsFromGeoJSON(geojson);
        if (pointData.length > 0) {
          setDataPreview(pointData.slice(0, 5));
          onDataUpload(pointData);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Error processing GeoJSON: ' + err.message);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  // Extract point data from GeoJSON
  const extractPointsFromGeoJSON = (geojson) => {
    const points = [];
    
    if (geojson && geojson.features) {
      geojson.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates;
          
          // GeoJSON uses [longitude, latitude] order
          const point = {
            lon: coords[0],
            lat: coords[1],
            // Extract properties if they exist
            temperature: feature.properties?.temperature || 0,
            humidity: feature.properties?.humidity || 0,
            windSpeed: feature.properties?.windSpeed || 0,
            pressure: feature.properties?.pressure || 0,
            // Include all properties
            ...feature.properties
          };
          
          points.push(point);
        }
      });
    }
    
    return points;
  };

  // Process image file for overlay
  const processImageLayer = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Create a new layer info object for the image
        const layerInfo = {
          id: `image-${Date.now()}`,
          name: file.name,
          type: 'image',
          url: e.target.result,
          bounds: [0, 0, 0, 0], // Default bounds, should be set by user
          visible: true
        };
        
        // Add to layers list
        setMapLayers(prevLayers => [...prevLayers, layerInfo]);
        
        // Show modal for setting image bounds
        // (This would be implemented with a modal component)
        
        setIsLoading(false);
      } catch (err) {
        setError('Error processing image: ' + err.message);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Handle manual data entry
  const handleManualEntry = () => {
    // This would open a form for manual data entry
    // For simplicity, we'll just add a sample point
    const sampleData = [
      {
        lat: 40.7128,
        lon: -74.0060,
        temperature: 22.5,
        humidity: 65,
        windSpeed: 5.2,
        pressure: 1013.2
      }
    ];
    
    setDataPreview(sampleData);
    onDataUpload(sampleData);
  };

  // Generate sample CSV template
  const generateTemplate = () => {
    const header = 'lat,lon,temperature,humidity,windSpeed,pressure\n';
    const sampleRow = '40.7128,-74.0060,22.5,65,5.2,1013.2\n';
    
    const blob = new Blob([header, sampleRow], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weather_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="data-uploader">
      <h2>Upload Weather Data</h2>
      
      <div className="upload-options">
        <div className="upload-type-selector">
          <label>
            <input 
              type="radio" 
              name="uploadType" 
              value="csv" 
              checked={uploadType === 'csv'} 
              onChange={() => setUploadType('csv')} 
            />
            CSV (Weather Points)
          </label>
          
          <label>
            <input 
              type="radio" 
              name="uploadType" 
              value="geojson" 
              checked={uploadType === 'geojson'} 
              onChange={() => setUploadType('geojson')} 
            />
            GeoJSON
          </label>
          
          <label>
            <input 
              type="radio" 
              name="uploadType" 
              value="image" 
              checked={uploadType === 'image'} 
              onChange={() => setUploadType('image')} 
            />
            Image Layer
          </label>
        </div>
        
        <div className="file-upload-container">
          <input 
            type="file" 
            ref={fileInputRef}
            accept={uploadType === 'csv' ? '.csv' : 
                   uploadType === 'geojson' ? '.geojson,.json' : 
                   '.png,.jpg,.jpeg,.gif'}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            className="upload-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Select File'}
          </button>
          
          <button 
            onClick={handleManualEntry}
            className="manual-entry-button"
          >
            Manual Entry
          </button>
          
          {uploadType === 'csv' && (
            <button 
              onClick={generateTemplate}
              className="template-button"
            >
              Download Template
            </button>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {dataPreview.length > 0 && (
        <div className="data-preview">
          <h3>Data Preview</h3>
          <table>
            <thead>
              <tr>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Wind Speed (m/s)</th>
                <th>Pressure (hPa)</th>
              </tr>
            </thead>
            <tbody>
              {dataPreview.map((point, index) => (
                <tr key={index}>
                  <td>{point.lat}</td>
                  <td>{point.lon}</td>
                  <td>{point.temperature}</td>
                  <td>{point.humidity}</td>
                  <td>{point.windSpeed}</td>
                  <td>{point.pressure}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="preview-note">
            Showing {dataPreview.length} of {dataPreview.length === 5 ? '5+ entries' : dataPreview.length + ' entries'}
          </p>
        </div>
      )}
      
      {mapLayers.length > 0 && (
        <div className="layer-manager">
          <h3>Map Layers</h3>
          <ul>
            {mapLayers.map(layer => (
              <li key={layer.id}>
                <input 
                  type="checkbox" 
                  checked={layer.visible} 
                  onChange={() => {
                    setMapLayers(prevLayers => 
                      prevLayers.map(l => 
                        l.id === layer.id ? {...l, visible: !l.visible} : l
                      )
                    );
                  }}
                />
                <span>{layer.name}</span>
                <button onClick={() => {
                  setMapLayers(prevLayers => 
                    prevLayers.filter(l => l.id !== layer.id)
                  );
                }}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="data-format-info">
        <h3>Data Format Information</h3>
        <div className="format-tabs">
          <div className="tab active">CSV</div>
          <div className="tab">GeoJSON</div>
          <div className="tab">Image Layer</div>
        </div>
        
        <div className="format-content">
          <h4>CSV Format Requirements</h4>
          <p>Your CSV file should include the following columns:</p>
          <ul>
            <li><strong>lat</strong>: Latitude (decimal degrees)</li>
            <li><strong>lon</strong>: Longitude (decimal degrees)</li>
            <li><strong>temperature</strong>: Temperature in Celsius (optional)</li>
            <li><strong>humidity</strong>: Relative humidity percentage (optional)</li>
            <li><strong>windSpeed</strong>: Wind speed in m/s (optional)</li>
            <li><strong>pressure</strong>: Atmospheric pressure in hPa (optional)</li>
          </ul>
          <p>You can include additional columns which will be preserved in the data.</p>
          <p>
            <button onClick={generateTemplate}>Download Template</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataUploader;