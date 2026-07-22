import React, { useState, useEffect } from 'react';
import { ShieldAlert, Settings, Plus, CheckCircle, Clock, AlertTriangle, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { API_BASE } from '../config';

const ComplianceAudits = ({ token, user }) => {
 const [activeTab, setActiveTab] = useState('findings');
 const [findings, setFindings] = useState([]);
 const [settings, setSettings] = useState([]);
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const [showAddModal, setShowAddModal] = useState(false);
 const [formData, setFormData] = useState({
 title: '',
 description: '',
 level: 'Observation',
 assigned_to: '',
 due_date: ''
 });
 const [editSetting, setEditSetting] = useState(null);
 const [showAddSettingModal, setShowAddSettingModal] = useState(false);
 const [newSettingForm, setNewSettingForm] = useState({
 key: '',
 value: '',
 description: ''
 });

 const KNOWN_RULES = [
 { key: '', label: '-- Select a parameter --', desc: '' },
 { key: 'max_flight_hours_daily', label: 'Max Daily Flight Hours', desc: 'Maximum flight hours allowed in a single day' },
 { key: 'max_duty_hours_daily', label: 'Max Daily Duty Hours', desc: 'Maximum duty hours allowed in a single day' },
 { key: 'min_rest_hours', label: 'Minimum Rest Hours', desc: 'Minimum consecutive rest hours required between duty periods' },
 { key: 'max_flight_hours_28_days', label: 'Max Flight Hours (28 Days)', desc: 'Maximum flight hours allowed in a 28-day period' },
 { key: 'max_flight_hours_yearly', label: 'Max Yearly Flight Hours', desc: 'Maximum flight hours allowed in a calendar year' },
 { key: 'currency_landings_90_days', label: '90-Day Landing Currency', desc: 'Required landings in the last 90 days' },
 { key: 'medical_validity_months', label: 'Medical Validity (Months)', desc: 'Validity period of medical certificate in months' },
 { key: 'max_wind_student_solo_knots', label: 'Max Wind - Student Solo (Knots)', desc: 'Maximum wind limit for student solo flights' }
 ];

 const handleAddSettingSubmit = async (e) => {
 e.preventDefault();
 try {
 const res = await fetch(`${API_BASE}/api/settings/`, {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(newSettingForm)
 });
 if (res.ok) {
 setShowAddSettingModal(false);
 setNewSettingForm({ key: '', value: '', description: '' });
 fetchData();
 } else {
 const error = await res.json();
 toast.error(error.detail || "Failed to add rule");
 }
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const headers = { 'Authorization': `Bearer ${token}` };
 const [findRes, setRes, usersRes] = await Promise.all([
 fetch(`${API_BASE}/api/findings/`, { headers }),
 user.role === 'Administrator' ? fetch(`${API_BASE}/api/settings/`, { headers }) : Promise.resolve(null),
 fetch(`${API_BASE}/api/users/`, { headers })
 ]);
 
 if (findRes.ok) setFindings(await findRes.json());
 if (setRes && setRes.ok) setSettings(await setRes.json());
 if (usersRes.ok) setUsers(await usersRes.json());
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const handleAddSubmit = async (e) => {
 e.preventDefault();
 try {
 const payload = {
 ...formData,
 assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
 due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
 };

 const res = await fetch(`${API_BASE}/api/findings/`, {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 setShowAddModal(false);
 fetchData();
 } else {
 const error = await res.json();
 toast.error(error.detail || "Failed to add finding");
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleUpdateStatus = async (id, newStatus) => {
 try {
 const res = await fetch(`${API_BASE}/api/findings/${id}`, {
 method: 'PATCH',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (res.ok) {
 fetchData();
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleSettingSave = async () => {
 try {
 const res = await fetch(`${API_BASE}/api/settings/`, {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(editSetting)
 });
 if (res.ok) {
 setEditSetting(null);
 fetchData();
 }
 } catch (err) {
 console.error(err);
 }
 };

 const getLevelColor = (level) => {
  switch(level) {
  case 'Level 1': return 'badge-danger';
  case 'Level 2': return 'badge-warning';
  default: return 'badge-primary';
  }
  };

  const getStatusColor = (status) => {
  switch(status) {
  case 'Open': return 'badge-danger';
  case 'CAP Submitted': return 'badge-warning';
  case 'Closed': return 'badge-success';
  default: return 'badge-secondary';
  }
  };

 const getUserName = (id) => users.find(u => u.id === id)?.full_name || 'Unassigned';

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading compliance data...</p>
    </div>
  );

   return (
   <div className="page-container space-y-6">
   <div className="glass-card" style={{ padding: 0 }}>
   <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
   <button 
   className={`audit-tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
   onClick={() => setActiveTab('findings')}
   >
   <ShieldAlert size={20} style={{ marginRight: '0.5rem' }}/> RCAA Findings & Audits
   </button>
   {user.role === 'Administrator' && (
   <button 
   className={`audit-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
   onClick={() => setActiveTab('settings')}
   >
   <Settings size={20} style={{ marginRight: '0.5rem' }}/> Compliance Rules Engine
   </button>
   )}
   </div>
 
  {activeTab === 'findings' && (
  <div style={{ padding: '2rem' }}>
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
  <div>
  <h2 className="progress-title" style={{ fontSize: '1.875rem' }}>Audit Findings</h2>
  <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '0.25rem' }}>Track discrepancies and Corrective Action Plans (CAP)</p>
  </div>
   <button 
   onClick={() => setShowAddModal(true)}
   className="btn btn-primary"
   >
   <Plus size={20} style={{ marginRight: '0.5rem' }}/> Log Finding
   </button>
  </div>

  <div className="space-y-4">
  {findings.length === 0 ? (
  <div className="empty-state">No findings logged.</div>
  ) : findings.map(f => (
  <div key={f.id} className="finding-card">
  <div className="finding-content">
  <div className="finding-header">
  <span className={`badge ${getLevelColor(f.level)}`}>
  {f.level}
  </span>
  <h3 className="finding-title">{f.title}</h3>
  </div>
  <p className="finding-desc">{f.description}</p>
  <div className="finding-meta">
  <span style={{ display: 'flex', alignItems: 'center' }}><Clock size={16} style={{ marginRight: '0.5rem' }}/> Issued: {format(parseISO(f.date_issued), 'MMM dd, yyyy')}</span>
  <span style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={16} style={{ marginRight: '0.5rem', color: 'var(--color-warning)' }}/> Due: {f.due_date ? format(parseISO(f.due_date), 'MMM dd, yyyy') : 'N/A'}</span>
  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-primary)', background: 'rgba(79, 70, 229, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>Assigned to: {getUserName(f.assigned_to)}</span>
  </div>
  </div>
  <div className="finding-actions">
  <span className={`badge ${getStatusColor(f.status)}`}>
  {f.status}
  </span>
   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
   {f.status === 'Open' && (
   <button onClick={() => handleUpdateStatus(f.id, 'CAP Submitted')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
   Submit CAP
   </button>
   )}
  {f.status === 'CAP Submitted' && user.role === 'Administrator' && (
  <button onClick={() => handleUpdateStatus(f.id, 'Closed')} className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
  Close Finding
  </button>
  )}
  </div>
  </div>
  </div>
  ))}
  </div>
  </div>
 )}

  {activeTab === 'settings' && (
  <div style={{ padding: '2rem' }}>
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
  <div>
  <h2 className="progress-title" style={{ fontSize: '1.875rem' }}>Adjustable Compliance Rules</h2>
  <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '0.25rem' }}>Modify school-level parameters that the legality engine uses.</p>
  </div>
   <button 
   onClick={() => setShowAddSettingModal(true)}
   className="btn btn-primary"
   >
   <Plus size={20} style={{ marginRight: '0.5rem' }}/> Add Rule
   </button>
  </div>
 
 <div className="space-y-4">
  {settings.map(setting => (
  <div key={setting.key} className="setting-card">
  <div className="setting-content">
  <h4 className="setting-key">{setting.key}</h4>
  <p className="setting-desc">{setting.description}</p>
  </div>
  
  <div className="setting-actions">
  {editSetting?.key === setting.key ? (
  <>
  <input 
  type="text"
  value={editSetting.value} 
  onChange={(e) => setEditSetting({...editSetting, value: e.target.value})}
  className="setting-value-input"
  />
  <button onClick={handleSettingSave} className="btn" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Save</button>
  <button onClick={() => setEditSetting(null)} className="btn btn-secondary">Cancel</button>
  </>
  ) : (
   <>
   <span className="setting-value-display">{setting.value}</span>
   <button onClick={() => setEditSetting(setting)} className="btn-icon-only" style={{ color: 'var(--color-primary)', background: 'rgba(79, 70, 229, 0.1)' }}>
   <Edit size={20}/>
   </button>
   </>
  )}
  </div>
  </div>
  ))}
  </div>
  </div>
 )}
 </div>

 {showAddModal && (
 <div className="modal-overlay">
 <div className="modal-content">
 <div className="modal-header-danger">
 <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Log Audit Finding</h2>
 <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Record an RCAA or Internal Audit discrepancy.</p>
 </div>
 <form onSubmit={handleAddSubmit} className="modal-body space-y-4">
 <div className="form-group mb-0">
 <label className="form-label">Title / Reference</label>
 <input 
 type="text"required
 className="input-field"
 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
 />
 </div>
 
 <div className="form-group mb-0">
 <label className="form-label">Description</label>
 <textarea 
 required rows="3"
 className="input-field" style={{ minHeight: '6rem', resize: 'vertical' }}
 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
 ></textarea>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
 <div className="form-group mb-0">
 <label className="form-label">Level</label>
 <select 
 className="input-field"
 value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
 >
 <option value="Level 1">Level 1</option>
 <option value="Level 2">Level 2</option>
 <option value="Observation">Observation</option>
 </select>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Due Date for CAP</label>
 <input 
 type="date"
 className="input-field"
 value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
 />
 </div>
 </div>

 <div className="form-group mb-0">
 <label className="form-label">Assign To (Accountable Manager)</label>
 <select 
 className="input-field"
 value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
 >
 <option value="">-- Unassigned --</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
 </select>
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
 <button type="button"onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
 <button type="submit"className="btn btn-danger">Save Finding</button>
 </div>
 </form>
 </div>
 </div>
 )}

  {showAddSettingModal && (
  <div className="modal-overlay">
  <div className="modal-content">
  <div className="modal-header-primary">
  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Add Compliance Rule</h2>
  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Add a new parameter key for the engine.</p>
  </div>
 <form onSubmit={handleAddSettingSubmit} className="modal-body space-y-4">
 <div className="form-group mb-0">
 <label className="form-label">Rule Key</label>
 <select 
 required
 className="input-field"
 value={newSettingForm.key} 
 onChange={e => {
 const selected = KNOWN_RULES.find(r => r.key === e.target.value);
 setNewSettingForm({
 ...newSettingForm, 
 key: e.target.value,
 description: selected && selected.desc ? selected.desc : newSettingForm.description
 });
 }}
 >
 {KNOWN_RULES.map(r => (
 <option key={r.key} value={r.key}>{r.key ? `${r.key} - ${r.label}` : r.label}</option>
 ))}
 </select>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Value</label>
 <input 
 type="text" required
 className="input-field"
 value={newSettingForm.value} onChange={e => setNewSettingForm({...newSettingForm, value: e.target.value})}
 placeholder="e.g., 14"
 />
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Description</label>
 <textarea 
 rows="3"
 className="input-field" style={{ minHeight: '6rem', resize: 'vertical' }}
 value={newSettingForm.description} onChange={e => setNewSettingForm({...newSettingForm, description: e.target.value})}
 placeholder="Briefly describe what this rule does"
 ></textarea>
 </div>
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
  <button type="button" onClick={() => setShowAddSettingModal(false)} className="btn btn-secondary">Cancel</button>
  <button type="submit" className="btn btn-primary">Save Rule</button>
  </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default ComplianceAudits;
