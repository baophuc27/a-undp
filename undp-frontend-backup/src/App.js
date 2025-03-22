// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import WindyMap from './components/WindyMap';
import WindyInfo from './components/WindyInfo';
import GoogleEarthMap from './components/GoogleEarthMap';
import DataUploader from './components/DataUploader';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [activeMap, setActiveMap] = useState('windy');

  const handleDataUpload = (data) => {
    setWeatherData(data);
  };

  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>Weather Map Integration</h1>
          <nav>
            <Link to="/" onClick={() => setActiveMap('windy')}>
              Windy Map
            </Link>
            <Link to="/google-earth" onClick={() => setActiveMap('google-earth')}>
              Google Earth Map
            </Link>
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={
              <div>
                <WindyInfo />
                <WindyMap weatherData={weatherData} />
              </div>
            } />
            <Route path="/google-earth" element={
              <GoogleEarthMap weatherData={weatherData} />
            } />
            <Route path="/data-upload" element={
              <DataUploader onDataUpload={handleDataUpload} />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;