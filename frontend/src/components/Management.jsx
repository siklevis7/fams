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
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
  <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
  <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400 dark:text-blue-400"/> Management Dashboard
  </h1>
  <div className="flex flex-wrap bg-slate-200 dark:bg-slate-700 p-1 rounded-lg w-full md:w-auto">
  <button 
  onClick={() => setActiveTab('users')}
  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 '}`}>
  Staff & Students
  </button>
  <button 
  onClick={() => setActiveTab('resources')}
  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'resources' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 '}`}>
  Fleet & Resources
  </button>
  </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  
  {/* FORM COLUMN */}
  <div className="col-span-1 lg:col-span-4 space-y-6">
  {activeTab === 'users' && (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
  <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{editingUserId ? 'Edit User' : 'Add New User'}</h2>
  <form onSubmit={handleUserSubmit} className="space-y-4">
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
  <input required type="text"value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2"/>
  </div>
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
  <input required type="email"value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2"/>
  </div>
  {!editingUserId && (
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Temporary Password</label>
  <input required type="text"value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2"/>
  </div>
  )}
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Role</label>
  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2">
  <option value="Administrator">Administrator</option>
  <option value="Operations Officer">Operations Officer</option>
  <option value="Instructor">Instructor</option>
  <option value="Student Pilot">Student Pilot</option>
  <option value="Examiner">Examiner</option>
  <option value="Maintenance Engineer">Maintenance Engineer</option>
  <option value="Finance Officer">Finance Officer</option>
  </select>
  </div>
  <div className="flex space-x-2 pt-2">
  <button type="submit"className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center">
  {editingUserId ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Update User</> : <><Plus className="w-4 h-4 mr-2"/> Create User</>}
  </button>
  {editingUserId && (
  <button type="button"onClick={() => { setEditingUserId(null); setUserForm({full_name: '', email: '', role: 'Student Pilot', password: ''}); }} className="px-4 py-2 bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 font-bold">
  Cancel
  </button>
  )}
  </div>
  </form>
  </div>
  )}

  {activeTab === 'resources' && (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
  <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{editingResourceId ? 'Edit Resource' : 'Add New Resource'}</h2>
  <form onSubmit={handleResourceSubmit} className="space-y-4">
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Registration / Name</label>
  <input required type="text"value={resourceForm.name} onChange={e => setResourceForm({...resourceForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2"/>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Type</label>
  <select value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2">
  <option value="Aircraft">Aircraft</option>
  <option value="Simulator">Simulator</option>
  <option value="Classroom">Classroom</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
  <select value={resourceForm.status} onChange={e => setResourceForm({...resourceForm, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2">
  <option value="Active">Active</option>
  <option value="Maintenance">Maintenance</option>
  </select>
  </div>
  </div>

  {resourceForm.type === 'Aircraft' && (
  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2 grid grid-cols-2 gap-2">
  <div className="col-span-2">
  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase">Mass & Balance Specs</p>
  </div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">BEW (kg)</label><input type="number"step="0.1"value={resourceForm.basic_empty_weight} onChange={e => setResourceForm({...resourceForm, basic_empty_weight: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">MTOW (kg)</label><input type="number"step="0.1"value={resourceForm.max_takeoff_weight} onChange={e => setResourceForm({...resourceForm, max_takeoff_weight: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Empty Moment</label><input type="number"step="0.1"value={resourceForm.empty_moment} onChange={e => setResourceForm({...resourceForm, empty_moment: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Front Seat Arm</label><input type="number"step="0.1"value={resourceForm.arm_front_seats} onChange={e => setResourceForm({...resourceForm, arm_front_seats: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Rear Seat Arm</label><input type="number"step="0.1"value={resourceForm.arm_rear_seats} onChange={e => setResourceForm({...resourceForm, arm_rear_seats: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Baggage Arm</label><input type="number"step="0.1"value={resourceForm.arm_baggage_1} onChange={e => setResourceForm({...resourceForm, arm_baggage_1: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  <div className="col-span-2"><label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Fuel Arm</label><input type="number"step="0.1"value={resourceForm.arm_fuel} onChange={e => setResourceForm({...resourceForm, arm_fuel: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-sm"/></div>
  </div>
  )}
  
  <div className="flex space-x-2 pt-2">
  <button type="submit"className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center">
  {editingResourceId ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Update Fleet</> : <><Plus className="w-4 h-4 mr-2"/> Add to Fleet</>}
  </button>
  {editingResourceId && (
  <button type="button"onClick={() => { setEditingResourceId(null); setResourceForm({name: '', type: 'Aircraft', status: 'Active', basic_empty_weight: 0, empty_moment: 0, max_takeoff_weight: 0, arm_front_seats: 0, arm_rear_seats: 0, arm_baggage_1: 0, arm_fuel: 0}); }} className="px-4 py-2 bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 font-bold">
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
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
  <div className="overflow-x-auto">
  {activeTab === 'users' ? (
  <table className="w-full text-left text-sm whitespace-nowrap">
  <thead>
  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
  <th className="px-6 py-3">Name</th>
  <th className="px-6 py-3">Role</th>
  <th className="px-6 py-3 text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
  {users.map(u => (
  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
  <td className="px-6 py-3">
  <div className="font-bold text-slate-800 dark:text-white">{u.full_name}</div>
  <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
  </td>
  <td className="px-6 py-3 font-medium text-blue-600 dark:text-blue-400">{u.role}</td>
  <td className="px-6 py-3 text-right">
  <button onClick={() => editUser(u)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3 p-1">
  <Edit2 className="w-4 h-4"/>
  </button>
  <button onClick={() => deleteUser(u)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
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
  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
  <th className="px-6 py-3">Resource</th>
  <th className="px-6 py-3">Status</th>
  <th className="px-6 py-3 text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
  {resources.map(r => (
  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
  <td className="px-6 py-3">
  <div className="font-bold text-slate-800 dark:text-white">{r.name}</div>
  <div className="text-xs text-slate-500 dark:text-slate-400">{r.type}</div>
  </td>
  <td className="px-6 py-3">
  <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 ' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
  {r.status}
  </span>
  </td>
  <td className="px-6 py-3 text-right">
  <button onClick={() => editResource(r)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3 p-1">
  <Edit2 className="w-4 h-4"/>
  </button>
  <button onClick={() => deleteResource(r)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
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
