import React, { useState, useEffect } from 'react';
import { UserCircle, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

export default function Profile({ token }) {
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState('');
 const [warnings, setWarnings] = useState([]);

 const [formData, setFormData] = useState({
 full_name: '',
 email: '',
 phone: '',
 dob: '',
 weight: 0,
 role: ''
 });

 const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
 const [passwordError, setPasswordError] = useState('');
 const [passwordSuccess, setPasswordSuccess] = useState(false);
 const [savingPassword, setSavingPassword] = useState(false);

 useEffect(() => {
 fetch(`${API_BASE}/api/users/me`, {
 headers: { 'Authorization': `Bearer ${token}` }
 })
 .then(res => res.json())
 .then(data => {
 setFormData({
 full_name: data.full_name || '',
 email: data.email || '',
 phone: data.phone || '',
 dob: data.dob ? data.dob.split('T')[0] : '', // Extract just YYYY-MM-DD
 weight: data.weight || 0,
 role: data.role || ''
 });
 setLoading(false);
 })
 .catch(err => {
 console.error(err);
 setLoading(false);
 });

 fetch(`${API_BASE}/api/users/me/compliance_warnings`, {
 headers: { 'Authorization': `Bearer ${token}` }
 })
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) setWarnings(data);
 })
 .catch(err => console.error(err));
 }, [token]);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setSaving(true);
 setError('');
 setSuccess(false);

 try {
 const payload = {
 ...formData,
 dob: formData.dob ? new Date(formData.dob).toISOString() : null,
 };

 const res = await fetch(`${API_BASE}/api/users/me`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify(payload)
 });

 if (res.ok) {
 setSuccess(true);
 setTimeout(() => setSuccess(false), 3000);
 } else {
 const data = await res.json();
 setError(data.detail || 'Failed to update profile');
 }
 } catch (err) {
 setError('Network error');
 } finally {
 setSaving(false);
 }
 };

 const handlePasswordSubmit = async (e) => {
 e.preventDefault();
 setPasswordError('');
 setPasswordSuccess(false);

 if (passwordData.new_password !== passwordData.confirm_password) {
 setPasswordError("Passwords do not match");
 return;
 }

 if (passwordData.new_password.length < 6) {
 setPasswordError("Password must be at least 6 characters long");
 return;
 }

 setSavingPassword(true);
 try {
 const res = await fetch(`${API_BASE}/api/users/me/password`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({ current_password: passwordData.current_password, new_password: passwordData.new_password })
 });

 if (res.ok) {
 setPasswordSuccess(true);
 setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
 setTimeout(() => setPasswordSuccess(false), 3000);
 } else {
 const data = await res.json();
 setPasswordError(data.detail || 'Failed to update password');
 }
 } catch (err) {
 setPasswordError('Network error');
 } finally {
 setSavingPassword(false);
 }
 };

 if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--text-muted)' }}>Loading profile...</p></div>;

 return (
 <div className="page-container space-y-6" style={{ maxWidth: '48rem', margin: '0 auto' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
 <UserCircle size={40} style={{ color: 'var(--color-primary)' }}/>
 <div>
 <h1 className="progress-title" style={{ fontSize: '1.875rem' }}>My Profile</h1>
 <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '0.25rem' }}>Manage your personal details and aviation records</p>
 </div>
 </div>

 {warnings.length > 0 && (
 <div className="mb-limit-alert warning" style={{ marginBottom: '2rem' }}>
 <h3 className="mb-limit-alert-title" style={{ display: 'flex', alignItems: 'center' }}>
 <AlertTriangle size={20} style={{ marginRight: '0.5rem' }}/>
 Legality & Compliance Warnings
 </h3>
 <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', fontWeight: '500', color: 'var(--color-warning)' }}>
 {warnings.map((w, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{w}</li>)}
 </ul>
 </div>
 )}

 <div className="form-card">
 <form onSubmit={handleSubmit} className="space-y-6">
 
 {success && (
 <div className="mb-limit-alert success">
 <CheckCircle2 size={20} style={{ color: 'var(--color-success)', marginRight: '0.5rem', flexShrink: 0 }}/> 
 <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>Profile updated successfully!</span>
 </div>
 )}

 {error && (
 <div className="mb-limit-alert danger">
 <AlertTriangle size={20} style={{ color: 'var(--color-danger)', marginRight: '0.5rem', flexShrink: 0 }}/> 
 <span style={{ color: 'var(--color-danger)', fontWeight: '500' }}>{error}</span>
 </div>
 )}

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
 <div className="space-y-4">
 <h3 className="form-title" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Personal Details</h3>
 <div className="form-group mb-0">
 <label className="form-label">Full Name</label>
 <input required type="text"value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-field"/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Email Address</label>
 <input required type="email"value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field"/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Phone Number</label>
 <input type="tel"value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" placeholder="+250..."/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Date of Birth</label>
 <input type="date"value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="input-field"/>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="form-title" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Aviation Details</h3>
 <div className="form-group mb-0">
 <label className="form-label">Assigned Role</label>
 <input type="text"value={formData.role} disabled className="input-field" style={{ background: 'var(--bg-main)', opacity: 0.7, cursor: 'not-allowed' }}/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Body Weight (kg)</label>
 <div style={{ position: 'relative' }}>
 <input required type="number"step="0.1"value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} className="input-field" style={{ paddingRight: '3rem', fontWeight: '900', color: 'var(--color-primary)', background: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.2)' }}/>
 <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', fontWeight: '900', fontSize: '0.875rem' }}>kg</span>
 </div>
 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>Required for accurate Mass & Balance calculations.</p>
 </div>
 </div>
 </div>

 <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
 <button disabled={saving} type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
 <Save size={20} style={{ marginRight: '0.5rem' }}/> {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </div>
 </form>
 </div>

 {/* Password Change Section */}
 <div className="form-card" style={{ marginTop: '1.5rem' }}>
 <form onSubmit={handlePasswordSubmit} className="space-y-6">
 
 {passwordSuccess && (
 <div className="mb-limit-alert success">
 <CheckCircle2 size={20} style={{ color: 'var(--color-success)', marginRight: '0.5rem', flexShrink: 0 }}/> 
 <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>Password changed successfully!</span>
 </div>
 )}

 {passwordError && (
 <div className="mb-limit-alert danger">
 <AlertTriangle size={20} style={{ color: 'var(--color-danger)', marginRight: '0.5rem', flexShrink: 0 }}/> 
 <span style={{ color: 'var(--color-danger)', fontWeight: '500' }}>{passwordError}</span>
 </div>
 )}

 <div className="space-y-4">
 <h3 className="form-title" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Change Password</h3>
 <div className="form-group mb-0">
 <label className="form-label">Current Password</label>
 <input required type="password" value={passwordData.current_password} onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} className="input-field"/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">New Password</label>
 <input required type="password" value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} className="input-field"/>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Confirm New Password</label>
 <input required type="password" value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} className="input-field"/>
 </div>
 </div>

 <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
 <button disabled={savingPassword} type="submit" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', background: 'var(--text-main)', color: 'var(--bg-main)' }}>
 <Save size={20} style={{ marginRight: '0.5rem' }}/> {savingPassword ? 'Updating...' : 'Update Password'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
