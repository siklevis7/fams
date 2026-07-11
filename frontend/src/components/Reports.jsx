import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Plane, FileText, Download, ShieldAlert, Calendar } from 'lucide-react';
import { API_BASE } from '../config';


const Reports = ({ token, user }) => {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchAnalytics();
 }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Flights', data.total_bookings],
      ['Completed Flights', data.completed_bookings],
      ['Cancelled Flights', data.cancelled_bookings],
      ['Total Flight Hours', data.total_flight_hours],
      ['Active Findings', data.active_findings],
      ['Expiring Documents', data.expiring_documents],
      [],
      ['Aircraft', 'Hours Flown']
    ];
    
    if (data.fleet_utilization) {
      data.fleet_utilization.forEach(f => {
        csvRows.push([f.name, f.hours.toFixed(1)]);
      });
    }

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fams_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading analytics data...</div>;
 if (!data) return <div className="p-8 text-center text-rose-500">Failed to load analytics data.</div>;

 const total = data.total_bookings || 1; // Prevent division by zero
 const completionRate = Math.round((data.completed_bookings / total) * 100) || 0;
 const cancellationRate = Math.round((data.cancelled_bookings / total) * 100) || 0;

 return (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
   <div className="flex justify-end mb-2 col-span-12 relative z-10">
  <button onClick={handleExportCSV} className="w-full md:w-auto mt-6 md:mt-0 px-6 py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30 backdrop-blur-md">
  <Download size={20} className="mr-2"/>
  Export Data
  </button>
  </div>

  {/* Quick Stats Grid */}
  <div className="col-span-12 md:col-span-6 lg:col-span-3 liquid-glass p-6 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl group">
  <div className="flex justify-between items-start mb-4">
  <div className="bg-indigo-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
  <Activity className="text-indigo-600 dark:text-indigo-400 w-6 h-6"/>
  </div>
  </div>
  <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Flights</h3>
  <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-white">{data.total_bookings}</p>
  <p className="text-xs text-slate-400 mt-2 font-medium">All time scheduled</p>
  </div>
  
  <div className="col-span-12 md:col-span-6 lg:col-span-3 liquid-glass p-6 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl group">
  <div className="flex justify-between items-start mb-4">
  <div className="bg-violet-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
  <Plane className="text-violet-600 dark:text-violet-400 w-6 h-6"/>
  </div>
  </div>
  <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Flight Hours</h3>
  <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-white">{data.total_flight_hours.toFixed(1)} <span className="text-xl text-slate-400 font-bold tracking-normal">hrs</span></p>
  <p className="text-xs text-slate-400 mt-2 font-medium">Total PIC & Dual logged</p>
  </div>

  <div className="col-span-12 md:col-span-6 lg:col-span-3 liquid-glass !border-rose-200/50 dark:!border-rose-900/30 p-6 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none"></div>
  <div className="flex justify-between items-start mb-4 relative z-10">
  <div className="bg-rose-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
  <ShieldAlert className="text-rose-500 w-6 h-6"/>
  </div>
  </div>
  <h3 className="font-semibold text-rose-800/70 dark:text-rose-300/70 mb-1 relative z-10">Active Findings</h3>
  <p className="text-4xl font-black tracking-tight text-rose-600 dark:text-rose-400 relative z-10">{data.active_findings}</p>
  <p className="text-xs text-rose-500/70 mt-2 font-medium relative z-10">Open RCAA / Audit CAPs</p>
  </div>

  <div className="col-span-12 md:col-span-6 lg:col-span-3 liquid-glass !border-amber-200/50 dark:!border-amber-900/30 p-6 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
  <div className="flex justify-between items-start mb-4 relative z-10">
  <div className="bg-amber-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
  <FileText className="text-amber-500 w-6 h-6"/>
  </div>
  </div>
  <h3 className="font-semibold text-amber-800/70 dark:text-amber-300/70 mb-1 relative z-10">Expiring Docs</h3>
  <p className="text-4xl font-black tracking-tight text-amber-600 dark:text-amber-400 relative z-10">{data.expiring_documents}</p>
  <p className="text-xs text-amber-600/70 mt-2 font-medium relative z-10">Expiring within 30 days</p>
  </div>

  {/* Progress Bento */}
  <div className="col-span-12 lg:col-span-7 liquid-glass p-8 rounded-3xl">
  <div className="flex items-center mb-8">
  <div className="bg-indigo-500/10 p-2 rounded-xl mr-3">
  <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
  </div>
  <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Scheduled vs Realized</h3>
  </div>
  
  <div className="space-y-8">
  <div>
  <div className="flex justify-between text-sm font-bold mb-2">
  <span className="text-emerald-600 dark:text-emerald-400 flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Completed ({data.completed_bookings})</span>
  <span className="text-slate-800 dark:text-white text-lg">{completionRate}%</span>
  </div>
  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-4 overflow-hidden shadow-inner">
  <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
  </div>
  </div>

  <div>
  <div className="flex justify-between text-sm font-bold mb-2">
  <span className="text-rose-600 dark:text-rose-400 flex items-center"><span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>Cancelled ({data.cancelled_bookings})</span>
  <span className="text-slate-800 dark:text-white text-lg">{cancellationRate}%</span>
  </div>
  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-4 overflow-hidden shadow-inner">
  <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${cancellationRate}%` }}></div>
  </div>
  </div>

  <div>
  <div className="flex justify-between text-sm font-bold mb-2">
  <span className="text-indigo-600 dark:text-indigo-400 flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>Upcoming ({data.scheduled_bookings})</span>
  <span className="text-slate-800 dark:text-white text-lg">{Math.round((data.scheduled_bookings / total) * 100) || 0}%</span>
  </div>
  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-4 overflow-hidden shadow-inner">
  <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((data.scheduled_bookings / total) * 100) || 0}%` }}></div>
  </div>
  </div>
  </div>
  </div>

  {/* Fleet Utilization Bento */}
  <div className="col-span-12 lg:col-span-5 liquid-glass p-8 rounded-3xl">
  <div className="flex items-center mb-8">
  <div className="bg-violet-500/10 p-2 rounded-xl mr-3">
  <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400"/>
  </div>
  <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Fleet Utilization</h3>
  </div>
 
 <div className="space-y-5">
 {data.fleet_utilization && data.fleet_utilization.length > 0 ? (
 data.fleet_utilization.sort((a,b) => b.hours - a.hours).map((fleet, idx) => {
 const maxHours = Math.max(...data.fleet_utilization.map(f => f.hours)) || 1;
 const width = Math.round((fleet.hours / maxHours) * 100);
 return (
 <div key={idx}>
  <div className="flex justify-between text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
  <span>{fleet.name}</span>
  <span className="text-slate-800 dark:text-white">{fleet.hours.toFixed(1)} <span className="text-slate-400 font-medium">hrs</span></span>
  </div>
  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-3 overflow-hidden shadow-inner">
  <div className="bg-gradient-to-r from-violet-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%` }}></div>
  </div>
 </div>
 );
 })
 ) : (
 <p className="text-slate-500 dark:text-slate-400 text-sm">No fleet data available.</p>
 )}
 </div>
 </div>
 </div>
 );
};

export default Reports;
