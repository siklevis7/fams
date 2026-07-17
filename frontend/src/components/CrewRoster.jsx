import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, UserPlus, Clock, ShieldAlert, CheckCircle2, UserCircle, Briefcase, Plus, X } from 'lucide-react';
import { API_BASE } from '../config';

import { Toaster, toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

export default function CrewRoster({ token, user }) {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [duties, setDuties] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState('');
  const [dutyInputs, setDutyInputs] = useState({
    duty_type: 'Standby',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, dutyId: null });

  const fetchData = async () => {
    try {
      const [uRes, bRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/duties/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.filter(u => ['Instructor', 'Examiner', 'Operations Officer', 'Maintenance Engineer'].includes(u.role)));
      }
      if (bRes.ok) {
        setBookings(await bRes.json());
      }
      if (dRes.ok) {
        setDuties(await dRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Utility to generate the 7 days of the currently viewed week
  const getDaysInWeek = () => {
    const days = [];
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start on Monday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getEventsForUserAndDay = (userId, dateObj) => {
    const targetDateStr = dateObj.toISOString().split('T')[0];
    
    // Filter bookings where user is instructor (or student)
    const userBookings = bookings.filter(b => 
      (b.instructor_id === userId || b.student_id === userId) && 
      b.start_time.startsWith(targetDateStr)
    ).map(b => ({
      id: `b-${b.id}`,
      title: `Flight: ${b.resource?.name}`,
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      type: 'flight',
      status: b.status
    }));

    // Filter duties
    const userDuties = duties.filter(d => 
      d.user_id === userId && 
      d.start_time.startsWith(targetDateStr)
    ).map(d => ({
      id: `d-${d.id}`,
      title: d.duty_type,
      start: new Date(d.start_time),
      end: new Date(d.end_time),
      type: 'duty',
      rawDutyType: d.duty_type
    }));

    // Sort combined events chronologically
    return [...userBookings, ...userDuties].sort((a, b) => a.start - b.start);
  };

  const saveDuty = async () => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/duties/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(modalUserId),
          duty_type: dutyInputs.duty_type,
          start_time: new Date(dutyInputs.start_time).toISOString(),
          end_time: new Date(dutyInputs.end_time).toISOString(),
          notes: dutyInputs.notes
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        toast.success('Duty assigned successfully');
        fetchData();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Failed to assign duty');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  const confirmDeleteDuty = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/duties/${confirmModal.dutyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Duty removed');
        fetchData();
      } else {
        toast.error('Failed to remove duty');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setConfirmModal({ isOpen: false, dutyId: null });
    }
  };

  const days = getDaysInWeek();

  // Color mapping
  const getEventClass = (event) => {
    if (event.type === 'flight') return 'roster-event-flight';
    if (event.rawDutyType === 'Standby') return 'roster-event-standby';
    if (event.rawDutyType === 'Leave' || event.rawDutyType === 'Day Off') return 'roster-event-off';
    return 'roster-event-ground'; // Ground Training
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon style={{ color: 'var(--color-primary)' }}/> Crew Roster
        </h1>
        {(user.role === 'Administrator' || user.role === 'Operations Officer') && (
          <button 
            onClick={() => {
              setDutyInputs({ duty_type: 'Standby', start_time: '', end_time: '', notes: '' });
              setModalUserId(users[0]?.id || '');
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <UserPlus size={18} /> Assign Duty
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)' }}>
          <button 
            onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 7); setViewDate(d); }}
            className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            &larr; Previous Week
          </button>
          <h2 className="text-subheading" style={{ margin: 0, fontWeight: '800' }}>
            Week of {days[0].toLocaleDateString()}
          </h2>
          <button 
            onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 7); setViewDate(d); }}
            className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            Next Week &rarr;
          </button>
        </div>

        <div className="roster-table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
          <table className="roster-table">
            <thead>
              <tr style={{ background: 'var(--bg-card-hover)' }}>
                <th className="roster-th roster-th-fixed" style={{ borderBottom: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-light)' }}>Crew Member</th>
                {days.map(d => (
                  <th key={d.toISOString()} className="roster-th" style={{ borderBottom: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-light)', textAlign: 'center' }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="roster-tr">
                  <td className="roster-td-fixed" style={{ borderBottom: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)' }}>
                    <div className="roster-user-info">
                      <UserCircle className="roster-user-icon" style={{ color: 'var(--color-primary)' }}/>
                      <div>
                        <p className="roster-user-name" style={{ color: 'var(--text-main)', fontWeight: '700' }}>{u.full_name}</p>
                        <p className="roster-user-role" style={{ color: 'var(--text-muted)' }}>{u.role}</p>
                        {u.medical_expiry && (
                          <p className={`roster-user-med ${new Date(u.medical_expiry) < new Date() ? 'roster-med-exp' : 'roster-med-ok'}`}>
                            Med Exp: {new Date(u.medical_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {days.map(d => {
                    const events = getEventsForUserAndDay(u.id, d);
                    return (
                      <td key={d.toISOString()} className="roster-td-cell" style={{ borderBottom: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', verticalAlign: 'top', padding: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {events.length === 0 ? (
                            <div className="roster-clear" style={{ color: 'var(--text-muted)', opacity: 0.5, fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>Clear</div>
                          ) : (
                            events.map(ev => (
                              <div 
                                key={ev.id} 
                                className={`roster-event ${getEventClass(ev)}`}
                                style={{ borderRadius: 'var(--radius-sm)', padding: '0.5rem', fontSize: '0.75rem', boxShadow: 'var(--shadow-sm)' }}
                              >
                                <div className="roster-event-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                  <span className="roster-event-title" style={{ fontWeight: '700', lineHeight: 1.2 }}>{ev.title}</span>
                                  {ev.type === 'duty' && (user.role === 'Administrator' || user.role === 'Operations Officer') && (
                                    <button onClick={() => setConfirmModal({ isOpen: true, dutyId: ev.id.replace('d-', '') })} className="roster-event-delete" style={{ opacity: 0.5 }}>
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                                <div className="roster-event-time" style={{ display: 'flex', alignItems: 'center', opacity: 0.8, fontWeight: '600' }}>
                                  <Clock size={12} style={{marginRight: '0.25rem'}}/>
                                  {ev.start.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})} - {ev.end.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duty Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-heading" style={{ margin: 0, fontSize: '1.5rem' }}>
                <Briefcase size={24} style={{display: 'inline', marginRight: '0.5rem', color: 'var(--color-primary)'}}/> Assign Duty
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn"><X size={24}/></button>
            </div>
            
            <div className="modal-body space-y-4">
              {errorMsg && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                  <ShieldAlert size={20} style={{ flexShrink: 0 }}/>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-group mb-0">
                <label className="form-label">Staff Member</label>
                <select 
                  className="input-field"
                  value={modalUserId}
                  onChange={e => setModalUserId(e.target.value)}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Duty Type</label>
                <select 
                  className="input-field"
                  value={dutyInputs.duty_type}
                  onChange={e => setDutyInputs({...dutyInputs, duty_type: e.target.value})}
                >
                  <option value="Standby">Standby (Reserve)</option>
                  <option value="Ground Training">Ground Training</option>
                  <option value="Leave">Annual Leave</option>
                  <option value="Day Off">Day Off</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group mb-0">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="datetime-local"
                    lang="en-GB"
                    className="input-field"
                    value={dutyInputs.start_time}
                    onChange={e => setDutyInputs({...dutyInputs, start_time: e.target.value})}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">End Time</label>
                  <input 
                    type="datetime-local"
                    lang="en-GB"
                    className="input-field"
                    value={dutyInputs.end_time}
                    onChange={e => setDutyInputs({...dutyInputs, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Notes (Optional)</label>
                <input 
                  type="text"
                  className="input-field"
                  value={dutyInputs.notes}
                  onChange={e => setDutyInputs({...dutyInputs, notes: e.target.value})}
                  placeholder="e.g. Airport Standby, Recurrent SEP"
                />
              </div>

              <button 
                onClick={saveDuty}
                className="btn btn-primary w-full"
                style={{ padding: '1rem', fontSize: '1rem' }}
              >
                <CheckCircle2 size={20} /> Confirm Duty Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Remove Duty"
        message="Are you sure you want to remove this duty assignment? This action cannot be undone."
        confirmText="Remove"
        onConfirm={confirmDeleteDuty}
        onCancel={() => setConfirmModal({ isOpen: false, dutyId: null })}
      />
    </div>
  );
}
