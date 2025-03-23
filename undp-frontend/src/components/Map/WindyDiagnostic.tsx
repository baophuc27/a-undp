// WindyDiagnostic.tsx
import React, { useEffect, useState } from 'react';

const WindyDiagnostic: React.FC = () => {
  const [leafletStatus, setLeafletStatus] = useState<string>('Checking...');
  const [windyStatus, setWindyStatus] = useState<string>('Checking...');
  const [windyContainerStatus, setWindyContainerStatus] = useState<string>('Checking...');
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('Checking...');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
  };

  useEffect(() => {
    // Check Leaflet
    if (typeof window.L !== 'undefined') {
      setLeafletStatus(`Available (version: ${window.L.version})`);
      addLog(`Leaflet detected: ${window.L.version}`);
    } else {
      setLeafletStatus('Not available');
      addLog('Leaflet not found on window object');
      
      // Try to load Leaflet manually
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
      script.async = false;
      script.onload = () => {
        setLeafletStatus(`Loaded manually (version: ${window.L?.version || 'unknown'})`);
        addLog(`Leaflet loaded manually: ${window.L?.version || 'unknown'}`);
      };
      script.onerror = () => {
        setLeafletStatus('Failed to load manually');
        addLog('Failed to load Leaflet manually');
      };
      document.head.appendChild(script);
      
      // Add Leaflet CSS
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
      document.head.appendChild(css);
    }
    
    // Check Windy API
    if (typeof window.windyInit === 'function') {
      setWindyStatus('Available');
      addLog('Windy API detected');
    } else {
      setWindyStatus('Not available');
      addLog('Windy API not found on window object');
      
      // Try to load Windy API manually
      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = false;
      script.onload = () => {
        setWindyStatus(typeof window.windyInit === 'function' ? 'Loaded manually' : 'Loaded script but windyInit not found');
        addLog(`Windy script loaded manually, windyInit ${typeof window.windyInit === 'function' ? 'available' : 'not available'}`);
      };
      script.onerror = () => {
        setWindyStatus('Failed to load manually');
        addLog('Failed to load Windy API manually');
      };
      document.head.appendChild(script);
    }
    
    // Check Windy container
    const windyContainer = document.getElementById('windy');
    if (windyContainer) {
      setWindyContainerStatus('Found');
      addLog(`Windy container found: ${windyContainer.className || 'no class'}`);
    } else {
      setWindyContainerStatus('Not found');
      addLog('Windy container not found in DOM');
    }
    
    // Check API key
    const apiKey = process.env.REACT_APP_WINDY_API_KEY || window._env_?.REACT_APP_WINDY_API_KEY;
    if (apiKey) {
      // Mask the key for security
      const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
      setApiKeyStatus(`Available (${maskedKey})`);
      addLog(`API key found (starts with ${apiKey.substring(0, 4)}...)`);
    } else {
      setApiKeyStatus('Not found in env');
      addLog('API key not found in environment variables');
    }
  }, []);

  return (
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      left: '10px', 
      zIndex: 1000, 
      background: 'rgba(255,255,255,0.9)', 
      padding: '15px',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      maxWidth: '80%',
      maxHeight: '80%',
      overflow: 'auto'
    }}>
      <h3>Windy API Diagnostic</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px', fontWeight: 'bold' }}>Leaflet:</td>
            <td style={{ padding: '5px' }}>{leafletStatus}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px', fontWeight: 'bold' }}>Windy API:</td>
            <td style={{ padding: '5px' }}>{windyStatus}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px', fontWeight: 'bold' }}>Windy Container:</td>
            <td style={{ padding: '5px' }}>{windyContainerStatus}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px', fontWeight: 'bold' }}>API Key:</td>
            <td style={{ padding: '5px' }}>{apiKeyStatus}</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Event Log</h4>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '10px',
        borderRadius: '3px',
        maxHeight: '200px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '8px 12px', 
            background: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
        
        <button 
          onClick={() => {
            // Try a direct simple initialization
            if (typeof window.windyInit === 'function' && document.getElementById('windy')) {
              addLog('Attempting direct initialization...');
              try {
                window.windyInit({
                  key: '3HFvxAW5zvdalES1JlOw6kNyHybrp1j7', // Demo key
                  verbose: true
                }, (windyAPI: any) => {
                  addLog('Direct initialization succeeded!');
                  // Do nothing with the API, just testing
                });
              } catch (error) {
                addLog(`Direct initialization failed: ${error}`);
              }
            } else {
              addLog('Cannot attempt direct initialization - API or container missing');
            }
          }}
          style={{ 
            padding: '8px 12px', 
            background: '#2ecc71', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Test Direct Init
        </button>
      </div>
    </div>
  );
};

export default WindyDiagnostic;