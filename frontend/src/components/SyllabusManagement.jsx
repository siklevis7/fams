import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

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
      } else {
        alert("Failed to save syllabus entry");
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Form Panel */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-6 rounded-3xl shadow-xl">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {isEditing ? 'Edit Syllabus Sortie' : 'Add New Sortie'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Code</label>
            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g. E-1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name / Phase</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g. FIRST SOLO FLIGHT PHASE" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="DUAL">Dual</option>
                <option value="SOLO">Solo</option>
                <option value="SIMULATOR">Simulator</option>
                <option value="GROUND">Ground</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Req. Hours</label>
            <input type="number" step="0.1" required value={formData.required_hours} onChange={e => setFormData({...formData, required_hours: parseFloat(e.target.value)})} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Order Index</label>
            <input type="number" required value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="md:col-span-6 flex justify-end space-x-3 mt-2">
            {isEditing && (
                <button type="button" onClick={handleCancel} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                </button>
            )}
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                {isEditing ? 'Update Sortie' : 'Add Sortie'}
            </button>
          </div>
        </form>
      </div>

      {/* List Panel */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Training Syllabus Sequence</h3>
            <span className="px-3 py-1 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 rounded-full text-xs font-bold">
                {sorties.length} SORTIES
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Ord.</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Code</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Name / Phase</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Category</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Req. Hours</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading syllabus...</td></tr>
                ) : sorties.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-500">No syllabus sorties found. Add one above.</td></tr>
                ) : sorties.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-slate-500 font-mono">{s.order_index}</td>
                        <td className="p-4 text-slate-800 dark:text-white font-bold">{s.code}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{s.name}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-md
                                ${s.category === 'SOLO' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                                s.category === 'DUAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                {s.category}
                            </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{s.required_hours}h</td>
                        <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleEdit(s)} className="text-sky-500 hover:text-sky-600 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
