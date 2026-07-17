import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, Navigation, Search, Map, Info, AlertTriangle, Printer } from 'lucide-react';
import { API_BASE } from '../config';

export default function WeatherNotams({ token }) {
 const [icao, setIcao] = useState('HRYR'); // Default to Kigali International
 const [weather, setWeather] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 const fetchWeather = async () => {
 if (!icao) return;
 setLoading(true);
 setError('');
 try {
 const res = await fetch(`${API_BASE}/api/weather/${icao}`, {
 headers: { 'Authorization': `Bearer ${token}` }
 });
 if (res.ok) {
 const data = await res.json();
 setWeather(data);
 } else {
 setError('Failed to fetch weather data. Check the ICAO code.');
 }
 } catch (err) {
 setError('Network error while fetching weather.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchWeather();
 }, [token]);

 const handleSearch = (e) => {
 e.preventDefault();
 fetchWeather();
 };

 const handlePrint = () => {
   window.print();
 };

 return (
 <div className="page-container space-y-6 print-area">

 <div className="grid-layout">
  {/* Search Bar */}
  <div style={{ gridColumn: '1 / -1' }}>
  <form onSubmit={handleSearch} className="weather-search-bar">
  <Search size={24} style={{ color: 'var(--color-primary)', marginRight: '1rem' }}/>
 <input 
 type="text"
 value={icao}
 onChange={(e) => setIcao(e.target.value.toUpperCase())}
 placeholder="Enter ICAO Code (e.g. HRYR, KATL)"
 className="weather-search-input"
  maxLength={4}
  />
  <div style={{ display: 'flex', gap: '0.5rem' }}>
   <button type="button" onClick={handlePrint} disabled={!weather} className="btn btn-secondary print-hidden">
    <Printer size={20} style={{ marginRight: '0.5rem' }}/> Print Brief
   </button>
   <button type="submit" disabled={loading} className="btn btn-primary print-hidden" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
   {loading ? 'Searching...' : 'Search'}
   </button>
  </div>
 </form>
 </div>

 {/* METAR & TAF Results */}
  <div className="grid-col-form space-y-6">
  {error && (
  <div className="mb-limit-alert danger">
  <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }}/>
  <span className="mb-limit-alert-title" style={{ fontSize: '0.875rem', margin: 0 }}>{error}</span>
  </div>
  )}

  {!error && weather?.metar && (
  <div className="weather-card glass-card">
  <div className="weather-card-header" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
  <h2 className="weather-card-title" style={{ color: '#0ea5e9' }}>
  <Thermometer size={24} style={{ marginRight: '0.75rem' }} className="print-hidden"/>
  Live METAR
  </h2>
  <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9' }}>AviationWeather.gov</span>
  </div>
  <div className="weather-card-body">
  <p className="weather-raw-text">
  {weather.metar.rawOb}
  </p>
  <div className="weather-grid">
  <div className="weather-stat-card">
  <p className="weather-stat-label">Temperature</p>
  <p className="weather-stat-val">{weather.metar.temp}°C</p>
  </div>
  <div className="weather-stat-card">
  <p className="weather-stat-label">Dewpoint</p>
  <p className="weather-stat-val">{weather.metar.dewp}°C</p>
  </div>
  <div className="weather-stat-card">
  <p className="weather-stat-label">Wind</p>
  <p className="weather-stat-val" style={{ fontSize: '1.25rem' }}>
  <Wind size={20} style={{ marginRight: '0.5rem', color: '#0ea5e9' }} className="print-hidden"/> {weather.metar.wdir}° @ {weather.metar.wspd}kt
  </p>
  </div>
  <div className="weather-stat-card">
  <p className="weather-stat-label">Altimeter</p>
  <p className="weather-stat-val" style={{ fontSize: '1.25rem' }}>{weather.metar.altim} hPa</p>
  </div>
  </div>
  </div>
  </div>
  )}

  {!error && weather?.taf && (
  <div className="weather-card glass-card" style={{ breakInside: 'avoid' }}>
  <div className="weather-card-header" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
  <h2 className="weather-card-title" style={{ color: '#6366f1' }}>
  <Navigation size={24} style={{ marginRight: '0.75rem' }} className="print-hidden"/>
  Terminal Forecast
  </h2>
  </div>
  <div className="weather-card-body">
  <p className="weather-raw-text">
  {weather.taf.rawTAF.replace(/ (BECMG|FM|PROB|TEMPO) /g, '\n$1 ')}
  </p>
  </div>
  </div>
  )}
 
  {!error && !weather?.metar && !loading && (
  <div className="empty-state glass-card">
  <Info size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }}/>
  <p style={{ fontWeight: '700' }}>No METAR data available for {icao}.</p>
  </div>
  )}
 </div>

  {/* Windy Iframe & Mock NOTAMs */}
  <div className="grid-col-list space-y-6">
  <div className="weather-card glass-card print-hidden">
  <div className="weather-card-header" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
  <h2 className="weather-card-title" style={{ color: 'var(--color-success)' }}>
  <Map size={24} style={{ marginRight: '0.75rem' }}/>
  Live Weather Radar
  </h2>
  <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>Powered by Windy</span>
  </div>
 <div className="iframe-container">
 {weather?.airport ? (
 <iframe 
 width="100%"
 height="100%"
 src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=kt&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${weather.airport.lat}&lon=${weather.airport.lon}`}
 frameBorder="0"
 title="Windy Map"
 ></iframe>
 ) : (
 <div style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Search for a valid airport to display the weather map.</div>
 )}
        </div>
      </div>

  {/* NOTAMs Section */}
  <div className="weather-card glass-card" style={{ breakInside: 'avoid' }}>
  <div className="weather-card-header" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
  <h2 className="weather-card-title" style={{ color: 'var(--color-warning)' }}>
  <AlertTriangle size={24} style={{ marginRight: '0.75rem' }}/>
  Active NOTAMs
  </h2>
  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warning)' }}>{icao}</span>
  </div>
        <div className="weather-card-body">
          {weather?.notams && weather.notams.length > 0 ? (
            weather.notams.map(notam => (
              <div key={notam.notamNumber} className="notam-card">
                <div className="notam-header">
                  <span className="notam-number">{notam.notamNumber}</span>
                  <span className="notam-feature">{notam.featureName || 'NOTAM'}</span>
                </div>
                <p className="weather-raw-text" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: '1rem' }}>{notam.traditionalMessage || notam.icaoMessage}</p>
                <div className="notam-validity">
                  <span>Valid From: {notam.issueDate}</span>
                  <span>Valid To: {notam.endDate}</span>
                </div>
              </div>
            ))
          ) : (
             <p className="empty-state" style={{ padding: '1rem', fontStyle: 'italic' }}>{loading ? 'Loading...' : `No active NOTAMs found for ${icao}.`}</p>
          )}
        </div>
      </div>
    </div>
 </div>
 </div>
 );
}
