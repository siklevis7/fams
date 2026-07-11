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
  case 'Level 1': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 border-rose-200';
  case 'Level 2': return 'bg-orange-100 text-orange-800 border-orange-200';
  default: return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 border-indigo-200 dark:border-indigo-800/50 ';
  }
  };

  const getStatusColor = (status) => {
  switch(status) {
  case 'Open': return 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30';
  case 'CAP Submitted': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30';
  case 'Closed': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
  default: return 'bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white border border-white/20';
  }
  };

 const getUserName = (id) => users.find(u => u.id === id)?.full_name || 'Unassigned';

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading compliance data...</div>;

   return (
   <div className="space-y-6 pb-20">
   <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300">
   <div className="flex border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md">
   <button 
   className={`flex-1 py-5 font-black text-sm tracking-widest uppercase transition-all duration-300 ${activeTab === 'findings' ? 'text-indigo-600 dark:text-indigo-400 border-b-4 border-indigo-600 bg-white/50 dark:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-black/20'}`}
   onClick={() => setActiveTab('findings')}
   >
   <ShieldAlert className="inline w-5 h-5 mr-2"/> RCAA Findings & Audits
   </button>
   {user.role === 'Administrator' && (
   <button 
   className={`flex-1 py-5 font-black text-sm tracking-widest uppercase transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 border-b-4 border-indigo-600 bg-white/50 dark:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-black/20'}`}
   onClick={() => setActiveTab('settings')}
   >
   <Settings className="inline w-5 h-5 mr-2"/> Compliance Rules Engine
   </button>
   )}
   </div>
 
  {activeTab === 'findings' && (
  <div className="p-8">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
  <div>
  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Audit Findings</h2>
  <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1">Track discrepancies and Corrective Action Plans (CAP)</p>
  </div>
   <button 
   onClick={() => setShowAddModal(true)}
   className="w-full md:w-auto px-6 py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/30 backdrop-blur-md"
   >
   <Plus size={20} className="mr-2"/> Log Finding
   </button>
  </div>

  <div className="space-y-4">
  {findings.length === 0 ? (
  <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">No findings logged.</div>
  ) : findings.map(f => (
  <div key={f.id} className="border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start justify-between bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/40 transition-colors shadow-sm">
  <div className="flex-1 pr-0 md:pr-8 w-full">
  <div className="flex items-center space-x-4 mb-3">
  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${getLevelColor(f.level)}`}>
  {f.level}
  </span>
  <h3 className="font-black text-xl text-slate-800 dark:text-white break-words tracking-tight">{f.title}</h3>
  </div>
  <p className="text-base font-medium text-slate-600 dark:text-slate-300 mb-5">{f.description}</p>
  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide">
  <span className="flex items-center"><Clock className="w-4 h-4 mr-2"/> Issued: {format(parseISO(f.date_issued), 'MMM dd, yyyy')}</span>
  <span className="flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-orange-500"/> Due: {f.due_date ? format(parseISO(f.due_date), 'MMM dd, yyyy') : 'N/A'}</span>
  <span className="flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl">Assigned to: {getUserName(f.assigned_to)}</span>
  </div>
  </div>
  <div className="flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-48 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/20 dark:border-white/10">
  <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase ${getStatusColor(f.status)}`}>
  {f.status}
  </span>
   <div className="flex flex-col gap-2 mt-4 md:mt-6 w-full items-end">
   {f.status === 'Open' && (
   <button onClick={() => handleUpdateStatus(f.id, 'CAP Submitted')} className="w-full md:w-auto px-4 py-2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-500/30 transition-all border border-indigo-500/30">
   Submit CAP
   </button>
   )}
  {f.status === 'CAP Submitted' && user.role === 'Administrator' && (
  <button onClick={() => handleUpdateStatus(f.id, 'Closed')} className="w-full md:w-auto px-4 py-2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/30 transition-all border border-emerald-500/30">
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
  <div className="p-8">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
  <div>
  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Adjustable Compliance Rules</h2>
  <p className="text-base font-medium text-slate-500 dark:text-slate-400">Modify school-level parameters that the legality engine uses.</p>
  </div>
   <button 
   onClick={() => setShowAddSettingModal(true)}
   className="w-full sm:w-auto px-6 py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/30 backdrop-blur-md"
   >
   <Plus size={20} className="mr-2"/> Add Rule
   </button>
  </div>
 
 <div className="space-y-4">
  <div className="space-y-4">
  {settings.map(setting => (
  <div key={setting.key} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-white/20 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/40 transition-colors shadow-sm">
  <div className="flex-1 w-full">
  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm break-all bg-indigo-500/10 px-3 py-1 rounded-lg w-max">{setting.key}</h4>
  <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-3">{setting.description}</p>
  </div>
  
  <div className="flex items-center space-x-4 w-full md:w-auto justify-start md:justify-end mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/20 dark:border-white/10">
  {editSetting?.key === setting.key ? (
  <>
  <input 
  type="text"
  value={editSetting.value} 
  onChange={(e) => setEditSetting({...editSetting, value: e.target.value})}
  className="w-32 px-4 py-2 border-2 border-indigo-500 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white rounded-xl text-right font-black text-lg focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
  />
  <button onClick={handleSettingSave} className="text-emerald-700 dark:text-emerald-400 font-bold text-sm bg-emerald-500/20 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-all border border-emerald-500/30">Save</button>
  <button onClick={() => setEditSetting(null)} className="text-slate-600 dark:text-slate-300 font-bold text-sm bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-white/20 dark:border-white/10">Cancel</button>
  </>
  ) : (
   <>
   <span className="text-3xl font-black text-slate-800 dark:text-white text-left md:text-right pr-2 tracking-tighter">{setting.value}</span>
   <button onClick={() => setEditSetting(setting)} className="text-indigo-600 dark:text-indigo-400 p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 ml-auto md:ml-0 transition-all duration-300 hover:scale-105 border border-indigo-500/20">
   <Edit className="w-5 h-5"/>
   </button>
   </>
  )}
  </div>
  </div>
  ))}
  </div></div>
 </div>
 )}
 </div>

 {showAddModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
 <div className="bg-rose-600 p-6 text-white">
 <h2 className="text-xl font-bold">Log Audit Finding</h2>
 <p className="text-rose-100 text-sm mt-1">Record an RCAA or Internal Audit discrepancy.</p>
 </div>
 <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title / Reference</label>
 <input 
 type="text"required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"
 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
 />
 </div>
 
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
 <textarea 
 required rows="3"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
 ></textarea>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Level</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
 >
 <option value="Level 1">Level 1</option>
 <option value="Level 2">Level 2</option>
 <option value="Observation">Observation</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Due Date for CAP</label>
 <input 
 type="date"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Assign To (Accountable Manager)</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
 >
 <option value="">-- Unassigned --</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
 </select>
 </div>

 <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
 <button type="button"onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
 <button type="submit"className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700">Save Finding</button>
 </div>
 </form>
 </div>
 </div>
 )}

  {showAddSettingModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
  <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
  <div className="bg-indigo-600 p-6 text-white">
  <h2 className="text-xl font-bold">Add Compliance Rule</h2>
  <p className="text-indigo-100 text-sm mt-1">Add a new parameter key for the engine.</p>
  </div>
 <form onSubmit={handleAddSettingSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rule Key</label>
 <select 
 required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
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
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Value</label>
 <input 
 type="text" required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={newSettingForm.value} onChange={e => setNewSettingForm({...newSettingForm, value: e.target.value})}
 placeholder="e.g., 14"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
 <textarea 
 rows="3"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={newSettingForm.description} onChange={e => setNewSettingForm({...newSettingForm, description: e.target.value})}
 placeholder="Briefly describe what this rule does"
 ></textarea>
 </div>
  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
  <button type="button" onClick={() => setShowAddSettingModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 hover:-translate-y-0.5 shadow-md">Save Rule</button>
  </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default ComplianceAudits;
