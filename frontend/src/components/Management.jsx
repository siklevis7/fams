import React, { useState, useEffect } from 'react';
import { Users, Plane, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

export default function Management({ token, user: currentUser }) {
 const [users, setUsers] = useState([]);
 const [resources, setResources] = useState([]);
 const [activeTab, setActiveTab] = useState('users');

 // Form states
 const [editingUserId, setEditingUserId] = useState(null);
 const [editingResourceId, setEditingResourceId] = useState(null);
 const [confirmUserModal, setConfirmUserModal] = useState({ isOpen: false, user: null });
 const [confirmResourceModal, setConfirmResourceModal] = useState({ isOpen: false, resource: null });

 const [userForm, setUserForm] = useState({
 full_name: '', email: '', role: 'Student Pilot', password: ''
 });

 const [resourceForm, setResourceForm] = useState({
 name: '', type: 'Aircraft', status: 'Active',
 basic_empty_weight: 0, empty_moment: 0, max_takeoff_weight: 0,
 arm_front_seats: 0, arm_rear_seats: 0, arm_baggage_1: 0, arm_fuel: 0
 });

 const fetchData = async () => {
 try {
 const [uRes, rRes] = await Promise.all([
 fetch(`${API_BASE}/api/users/`, { headers: { 'Authorization': `Bearer ${token}` } }),
 fetch(`${API_BASE}/api/resources/`, { headers: { 'Authorization': `Bearer ${token}` } })
 ]);
 if (uRes.ok) setUsers(await uRes.json());
 if (rRes.ok) setResources(await rRes.json());
 } catch (e) { console.error(e); }
 };

 useEffect(() => { fetchData(); }, [token]);

 const handleUserSubmit = async (e) => {
 e.preventDefault();
 const url = editingUserId ? `${API_BASE}/api/users/${editingUserId}` : `${API_BASE}/api/users/`;
 const method = editingUserId ? 'PUT' : 'POST';
 
 try {
 const res = await fetch(url, {
 method: method,
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
 body: JSON.stringify(userForm)
 });
 if (res.ok) {
 setUserForm({ full_name: '', email: '', role: 'Student Pilot', password: '' });
 setEditingUserId(null);
 toast.success(editingUserId ? "User updated" : "User created");
 fetchData();
 } else {
 const errorData = await res.json();
 toast.error(errorData.detail || "Error saving user");
 }
 } catch (err) { toast.error("Network error"); }
 };

 const handleResourceSubmit = async (e) => {
 e.preventDefault();
 const url = editingResourceId ? `${API_BASE}/api/resources/${editingResourceId}` : `${API_BASE}/api/resources/`;
 const method = editingResourceId ? 'PUT' : 'POST';
 try {
 const res = await fetch(url, {
 method: method,
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
 body: JSON.stringify(resourceForm)
 });
 if (res.ok) {
 setResourceForm({
 name: '', type: 'Aircraft', status: 'Active',
 basic_empty_weight: 0, empty_moment: 0, max_takeoff_weight: 0,
 arm_front_seats: 0, arm_rear_seats: 0, arm_baggage_1: 0, arm_fuel: 0
 });
 setEditingResourceId(null);
 toast.success(editingResourceId ? "Resource updated" : "Resource created");
 fetchData();
 } else {
 toast.error("Failed to save resource");
 }
 } catch (err) { toast.error("Network error"); }
 };

 const editUser = (u) => {
 setEditingUserId(u.id);
 setUserForm({
 full_name: u.full_name,
 email: u.email,
 role: u.role,
 password: ''
 });
 };

 const editResource = (r) => {
 setEditingResourceId(r.id);
 setResourceForm({
 name: r.name, type: r.type, status: r.status,
 basic_empty_weight: r.basic_empty_weight, empty_moment: r.empty_moment, 
 max_takeoff_weight: r.max_takeoff_weight, arm_front_seats: r.arm_front_seats, 
 arm_rear_seats: r.arm_rear_seats, arm_baggage_1: r.arm_baggage_1, arm_fuel: r.arm_fuel
 });
 };

 const confirmDeleteUser = async () => {
 const u = confirmUserModal.user;
 if (!u) return;
 try {
 const res = await fetch(`${API_BASE}/api/users/${u.id}`, {
 method: 'DELETE',
 headers: { 'Authorization': `Bearer ${token}` }
 });
 if (res.ok) {
 toast.success("User deleted");
 fetchData();
 } else toast.error("Failed to delete user.");
 } catch (err) { toast.error("Network error"); }
 finally { setConfirmUserModal({ isOpen: false, user: null }); }
 };

 const confirmDeleteResource = async () => {
 const r = confirmResourceModal.resource;
 if (!r) return;
 try {
 const res = await fetch(`${API_BASE}/api/resources/${r.id}`, {
 method: 'DELETE',
 headers: { 'Authorization': `Bearer ${token}` }
 });
 if (res.ok) {
 toast.success("Resource deleted");
 fetchData();
 } else toast.error("Failed to delete resource.");
 } catch (err) { toast.error("Network error"); }
 finally { setConfirmResourceModal({ isOpen: false, resource: null }); }
 };

 const deleteUser = (u) => { setConfirmUserModal({ isOpen: true, user: u }); };
 const deleteResource = (r) => { setConfirmResourceModal({ isOpen: true, resource: r }); };

 if (currentUser?.role !== 'Administrator' && currentUser?.role !== 'Operations Officer') {
 return (
 <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400">
 <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
 <p>Only Administrators and Operations Officers can access the Management Dashboard.</p>
 </div>
 );
 }

 return (
  <div>
   <div className="col-span-12 liquid-glass p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-8">
   <div className="relative z-10">
   <h1 className="text-4xl font-black tracking-tighter text-gradient mb-2 flex items-center">
   <Users className="w-8 h-8 mr-3 text-indigo-500"/> Management Dashboard
   </h1>
   <p className="text-slate-500 dark:text-slate-400 font-medium">Manage personnel, aircraft, and system resources.</p>
   </div>
   <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

   <div className="flex flex-wrap bg-white/40 dark:bg-black/20 p-1.5 rounded-2xl w-full md:w-auto relative z-10 mt-6 md:mt-0 backdrop-blur-md shadow-inner">
   <button 
   onClick={() => setActiveTab('users')}
   className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
   Staff & Students
   </button>
   <button 
   onClick={() => setActiveTab('resources')}
   className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
   Fleet & Resources
   </button>
   </div>
   </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  
  {/* FORM COLUMN */}
  <div className="col-span-1 lg:col-span-4 space-y-6">
   {activeTab === 'users' && (
   <div className="liquid-glass p-8 rounded-3xl transition-all duration-300 relative overflow-hidden">
   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
   <h2 className="font-bold text-xl tracking-tight text-slate-800 dark:text-white mb-6 relative z-10">{editingUserId ? 'Edit User' : 'Add New User'}</h2>
   <form onSubmit={handleUserSubmit} className="space-y-5 relative z-10">
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
   <input required type="text"value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"/>
   </div>
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
   <input required type="email"value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"/>
   </div>
   {!editingUserId && (
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Temporary Password</label>
   <input required type="text"value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"/>
   </div>
   )}
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Role</label>
   <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
  <option value="Administrator">Administrator</option>
  <option value="Operations Officer">Operations Officer</option>
  <option value="Instructor">Instructor</option>
  <option value="Student Pilot">Student Pilot</option>
  <option value="Examiner">Examiner</option>
  <option value="Maintenance Engineer">Maintenance Engineer</option>
  <option value="Finance Officer">Finance Officer</option>
   </select>
   </div>
   <div className="flex space-x-3 pt-4">
   <button type="submit"className="flex-1 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center shadow-lg shadow-indigo-600/30 backdrop-blur-md">
   {editingUserId ? <><CheckCircle2 className="w-5 h-5 mr-2"/> Update User</> : <><Plus className="w-5 h-5 mr-2"/> Create User</>}
   </button>
   {editingUserId && (
   <button type="button"onClick={() => { setEditingUserId(null); setUserForm({full_name: '', email: '', role: 'Student Pilot', password: ''}); }} className="px-6 py-3 bg-slate-200/50 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300/50 font-bold transition-all">
   Cancel
   </button>
  )}
  </div>
  </form>
  </div>
  )}

  {activeTab === 'resources' && (
   <div className="liquid-glass p-8 rounded-3xl transition-all duration-300 relative overflow-hidden">
   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
   <h2 className="font-bold text-xl tracking-tight text-slate-800 dark:text-white mb-6 relative z-10">{editingResourceId ? 'Edit Resource' : 'Add New Resource'}</h2>
   <form onSubmit={handleResourceSubmit} className="space-y-5 relative z-10">
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Registration / Name</label>
   <input required type="text"value={resourceForm.name} onChange={e => setResourceForm({...resourceForm, name: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"/>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Type</label>
   <select value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
  <option value="Aircraft">Aircraft</option>
  <option value="Simulator">Simulator</option>
  <option value="Classroom">Classroom</option>
   </select>
   </div>
   <div>
   <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Status</label>
   <select value={resourceForm.status} onChange={e => setResourceForm({...resourceForm, status: e.target.value})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
  <option value="Active">Active</option>
  <option value="Maintenance">Maintenance</option>
  </select>
  </div>
  </div>

  {resourceForm.type === 'Aircraft' && (
   <div className="border-t border-white/20 dark:border-white/10 pt-6 mt-4 grid grid-cols-2 gap-3">
   <div className="col-span-2">
   <p className="text-xs font-black text-sky-600 dark:text-sky-400 mb-2 uppercase tracking-widest">Mass & Balance Specs</p>
   </div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">BEW (kg)</label><input type="number"step="0.1"value={resourceForm.basic_empty_weight} onChange={e => setResourceForm({...resourceForm, basic_empty_weight: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">MTOW (kg)</label><input type="number"step="0.1"value={resourceForm.max_takeoff_weight} onChange={e => setResourceForm({...resourceForm, max_takeoff_weight: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Empty Moment</label><input type="number"step="0.1"value={resourceForm.empty_moment} onChange={e => setResourceForm({...resourceForm, empty_moment: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Front Seat Arm</label><input type="number"step="0.1"value={resourceForm.arm_front_seats} onChange={e => setResourceForm({...resourceForm, arm_front_seats: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Rear Seat Arm</label><input type="number"step="0.1"value={resourceForm.arm_rear_seats} onChange={e => setResourceForm({...resourceForm, arm_rear_seats: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Baggage Arm</label><input type="number"step="0.1"value={resourceForm.arm_baggage_1} onChange={e => setResourceForm({...resourceForm, arm_baggage_1: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   <div className="col-span-2"><label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Fuel Arm</label><input type="number"step="0.1"value={resourceForm.arm_fuel} onChange={e => setResourceForm({...resourceForm, arm_fuel: parseFloat(e.target.value)})} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"/></div>
   </div>
   )}
   
   <div className="flex space-x-3 pt-4">
   <button type="submit"className="flex-1 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center shadow-lg shadow-emerald-600/30 backdrop-blur-md">
   {editingResourceId ? <><CheckCircle2 className="w-5 h-5 mr-2"/> Update Fleet</> : <><Plus className="w-5 h-5 mr-2"/> Add to Fleet</>}
   </button>
   {editingResourceId && (
   <button type="button"onClick={() => { setEditingResourceId(null); setResourceForm({name: '', type: 'Aircraft', status: 'Active', basic_empty_weight: 0, empty_moment: 0, max_takeoff_weight: 0, arm_front_seats: 0, arm_rear_seats: 0, arm_baggage_1: 0, arm_fuel: 0}); }} className="px-6 py-3 bg-slate-200/50 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300/50 font-bold transition-all">
   Cancel
   </button>
  )}
  </div>
  </form>
  </div>
  )}
  </div>

   {/* LIST COLUMN */}
   <div className="col-span-1 lg:col-span-8">
   <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300">
   <div className="overflow-x-auto">
   {activeTab === 'users' ? (
   <table className="w-full text-left text-sm whitespace-nowrap">
   <thead>
   <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/20 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black text-xs">
  <th className="px-6 py-3">Name</th>
  <th className="px-6 py-3">Role</th>
  <th className="px-6 py-3 text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-white/20 dark:divide-white/10">
  {users.map(u => (
  <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
  <td className="px-6 py-4">
  <div className="font-bold text-slate-800 dark:text-white text-base">{u.full_name}</div>
  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{u.email}</div>
  </td>
  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{u.role}</td>
  <td className="px-6 py-4 text-right">
  <button onClick={() => editUser(u)} className="text-slate-400 hover:text-indigo-500 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl transition-all shadow-sm mr-2">
  <Edit2 className="w-4 h-4"/>
  </button>
  <button onClick={() => deleteUser(u)} className="text-slate-400 hover:text-rose-500 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl transition-all shadow-sm">
  <Trash2 className="w-4 h-4"/>
  </button>
  </td>
  </tr>
  ))}
  </tbody>
  </table>
  ) : (
  <table className="w-full text-left text-sm whitespace-nowrap">
  <thead>
  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/20 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black text-xs">
  <th className="px-6 py-3">Resource</th>
  <th className="px-6 py-3">Status</th>
  <th className="px-6 py-3 text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-white/20 dark:divide-white/10">
   {resources.map(r => (
   <tr key={r.id} className="hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
   <td className="px-6 py-4">
   <div className="font-bold text-slate-800 dark:text-white text-base">{r.name}</div>
   <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{r.type}</div>
   </td>
   <td className="px-6 py-4">
   <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${r.status === 'Active' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
   {r.status}
   </span>
   </td>
   <td className="px-6 py-4 text-right">
   <button onClick={() => editResource(r)} className="text-slate-400 hover:text-indigo-500 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl transition-all shadow-sm mr-2">
   <Edit2 className="w-4 h-4"/>
   </button>
   <button onClick={() => deleteResource(r)} className="text-slate-400 hover:text-rose-500 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl transition-all shadow-sm">
   <Trash2 className="w-4 h-4"/>
   </button>
   </td>
   </tr>
   ))}
   </tbody>
  </table>
  )}
  </div>
  </div>
  </div></div>

 <ConfirmModal
 isOpen={confirmUserModal.isOpen}
 title="Delete User"
 message={`Are you sure you want to delete user ${confirmUserModal.user?.full_name}?`}
 confirmText="Delete"
 onConfirm={confirmDeleteUser}
 onCancel={() => setConfirmUserModal({ isOpen: false, user: null })}
 />
 <ConfirmModal
 isOpen={confirmResourceModal.isOpen}
 title="Delete Resource"
 message={`Are you sure you want to delete resource ${confirmResourceModal.resource?.name}?`}
 confirmText="Delete"
 onConfirm={confirmDeleteResource}
 onCancel={() => setConfirmResourceModal({ isOpen: false, resource: null })}
 />
 </div>
 );
}
