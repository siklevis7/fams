import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, CheckCircle, X, ShieldAlert, History } from 'lucide-react';
import { API_BASE } from '../config';
import { toast } from 'sonner';

export default function Maintenance({ token }) {
  const [squawks, setSquawks] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    resource_id: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSquawks, resResources] = await Promise.all([
        fetch(`${API_BASE}/api/squawks/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/resources/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (resSquawks.ok && resResources.ok) {
        setSquawks(await resSquawks.json());
        setResources(await resResources.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleReportSquawk = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/squawks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resource_id: parseInt(formData.resource_id),
          description: formData.description
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchData();
        toast.success('Defect reported successfully.');
      } else {
        toast.error('Failed to report squawk.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearSquawk = async (squawkId) => {
    try {
      const res = await fetch(`${API_BASE}/api/squawks/${squawkId}/clear`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        toast.success('Squawk cleared successfully.');
      } else {
        toast.error('You do not have permission to clear this squawk (Admin or Instructor only).');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
      <p style={{ color: 'var(--text-muted)' }}>Loading maintenance records...</p>
    </div>
  );

  const openSquawks = squawks.filter(s => s.status === 'Open');
  const closedSquawks = squawks.filter(s => s.status === 'Fixed');

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench size={32} style={{ color: 'var(--color-primary)' }}/> Aircraft Tech Log
          </h1>
          <p className="text-subheading">Manage fleet defects, squawks, and maintenance releases.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}>
          <AlertTriangle size={20} /> Report Defect
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card-rose">
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Grounded / Open Defects</div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#f43f5e' }}>{openSquawks.length}</div>
        </div>
        <div className="stat-card-indigo">
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Historical Records</div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <History size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#6366f1' }}>{closedSquawks.length}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-subheading" style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Active Squawks</h2>
        </div>
        
        {openSquawks.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 1rem', color: 'var(--color-success)', opacity: 0.5 }}/>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Fleet is Healthy</h3>
            <p style={{ color: 'var(--text-muted)' }}>No active squawks or defects reported.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1px', background: 'var(--border-light)' }}>
            {openSquawks.map(squawk => (
              <div key={squawk.id} style={{ background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--color-danger)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)' }}>{squawk.resource?.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.125rem 0.5rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Grounded
                      </span>
                    </div>
                    <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem', fontWeight: '500' }}>{squawk.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                      <span>Reported by: <strong style={{ color: 'var(--text-main)' }}>{squawk.reporter?.full_name}</strong></span>
                      <span>Date: <strong style={{ color: 'var(--text-main)' }}>{new Date(squawk.reported_at).toLocaleString()}</strong></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleClearSquawk(squawk.id)}
                    className="btn btn-secondary" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle size={18} /> Clear Squawk
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {closedSquawks.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <h2 className="text-subheading" style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Maintenance History</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Aircraft</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Reported By</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Cleared By</th>
                </tr>
              </thead>
              <tbody>
                {closedSquawks.slice(0, 10).map((squawk, i) => (
                  <tr key={squawk.id} style={{ borderBottom: i === Math.min(closedSquawks.length, 10) - 1 ? 'none' : '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {squawk.resource?.name}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {squawk.description}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>
                      {squawk.reporter?.full_name} <span style={{ fontSize: '0.75rem', display: 'block', opacity: 0.7 }}>{new Date(squawk.reported_at).toLocaleDateString()}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-success)', fontWeight: '600', fontSize: '0.9rem' }}>
                      {squawk.fixed_by?.full_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '28rem', padding: 0, overflow: 'hidden', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <AlertTriangle size={24} /> Report Defect
              </h3>
              <button onClick={() => setShowAddModal(false)} className="icon-btn" style={{ color: 'rgba(255,255,255,0.7)', padding: '0.25rem' }}><X size={24}/></button>
            </div>
            <form onSubmit={handleReportSquawk} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Aircraft</label>
                <select required className="input-field"
                  onChange={(e) => setFormData({...formData, resource_id: e.target.value})}>
                  <option value="">Select an aircraft...</option>
                  {resources.filter(r => r.type === 'Aircraft').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description (Squawk)</label>
                <textarea required className="input-field" style={{ minHeight: '8rem', resize: 'vertical' }}
                  placeholder="e.g. Right main tire worn past limits..."
                  onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
                  Ground Aircraft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
