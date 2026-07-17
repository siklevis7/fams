import React, { useState, useEffect } from 'react';
import { FileText, Plus, AlertCircle, CheckCircle, ShieldCheck, Clock, Download, PenTool, FileSignature, X } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { API_BASE } from '../config';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

const Documents = ({ token, user }) => {
 const [documents, setDocuments] = useState([]);
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showAddModal, setShowAddModal] = useState(false);
 const [confirmModal, setConfirmModal] = useState({ isOpen: false, doc: null });
 const [formData, setFormData] = useState({
 user_id: user.id,
 title: '',
 document_type: 'License',
 issued_at: format(new Date(),"yyyy-MM-dd'T'HH:mm"),
 expires_at: '',
 requires_signature: false
 });
 
 const canManage = ["Administrator","Operations Officer"].includes(user.role);

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [docsRes, usersRes] = await Promise.all([
 fetch(`${API_BASE}/api/documents/`, {
 headers: { 'Authorization': `Bearer ${token}` }
 }),
 fetch(`${API_BASE}/api/users/`, {
 headers: { 'Authorization': `Bearer ${token}` }
 })
 ]);
 if (docsRes.ok) setDocuments(await docsRes.json());
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
 expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
 issued_at: formData.issued_at ? new Date(formData.issued_at).toISOString() : null
 };

  const res = await fetch(`${API_BASE}/api/documents/`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 setShowAddModal(false);
 toast.success("Document added successfully");
 fetchData();
 } else {
 toast.error("Failed to add document");
 }
 } catch (err) {
 console.error(err);
 }
 };

  const confirmSignDocument = async () => {
    const doc = confirmModal.doc;
    if (!doc) return;
    
    try {
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${user.id}-${doc.id}-${Date.now()}`)))
      ).map(b => b.toString(16).padStart(2, '0')).join('');

      const res = await fetch(`${API_BASE}/api/documents/${doc.id}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ signature_hash: hash })
      });

      if (res.ok) {
        toast.success("Document signed successfully");
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to sign document");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setConfirmModal({ isOpen: false, doc: null });
    }
  };

  const signDocument = (doc) => {
    setConfirmModal({ isOpen: true, doc });
  };

 const getUserName = (id) => {
 return users.find(u => u.id === id)?.full_name || 'Unknown User';
 };

 const getDocStatus = (doc) => {
 if (doc.requires_signature && !doc.is_signed) return { label: 'Signature Required', color: 'badge-warning' };
  if (doc.expires_at) {
  const expiry = new Date(doc.expires_at);
  const now = new Date();
  if (isBefore(expiry, now)) return { label: 'Expired', color: 'badge-danger' };
  if (isBefore(expiry, addDays(now, 30))) return { label: 'Expiring Soon', color: 'badge-warning' };
  }
 return { label: 'Valid', color: 'badge-success' };
 };

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading documents...</p>
    </div>
  );

 return (
  <div className="page-container space-y-6">
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
  {canManage && (
  <button 
  onClick={() => setShowAddModal(true)}
  className="btn btn-primary"
  >
  <Plus size={20} style={{ marginRight: '0.5rem' }}/>
  Add Document
  </button>
  )}
  </div>

  <div className="data-table-container glass-card" style={{ padding: 0, overflow: 'hidden' }}>
  <div style={{ overflowX: 'auto' }}>
  <table className="data-table">
  <thead>
  <tr>
  <th className="data-th">Document</th>
  <th className="data-th">User</th>
  <th className="data-th">Status</th>
  <th className="data-th">Expiry</th>
  <th className="data-th">E-Signature</th>
  <th className="data-th data-th-right">Actions</th>
  </tr>
  </thead>
 <tbody>
 {documents.length === 0 ? (
 <tr><td colSpan="6" className="data-td" style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>No documents found.</td></tr>
 ) : documents.map((doc) => {
 const status = getDocStatus(doc);
 return (
 <tr key={doc.id} className="data-tr">
 <td className="data-td">
 <div style={{ display: 'flex', alignItems: 'center' }}>
 <FileText size={24} style={{ color: 'var(--color-primary)', marginRight: '1rem' }}/>
 <div>
 <p className="data-title">{doc.title}</p>
 <p className="data-subtitle">{doc.document_type}</p>
 </div>
 </div>
 </td>
 <td className="data-td" style={{ fontWeight: '700', color: 'var(--text-main)' }}>{getUserName(doc.user_id)}</td>
 <td className="data-td">
 <span className={`badge ${status.color}`}>
 {status.label}
 </span>
 </td>
 <td className="data-td" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
 {doc.expires_at ? format(parseISO(doc.expires_at), 'dd MMM yyyy') : 'N/A'}
 </td>
 <td className="data-td">
 {doc.requires_signature ? (
 doc.is_signed ? (
 <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-success)' }}>
 <ShieldCheck size={16} style={{ marginRight: '0.5rem' }}/>
 <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.1em' }}>{doc.signature_hash}</span>
 </div>
 ) : (
 <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}>
 <AlertCircle size={16} style={{ marginRight: '0.5rem' }}/> Pending
 </span>
 )
 ) : (
 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '900' }}>-</span>
 )}
 </td>
 <td className="data-td data-th-right">
 {doc.requires_signature && !doc.is_signed && doc.user_id === user.id && (
 <button 
 onClick={() => signDocument(doc)}
 className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
 >
 <PenTool size={16} style={{ marginRight: '0.5rem' }}/> Sign Now
 </button>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {showAddModal && (
  <div className="modal-overlay">
  <div className="modal-content glass-card" style={{ padding: 0, overflow: 'hidden' }}>
  <div className="modal-header-primary" style={{ background: 'var(--color-primary)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Add Compliance Document</h2>
  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Upload a record or certificate to the registry.</p>
  </div>
  <button onClick={() => setShowAddModal(false)} className="icon-btn" style={{ color: 'white' }}>
    <X size={20} />
  </button>
  </div>
 <form onSubmit={handleAddSubmit} className="modal-body space-y-4" style={{ padding: '1.5rem' }}>
 <div className="form-group mb-0">
 <label className="form-label">User / Staff Member</label>
 <select 
 className="input-field"
 value={formData.user_id}
 onChange={e => setFormData({...formData, user_id: parseInt(e.target.value)})}
 required
 >
 <option value="">Select User</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
 </select>
 </div>
 
 <div className="form-group mb-0">
 <label className="form-label">Document Title</label>
 <input 
 type="text"
 required
 placeholder="e.g. Class 1 Medical"
 className="input-field"
 value={formData.title}
 onChange={e => setFormData({...formData, title: e.target.value})}
 />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
 <div className="form-group mb-0">
 <label className="form-label">Type</label>
 <select 
 className="input-field"
 value={formData.document_type}
 onChange={e => setFormData({...formData, document_type: e.target.value})}
 >
 <option value="License">License</option>
 <option value="Medical">Medical</option>
 <option value="Certificate">Certificate</option>
 <option value="Company Policy">Company Policy</option>
 <option value="Training Record">Training Record</option>
 </select>
 </div>
 <div className="form-group mb-0">
 <label className="form-label">Expiry Date (Optional)</label>
 <input 
 type="date"
 className="input-field"
 value={formData.expires_at}
 onChange={e => setFormData({...formData, expires_at: e.target.value})}
 />
 </div>
 </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
  <input 
  type="checkbox"
  id="req_sig"
  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
  checked={formData.requires_signature}
  onChange={e => setFormData({...formData, requires_signature: e.target.checked})}
  />
 <label htmlFor="req_sig" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
 Requires Electronic Signature?
 </label>
 </div>
 
  <div className="mb-limit-alert success" style={{ padding: '0.75rem 1rem', marginTop: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
  <ShieldCheck size={16} style={{ color: 'var(--color-primary)', marginRight: '0.5rem', flexShrink: 0 }}/>
  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
  Document will be archived for 5 years after expiry automatically to satisfy RCAA retention limits.
  </span>
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
 <button 
 type="button"
 onClick={() => setShowAddModal(false)}
 className="btn btn-secondary"
 >
 Cancel
 </button>
  <button 
  type="submit"
  className="btn btn-primary"
  >
  Add Document
  </button>
 </div>
 </form>
 </div>
 </div>
 )}

 <ConfirmModal
   isOpen={confirmModal.isOpen}
   title="Sign Document"
   message="By clicking Confirm, you are cryptographically signing this document. This action is legally binding."
   confirmText="Sign"
   onConfirm={confirmSignDocument}
   onCancel={() => setConfirmModal({ isOpen: false, doc: null })}
 />
 </div>
 );
};

export default Documents;
