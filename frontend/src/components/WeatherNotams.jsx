import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, Navigation, Search, Map, Info, AlertTriangle } from 'lucide-react';
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

 return (
 <div className="pb-20">
 <div className="flex justify-between items-center mb-8">
  <div>
  <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
  <Cloud className="w-8 h-8 mr-3 text-indigo-500"/> Weather & NOTAMs
  </h1>
  <p className="text-slate-500 dark:text-slate-400 mt-2">Real-time METAR, TAF, and live global wind tracking via Windy.</p>
  </div>
 </div>

 <div className="grid grid-cols-12 gap-6">
  {/* Search Bar */}
  <div className="col-span-12">
  <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 flex items-center max-w-lg transition-all duration-300 focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500">
  <Search className="w-5 h-5 text-slate-400 mr-3"/>
 <input 
 type="text"
 value={icao}
 onChange={(e) => setIcao(e.target.value.toUpperCase())}
 placeholder="Enter ICAO Code (e.g. HRYR, KATL)"
 className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 font-bold uppercase placeholder:normal-case placeholder:font-normal"
  maxLength={4}
  />
  <button type="submit"disabled={loading} className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:hover:translate-y-0">
  {loading ? 'Searching...' : 'Search'}
  </button>
 </form>
 </div>

 {/* METAR & TAF Results */}
  <div className="col-span-12 md:col-span-4 space-y-6">
  {error && (
  <div className="bg-red-50 border border-red-200 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-start shadow-md">
  <AlertTriangle className="w-5 h-5 mr-3 shrink-0"/>
 <span className="text-sm font-medium">{error}</span>
 </div>
 )}

  {!error && weather?.metar && (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
  <div className="bg-indigo-600 p-4 flex items-center justify-between">
  <h2 className="font-bold text-white flex items-center">
  <Thermometer className="w-5 h-5 mr-2 text-indigo-200"/> Live METAR
  </h2>
  <span className="text-xs text-indigo-100 bg-indigo-800/50 px-2 py-1 rounded">AviationWeather.gov</span>
  </div>
 <div className="p-5">
 <p className="font-mono text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
 {weather.metar.rawOb}
 </p>
 <div className="grid grid-cols-2 gap-4 mt-4">
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Temperature</p>
 <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{weather.metar.temp}°C</p>
 </div>
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dewpoint</p>
 <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{weather.metar.dewp}°C</p>
 </div>
  <div>
  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wind</p>
  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center">
  <Wind className="w-4 h-4 mr-1 text-indigo-500"/> {weather.metar.wdir}° @ {weather.metar.wspd}kt
  </p>
  </div>
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Altimeter</p>
 <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{weather.metar.altim} hPa</p>
 </div>
 </div>
 </div>
 </div>
 )}

  {!error && weather?.taf && (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
  <div className="bg-indigo-800 p-4 flex items-center justify-between">
  <h2 className="font-bold text-white flex items-center">
 <Navigation className="w-5 h-5 mr-2 text-indigo-300"/> Terminal Forecast (TAF)
 </h2>
 </div>
 <div className="p-5">
 <p className="font-mono text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-line">
 {weather.taf.rawTAF.replace(/ (BECMG|FM|PROB|TEMPO) /g, '\n$1 ')}
 </p>
 </div>
 </div>
 )}
 
  {!error && !weather?.metar && !loading && (
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-6 rounded-2xl text-center">
  <Info className="w-8 h-8 mx-auto mb-2 opacity-50"/>
 <p className="text-sm font-medium">No METAR data available for {icao}.</p>
 </div>
 )}
 </div>

  {/* Windy Iframe & Mock NOTAMs */}
  <div className="col-span-12 md:col-span-8 space-y-6">
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
  <div className="bg-slate-800 dark:bg-slate-700 p-4 flex items-center justify-between">
 <h2 className="font-bold text-white flex items-center">
 <Map className="w-5 h-5 mr-2 text-emerald-400"/> Live Weather Radar
 </h2>
 <span className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">Powered by Windy</span>
 </div>
 <div className="h-[500px] w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
 {weather?.airport ? (
 <iframe 
 width="100%"
 height="100%"
 src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=kt&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${weather.airport.lat}&lon=${weather.airport.lon}`}
 frameBorder="0"
 title="Windy Map"
 ></iframe>
 ) : (
 <div className="text-slate-500 dark:text-slate-400 font-medium">Search for a valid airport to display the weather map.</div>
 )}
        </div>
      </div>

      {/* NOTAMs Section */}
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
  <div className="bg-amber-600 p-4 flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-100"/> Active NOTAMs
          </h2>
          <span className="text-xs text-amber-100 bg-amber-800 px-2 py-1 rounded">{icao}</span>
        </div>
        <div className="p-5 space-y-4">
          {[
            {
              id: "A1234/26",
              type: "Nav Warning",
              text: "RWY 10/28 CLSD DUE TO WIP. MEN AND EQPT ON RWY.",
              validFrom: "2026-07-15 08:00",
              validTo: "2026-07-20 18:00"
            },
            {
              id: "B5678/26",
              type: "Aerodrome",
              text: "TWY A AND B CLSD.",
              validFrom: "2026-07-10 00:00",
              validTo: "2026-08-10 23:59"
            }
          ].map(notam => (
            <div key={notam.id} className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-amber-900 dark:text-amber-400">{notam.id}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded">{notam.type}</span>
              </div>
              <p className="font-mono text-sm text-slate-800 dark:text-slate-300 mb-3">{notam.text}</p>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Valid From: {notam.validFrom}</span>
                <span>Valid To: {notam.validTo}</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-center text-slate-400 mt-4 italic">Note: These are simulated NOTAMs for demonstration purposes.</p>
        </div>
      </div>
    </div>
 </div>
 </div>
 );
}
