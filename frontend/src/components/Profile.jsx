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

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading profile...</div>;

 return (
 <div className="max-w-3xl mx-auto space-y-6">
 <div className="flex items-center space-x-3 mb-6">
 <UserCircle className="w-10 h-10 text-indigo-600 dark:text-indigo-400"/>
 <div>
 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h1>
 <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your personal details and aviation records</p>
 </div>
 </div>

 {warnings.length > 0 && (
 <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl shadow-sm mb-6">
 <h3 className="flex items-center text-orange-800 dark:text-orange-400 font-bold mb-2">
 <AlertTriangle className="w-5 h-5 mr-2"/>
 Legality & Compliance Warnings
 </h3>
 <ul className="list-disc pl-5 space-y-1 text-orange-700 dark:text-orange-300 text-sm font-medium">
 {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
 </ul>
 </div>
 )}

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
 <form onSubmit={handleSubmit} className="p-8 space-y-6">
 
 {success && (
 <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 p-4 rounded-lg flex items-center">
 <CheckCircle2 className="w-5 h-5 mr-2"/> Profile updated successfully!
 </div>
 )}

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center">
 <AlertTriangle className="w-5 h-5 mr-2"/> {error}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">Personal Details</h3>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
 <input required type="text"value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
 <input required type="email"value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
 <input type="tel"value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"placeholder="+250..."/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Date of Birth</label>
 <input type="date"value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">Aviation Details</h3>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Assigned Role</label>
 <input type="text"value={formData.role} disabled className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 cursor-not-allowed"/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Body Weight (kg)</label>
 <div className="relative">
 <input required type="number"step="0.1"value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-300 text-indigo-900 dark:text-indigo-100 font-bold rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-indigo-500"/>
 <span className="absolute right-4 top-2.5 text-indigo-500 font-bold text-sm">kg</span>
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required for accurate Mass & Balance calculations.</p>
 </div>
 </div>
 </div>

 <div className="pt-6 border-t flex justify-end">
 <button disabled={saving} type="submit"className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-all duration-300 hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:hover:translate-y-0">
 <Save className="w-5 h-5 mr-2"/> {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </div>
 </form>
 </div>

 {/* Password Change Section */}
 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 overflow-hidden mt-6 transition-all duration-300">
 <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
 
 {passwordSuccess && (
 <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 p-4 rounded-lg flex items-center">
 <CheckCircle2 className="w-5 h-5 mr-2"/> Password changed successfully!
 </div>
 )}

 {passwordError && (
 <div className="bg-red-50 border border-red-200 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center">
 <AlertTriangle className="w-5 h-5 mr-2"/> {passwordError}
 </div>
 )}

 <div className="space-y-4">
 <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">Change Password</h3>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Current Password</label>
 <input required type="password" value={passwordData.current_password} onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">New Password</label>
 <input required type="password" value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Confirm New Password</label>
 <input required type="password" value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"/>
 </div>
 </div>

 <div className="pt-6 border-t flex justify-end">
 <button disabled={savingPassword} type="submit" className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-all duration-300 hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:hover:translate-y-0">
 <Save className="w-5 h-5 mr-2"/> {savingPassword ? 'Updating...' : 'Update Password'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
