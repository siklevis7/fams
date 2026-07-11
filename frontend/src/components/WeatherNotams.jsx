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

 <div className="grid grid-cols-12 gap-6">
  {/* Search Bar */}
  <div className="col-span-12">
  <form onSubmit={handleSearch} className="liquid-glass p-4 rounded-3xl flex items-center w-full transition-all duration-300 focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500">
  <Search className="w-6 h-6 text-indigo-400 ml-2 mr-4"/>
 <input 
 type="text"
 value={icao}
 onChange={(e) => setIcao(e.target.value.toUpperCase())}
 placeholder="Enter ICAO Code (e.g. HRYR, KATL)"
 className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 font-bold uppercase placeholder:normal-case placeholder:font-normal"
  maxLength={4}
  />
  <button type="submit"disabled={loading} className="ml-4 bg-indigo-600/90 hover:bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-600/30 backdrop-blur-md disabled:opacity-50 disabled:hover:scale-100">
  {loading ? 'Searching...' : 'Search'}
  </button>
 </form>
 </div>

 {/* METAR & TAF Results */}
  <div className="col-span-12 md:col-span-5 lg:col-span-4 space-y-6">
  {error && (
  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-3xl flex items-start backdrop-blur-md">
  <AlertTriangle className="w-5 h-5 mr-3 shrink-0"/>
  <span className="text-sm font-bold">{error}</span>
  </div>
  )}

  {!error && weather?.metar && (
  <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-500 group">
  <div className="bg-sky-500/10 p-5 flex items-center justify-between border-b border-white/10">
  <h2 className="font-bold text-sky-700 dark:text-sky-300 flex items-center text-lg tracking-tight">
  <div className="bg-sky-500/20 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform">
  <Thermometer className="w-5 h-5 text-sky-600 dark:text-sky-400"/>
  </div>
  Live METAR
  </h2>
  <span className="text-xs font-bold text-sky-600 dark:text-sky-300 bg-sky-500/20 px-3 py-1 rounded-full">AviationWeather.gov</span>
  </div>
  <div className="p-6">
  <p className="font-mono text-sm text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-white/20 shadow-inner leading-relaxed">
  {weather.metar.rawOb}
  </p>
  <div className="grid grid-cols-2 gap-4 mt-6">
  <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Temperature</p>
  <p className="text-2xl font-black text-slate-800 dark:text-white">{weather.metar.temp}°C</p>
  </div>
  <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dewpoint</p>
  <p className="text-2xl font-black text-slate-800 dark:text-white">{weather.metar.dewp}°C</p>
  </div>
  <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Wind</p>
  <p className="text-lg font-black text-slate-800 dark:text-white flex items-center">
  <Wind className="w-4 h-4 mr-2 text-sky-500"/> {weather.metar.wdir}° @ {weather.metar.wspd}kt
  </p>
  </div>
  <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Altimeter</p>
  <p className="text-lg font-black text-slate-800 dark:text-white">{weather.metar.altim} hPa</p>
  </div>
 </div>
 </div>
 </div>
 )}

  {!error && weather?.taf && (
  <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-500 group">
  <div className="bg-indigo-500/10 p-5 flex items-center justify-between border-b border-white/10">
  <h2 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center text-lg tracking-tight">
  <div className="bg-indigo-500/20 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform">
  <Navigation className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
  </div>
  Terminal Forecast
  </h2>
  </div>
  <div className="p-6">
  <p className="font-mono text-sm text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-white/20 shadow-inner leading-relaxed whitespace-pre-line">
  {weather.taf.rawTAF.replace(/ (BECMG|FM|PROB|TEMPO) /g, '\n$1 ')}
  </p>
  </div>
 </div>
 )}
 
  {!error && !weather?.metar && !loading && (
  <div className="liquid-glass text-slate-500 dark:text-slate-400 p-8 rounded-3xl text-center">
  <Info className="w-10 h-10 mx-auto mb-4 opacity-50"/>
  <p className="font-bold">No METAR data available for {icao}.</p>
  </div>
  )}
 </div>

  {/* Windy Iframe & Mock NOTAMs */}
  <div className="col-span-12 md:col-span-7 lg:col-span-8 space-y-6">
  <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-500 group">
  <div className="bg-emerald-500/10 p-5 flex items-center justify-between border-b border-white/10">
  <h2 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center text-lg tracking-tight">
  <div className="bg-emerald-500/20 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform">
  <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-400"/>
  </div>
  Live Weather Radar
  </h2>
  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full">Powered by Windy</span>
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
  <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-500 group">
  <div className="bg-amber-500/10 p-5 flex items-center justify-between border-b border-white/10">
  <h2 className="font-bold text-amber-700 dark:text-amber-400 flex items-center text-lg tracking-tight">
  <div className="bg-amber-500/20 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform">
  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
  </div>
  Active NOTAMs
  </h2>
  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full">{icao}</span>
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
            <div key={notam.id} className="border-l-4 border-amber-500 bg-white/40 dark:bg-black/20 p-5 rounded-r-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black text-amber-700 dark:text-amber-400">{notam.id}</span>
                <span className="text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full">{notam.type}</span>
              </div>
              <p className="font-mono text-sm text-slate-800 dark:text-slate-300 mb-4">{notam.text}</p>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
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
