import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { Edit2, Trash2, BookOpen, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SyllabusManagement({ token }) {
  const [sorties, setSorties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'DUAL',
    required_hours: 1.0,
    order_index: 0
  });

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/syllabus/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSorties(data);
        if (data.length > 0) {
            setFormData(prev => ({...prev, order_index: data[data.length-1].order_index + 1}));
        } else {
            setFormData(prev => ({...prev, order_index: 1}));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sortie) => {
    setFormData(sortie);
    setEditingId(sortie.id);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      category: 'DUAL',
      required_hours: 1.0,
      order_index: sorties.length > 0 ? sorties[sorties.length-1].order_index + 1 : 1
    });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
        ? `${API_BASE}/api/syllabus/${editingId}`
        : `${API_BASE}/api/syllabus/`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchSyllabus();
        handleCancel();
        toast.success(isEditing ? "Sortie updated" : "Sortie added");
      } else {
        toast.error("Failed to save syllabus entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this syllabus phase?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/syllabus/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSyllabus();
        toast.success("Sortie deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container space-y-6">
      
      {/* Form Panel */}
      <div className="glass-card">
        <h3 className="form-title" style={{ display: 'flex', alignItems: 'center' }}>
            <BookOpen size={24} style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }}/>
            {isEditing ? 'Edit Syllabus Sortie' : 'Add New Sortie'}
        </h3>
        <form onSubmit={handleSubmit} className="grid-cols-2" style={{ gap: '1rem' }}>
          <div className="form-group mb-0">
            <label className="form-label">Code</label>
            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="input-field" placeholder="e.g. E-1" />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Name / Phase</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. FIRST SOLO FLIGHT PHASE" />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                <option value="DUAL">Dual</option>
                <option value="SOLO">Solo</option>
                <option value="SIMULATOR">Simulator</option>
                <option value="GROUND">Ground</option>
            </select>
          </div>
          <div className="form-group mb-0" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Req. Hours</label>
              <input type="number" step="0.1" required value={formData.required_hours} onChange={e => setFormData({...formData, required_hours: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="form-label">Order Index</label>
              <input type="number" required value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})} className="input-field" />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            {isEditing && (
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                    Cancel
                </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                {isEditing ? <><CheckCircle2 size={20} style={{ marginRight: '0.5rem' }}/> Update Sortie</> : <><Plus size={20} style={{ marginRight: '0.5rem' }}/> Add Sortie</>}
            </button>
          </div>
        </form>
      </div>

      {/* List Panel */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="form-title" style={{ margin: 0 }}>Training Syllabus Sequence</h3>
            <span className="badge badge-success" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)' }}>
                {sorties.length} SORTIES
            </span>
        </div>
        
        <table className="data-table">
        <thead>
            <tr>
                <th className="data-th">Ord.</th>
                <th className="data-th">Code</th>
                <th className="data-th">Name / Phase</th>
                <th className="data-th">Category</th>
                <th className="data-th">Req. Hours</th>
                <th className="data-th data-th-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            {loading ? (
                <tr><td colSpan="6" className="data-td" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading syllabus...</td></tr>
            ) : sorties.length === 0 ? (
                <tr><td colSpan="6" className="data-td" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No syllabus sorties found. Add one above.</td></tr>
            ) : sorties.map(s => (
                <tr key={s.id} className="data-tr">
                    <td className="data-td" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.order_index}</td>
                    <td className="data-td data-title">{s.code}</td>
                    <td className="data-td data-subtitle">{s.name}</td>
                    <td className="data-td">
                        <span className="badge" style={{
                            background: s.category === 'SOLO' ? 'var(--color-warning-bg)' : 
                                        s.category === 'DUAL' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                            color: s.category === 'SOLO' ? '#b45309' : 
                                   s.category === 'DUAL' ? 'var(--color-primary)' : '#a855f7'
                        }}>
                            {s.category}
                        </span>
                    </td>
                    <td className="data-td" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{s.required_hours}h</td>
                    <td className="data-td data-th-right">
                        <button onClick={() => handleEdit(s)} className="icon-btn mr-2" style={{ color: 'var(--color-primary)' }}><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(s.id)} className="icon-btn" style={{ color: 'var(--color-danger)' }}><Trash2 size={16}/></button>
                    </td>
                </tr>
            ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
