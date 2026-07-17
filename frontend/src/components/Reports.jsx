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
      const res = await fetch(`${API_BASE}/api/analytics/summary`, {
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
    link.setAttribute('download', `kfms_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
    </div>
  );
 if (!data) return <div className="page-container empty-state form-card mb-limit-alert danger" style={{ background: 'transparent' }}><span style={{ color: 'var(--color-danger)' }}>Failed to load analytics data.</span></div>;

 const total = data.total_bookings || 1; // Prevent division by zero
 const completionRate = Math.round((data.completed_bookings / total) * 100) || 0;
 const cancellationRate = Math.round((data.cancelled_bookings / total) * 100) || 0;

 return (
  <div className="page-container space-y-6">
   <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
  <button onClick={handleExportCSV} className="btn btn-primary">
  <Download size={20} style={{ marginRight: '0.5rem' }}/>
  Export Data
  </button>
  </div>

  {/* Quick Stats Grid */}
  <div className="grid-layout">
  <div className="stat-card-indigo" style={{ gridColumn: 'span 3' }}>
  <div className="stat-header">
  <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
  <Activity size={24} style={{ color: 'var(--color-primary)' }}/>
  </div>
  </div>
  <h3 className="stat-label" style={{ color: 'var(--text-muted)' }}>Total Flights</h3>
  <p className="stat-value" style={{ color: 'var(--text-main)' }}>{data.total_bookings}</p>
  <p className="stat-desc" style={{ color: 'var(--text-muted)' }}>All time scheduled</p>
  </div>
  
  <div className="stat-card-violet" style={{ gridColumn: 'span 3' }}>
  <div className="stat-header">
  <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
  <Plane size={24} style={{ color: '#8b5cf6' }}/>
  </div>
  </div>
  <h3 className="stat-label" style={{ color: 'var(--text-muted)' }}>Flight Hours</h3>
  <p className="stat-value" style={{ color: 'var(--text-main)' }}>{data.total_flight_hours.toFixed(1)} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>hrs</span></p>
  <p className="stat-desc" style={{ color: 'var(--text-muted)' }}>Total PIC & Dual logged</p>
  </div>

  <div className="stat-card-rose" style={{ gridColumn: 'span 3' }}>
  <div className="stat-header">
  <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
  <ShieldAlert size={24} style={{ color: 'var(--color-danger)' }}/>
  </div>
  </div>
  <h3 className="stat-label" style={{ color: 'rgba(244, 63, 94, 0.8)' }}>Active Findings</h3>
  <p className="stat-value" style={{ color: 'var(--color-danger)' }}>{data.active_findings}</p>
  <p className="stat-desc" style={{ color: 'rgba(244, 63, 94, 0.8)' }}>Open RCAA / Audit CAPs</p>
  </div>

  <div className="stat-card-amber" style={{ gridColumn: 'span 3' }}>
  <div className="stat-header">
  <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
  <FileText size={24} style={{ color: 'var(--color-warning)' }}/>
  </div>
  </div>
  <h3 className="stat-label" style={{ color: 'rgba(245, 158, 11, 0.8)' }}>Expiring Docs</h3>
  <p className="stat-value" style={{ color: 'var(--color-warning)' }}>{data.expiring_documents}</p>
  <p className="stat-desc" style={{ color: 'rgba(245, 158, 11, 0.8)' }}>Expiring within 30 days</p>
  </div>
  </div>

  <div className="grid-layout">
  {/* Progress Bento */}
  <div className="form-card" style={{ gridColumn: 'span 7' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
  <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)', marginRight: '1rem' }}>
  <PieChart size={20} style={{ color: 'var(--color-primary)' }}/>
  </div>
  <h3 className="form-title" style={{ margin: 0, fontSize: '1.25rem' }}>Scheduled vs Realized</h3>
  </div>
  
  <div className="space-y-8">
  <div>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
  <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--color-success)', marginRight: '0.5rem' }}></span>Completed ({data.completed_bookings})</span>
  <span style={{ color: 'var(--text-main)', fontSize: '1.125rem' }}>{completionRate}%</span>
  </div>
  <div className="progress-bar-bg">
  <div className="progress-bar-fill progress-bar-emerald" style={{ width: `${completionRate}%` }}></div>
  </div>
  </div>

  <div>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
  <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--color-danger)', marginRight: '0.5rem' }}></span>Cancelled ({data.cancelled_bookings})</span>
  <span style={{ color: 'var(--text-main)', fontSize: '1.125rem' }}>{cancellationRate}%</span>
  </div>
  <div className="progress-bar-bg">
  <div className="progress-bar-fill progress-bar-rose" style={{ width: `${cancellationRate}%` }}></div>
  </div>
  </div>

  <div>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
  <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}><span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--color-primary)', marginRight: '0.5rem' }}></span>Upcoming ({data.scheduled_bookings})</span>
  <span style={{ color: 'var(--text-main)', fontSize: '1.125rem' }}>{Math.round((data.scheduled_bookings / total) * 100) || 0}%</span>
  </div>
  <div className="progress-bar-bg">
  <div className="progress-bar-fill progress-bar-indigo" style={{ width: `${Math.round((data.scheduled_bookings / total) * 100) || 0}%` }}></div>
  </div>
  </div>
  </div>
  </div>

  {/* Fleet Utilization Bento */}
  <div className="form-card" style={{ gridColumn: 'span 5' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
  <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', marginRight: '1rem' }}>
  <BarChart3 size={20} style={{ color: '#8b5cf6' }}/>
  </div>
  <h3 className="form-title" style={{ margin: 0, fontSize: '1.25rem' }}>Fleet Utilization</h3>
  </div>
 
 <div className="space-y-6">
 {data.fleet_utilization && data.fleet_utilization.length > 0 ? (
 data.fleet_utilization.sort((a,b) => b.hours - a.hours).map((fleet, idx) => {
 const maxHours = Math.max(...data.fleet_utilization.map(f => f.hours)) || 1;
 const width = Math.round((fleet.hours / maxHours) * 100);
 return (
 <div key={idx}>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
  <span>{fleet.name}</span>
  <span>{fleet.hours.toFixed(1)} <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>hrs</span></span>
  </div>
  <div className="progress-bar-bg" style={{ height: '0.75rem' }}>
  <div className="progress-bar-fill progress-bar-violet" style={{ width: `${width}%` }}></div>
  </div>
 </div>
 );
 })
 ) : (
 <p className="empty-state">No fleet data available.</p>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default Reports;
