import React, { useState, useEffect } from 'react';
import { Users, Plane, Plus, Trash2, Edit2, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem', opacity: 0.5 }} />
        <h2 className="text-heading" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p className="text-subheading">Only Administrators and Operations Officers can access the Management Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users style={{ color: 'var(--color-primary)' }}/> Management
        </h1>
        <div style={{ background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', 
              background: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            <Users size={16} /> Staff & Students
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', 
              background: activeTab === 'resources' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'resources' ? 'white' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            <Plane size={16} /> Fleet & Resources
          </button>
        </div>
      </div>

      <div className="grid-layout grid-layout-sidebar">
      
        {/* FORM COLUMN */}
        <div className="grid-col-form space-y-6">
          {activeTab === 'users' && (
            <div className="glass-card">
              <h2 className="text-subheading" style={{ margin: '0 0 1.5rem 0', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingUserId ? <Edit2 size={18} style={{ color: 'var(--color-primary)' }}/> : <Plus size={18} style={{ color: 'var(--color-primary)' }}/>}
                {editingUserId ? 'Edit User' : 'Add New User'}
              </h2>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="form-group mb-0">
                  <label className="form-label">Full Name</label>
                  <input required type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="input-field"/>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Email Address</label>
                  <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="input-field"/>
                </div>
                {!editingUserId && (
                  <div className="form-group mb-0">
                    <label className="form-label">Temporary Password</label>
                    <input required type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="input-field"/>
                  </div>
                )}
                <div className="form-group mb-0">
                  <label className="form-label">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="input-field">
                    <option value="Administrator">Administrator</option>
                    <option value="Operations Officer">Operations Officer</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Student Pilot">Student Pilot</option>
                    <option value="Examiner">Examiner</option>
                    <option value="Maintenance Engineer">Maintenance Engineer</option>
                    <option value="Finance Officer">Finance Officer</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingUserId ? <><CheckCircle2 size={18}/> Update</> : <><Plus size={18}/> Create</>}
                  </button>
                  {editingUserId && (
                    <button type="button" onClick={() => { setEditingUserId(null); setUserForm({full_name: '', email: '', role: 'Student Pilot', password: ''}); }} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="glass-card">
              <h2 className="text-subheading" style={{ margin: '0 0 1.5rem 0', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingResourceId ? <Edit2 size={18} style={{ color: 'var(--color-primary)' }}/> : <Plus size={18} style={{ color: 'var(--color-primary)' }}/>}
                {editingResourceId ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="form-group mb-0">
                  <label className="form-label">Registration / Name</label>
                  <input required type="text" value={resourceForm.name} onChange={e => setResourceForm({...resourceForm, name: e.target.value})} className="input-field"/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group mb-0">
                    <label className="form-label">Type</label>
                    <select value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value})} className="input-field">
                      <option value="Aircraft">Aircraft</option>
                      <option value="Simulator">Simulator</option>
                      <option value="Classroom">Classroom</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Status</label>
                    <select value={resourceForm.status} onChange={e => setResourceForm({...resourceForm, status: e.target.value})} className="input-field">
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {resourceForm.type === 'Aircraft' && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Mass & Balance Specs</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>BEW (kg)</label><input type="number" step="0.1" value={resourceForm.basic_empty_weight} onChange={e => setResourceForm({...resourceForm, basic_empty_weight: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>MTOW (kg)</label><input type="number" step="0.1" value={resourceForm.max_takeoff_weight} onChange={e => setResourceForm({...resourceForm, max_takeoff_weight: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Empty Moment</label><input type="number" step="0.1" value={resourceForm.empty_moment} onChange={e => setResourceForm({...resourceForm, empty_moment: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Front Seat Arm</label><input type="number" step="0.1" value={resourceForm.arm_front_seats} onChange={e => setResourceForm({...resourceForm, arm_front_seats: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Rear Seat Arm</label><input type="number" step="0.1" value={resourceForm.arm_rear_seats} onChange={e => setResourceForm({...resourceForm, arm_rear_seats: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Baggage Arm</label><input type="number" step="0.1" value={resourceForm.arm_baggage_1} onChange={e => setResourceForm({...resourceForm, arm_baggage_1: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                      <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fuel Arm</label><input type="number" step="0.1" value={resourceForm.arm_fuel} onChange={e => setResourceForm({...resourceForm, arm_fuel: parseFloat(e.target.value)})} className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }}/></div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingResourceId ? <><CheckCircle2 size={18}/> Update</> : <><Plus size={18}/> Add</>}
                  </button>
                  {editingResourceId && (
                    <button type="button" onClick={() => { setEditingResourceId(null); setResourceForm({name: '', type: 'Aircraft', status: 'Active', basic_empty_weight: 0, empty_moment: 0, max_takeoff_weight: 0, arm_front_seats: 0, arm_rear_seats: 0, arm_baggage_1: 0, arm_fuel: 0}); }} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* LIST COLUMN */}
        <div className="grid-col-list">
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h2 className="text-subheading" style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>
                {activeTab === 'users' ? 'Staff Directory' : 'Resource Inventory'}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'users' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Role</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: i === users.length - 1 ? 'none' : '1px solid var(--border-light)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'var(--bg-card-hover)' } }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.875rem' }}>{u.role}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => editUser(u)} className="icon-btn" style={{ display: 'inline-flex', color: 'var(--color-primary)', marginRight: '0.25rem' }}>
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={() => deleteUser(u)} className="icon-btn" style={{ display: 'inline-flex', color: 'var(--color-danger)' }}>
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Resource</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: i === resources.length - 1 ? 'none' : '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{r.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{r.type}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            background: r.status === 'Active' ? 'var(--color-success-bg)' : 'rgba(244, 63, 94, 0.1)', 
                            color: r.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)', 
                            padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' 
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => editResource(r)} className="icon-btn" style={{ display: 'inline-flex', color: 'var(--color-primary)', marginRight: '0.25rem' }}>
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={() => deleteResource(r)} className="icon-btn" style={{ display: 'inline-flex', color: 'var(--color-danger)' }}>
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

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
