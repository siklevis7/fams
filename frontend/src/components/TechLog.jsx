import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plane, AlertTriangle, Loader2, CheckCircle, FileText, ArrowLeft, Clock } from 'lucide-react';
import { API_BASE } from '../config';
import { toast } from 'sonner';

const TechLog = ({ token, user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    actual_start_time: '',
    actual_end_time: '',
    actual_hobbs_start: '',
    actual_hobbs_end: '',
    actual_tach_start: '',
    actual_tach_end: '',
    remarks: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [token, user]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to only bookings for this user that are Scheduled or Active
        const myFlights = data.filter(b => 
          (b.instructor_id === user.id || b.student_id === user.id) &&
          b.status === 'Scheduled'
        );
        setBookings(myFlights.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openLogForm = (booking) => {
    setSelectedBooking(booking);
    setSubmitError('');
    setSubmitSuccess(false);
    
    // Auto-fill defaults
    const today = format(new Date(), 'yyyy-MM-dd');
    setFormData({
      actual_start_time: format(parseISO(booking.start_time), 'HH:mm'),
      actual_end_time: format(parseISO(booking.end_time), 'HH:mm'),
      actual_hobbs_start: '0.0', // In reality, fetch from aircraft's last log
      actual_hobbs_end: '0.0',
      actual_tach_start: '0.0',
      actual_tach_end: '0.0',
      remarks: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startIso = parseISO(`${today}T${formData.actual_start_time}`);
      const endIso = parseISO(`${today}T${formData.actual_end_time}`);

      const payload = {
        actual_start_time: startIso.toISOString(),
        actual_end_time: endIso.toISOString(),
        actual_hobbs_start: parseFloat(formData.actual_hobbs_start) || 0,
        actual_hobbs_end: parseFloat(formData.actual_hobbs_end) || 0,
        actual_tach_start: parseFloat(formData.actual_tach_start) || 0,
        actual_tach_end: parseFloat(formData.actual_tach_end) || 0,
        remarks: formData.remarks
      };

      const res = await fetch(`${API_BASE}/api/bookings/${selectedBooking.id}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitSuccess(true);
        toast.success("Tech log submitted successfully!");
        setTimeout(() => {
          setSelectedBooking(null);
          fetchBookings();
        }, 1500);
      } else {
        const data = await res.json();
        setSubmitError(data.detail || 'Failed to submit tech log.');
      }
    } catch (err) {
      setSubmitError('Network error while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-primary)' }} /></div>;

  return (
    <div className="page-container space-y-6">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="progress-title" style={{ fontSize: '2rem' }}>Post-Flight Tech Log</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '0.25rem' }}>Log actual flight times, Hobbs, and Tach meters.</p>
      </div>

      {!selectedBooking ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {bookings.length === 0 ? (
            <div className="empty-state glass-card" style={{ gridColumn: '1 / -1' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
              <h3 className="form-title" style={{ fontSize: '1.25rem' }}>You're all caught up!</h3>
              <p style={{ color: 'var(--text-muted)' }}>You have no scheduled flights waiting for post-flight logs.</p>
            </div>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="glass-card hover-lift" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => openLogForm(b)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="badge badge-primary">
                    {b.resource?.name || 'Flight'}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {format(parseISO(b.start_time), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="form-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  {format(parseISO(b.start_time), 'HH:mm')} - {format(parseISO(b.end_time), 'HH:mm')}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '1.5rem', flex: 1 }}>
                  {user.id === b.instructor_id ? `Student: ${b.student?.full_name || 'Solo'}` : `Instructor: ${b.instructor?.full_name || 'Solo'}`}
                </p>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <FileText size={16} style={{ marginRight: '0.5rem' }}/> Submit Tech Log
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="glass-card mx-auto" style={{ maxWidth: '42rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
            <div>
              <h2 className="form-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tech Log: {selectedBooking.resource?.name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>Scheduled: {format(parseISO(selectedBooking.start_time), 'HH:mm')} - {format(parseISO(selectedBooking.end_time), 'HH:mm')}</p>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="btn btn-secondary">
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }}/> Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="mb-limit-alert danger" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }}/>
                <span style={{ color: 'var(--color-danger)', fontWeight: '500' }}>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-limit-alert success" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--color-success)' }}/>
                <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>Tech log submitted successfully! Returning...</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group mb-0">
                <label className="form-label">Actual Block Off</label>
                <input 
                  type="time" 
                  value={formData.actual_start_time}
                  onChange={e => setFormData({...formData, actual_start_time: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Actual Block On</label>
                <input 
                  type="time" 
                  value={formData.actual_end_time}
                  onChange={e => setFormData({...formData, actual_end_time: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group mb-0">
                <label className="form-label">Hobbs Start</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_hobbs_start}
                  onChange={e => setFormData({...formData, actual_hobbs_start: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Hobbs End</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_hobbs_end}
                  onChange={e => setFormData({...formData, actual_hobbs_end: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group mb-0">
                <label className="form-label">Tach Start</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_tach_start}
                  onChange={e => setFormData({...formData, actual_tach_start: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Tach End</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_tach_end}
                  onChange={e => setFormData({...formData, actual_tach_end: e.target.value})}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Remarks / Squawks</label>
              <textarea
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                className="input-field"
                style={{ minHeight: '6rem', resize: 'vertical' }}
                placeholder="Any issues or flight remarks..."
              ></textarea>
            </div>

            <button type="submit" disabled={submitting || submitSuccess} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'var(--color-success)', color: 'white', justifyContent: 'center' }}>
              {submitting ? <Loader2 size={20} className="animate-spin mr-2"/> : <><FileText size={20} style={{ marginRight: '0.5rem' }}/> Sign & Submit Tech Log</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TechLog;
