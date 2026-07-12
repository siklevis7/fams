import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plane, AlertTriangle, Loader2, CheckCircle, FileText } from 'lucide-react';
import { API_BASE } from '../config';

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

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Post-Flight Tech Log</h1>
          <p className="text-slate-500 font-medium mt-1">Log actual flight times, Hobbs, and Tach meters.</p>
        </div>
      </div>

      {!selectedBooking ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.length === 0 ? (
            <div className="col-span-full liquid-glass p-8 rounded-3xl text-center border border-white/20">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">You're all caught up!</h3>
              <p className="text-slate-500">You have no scheduled flights waiting for post-flight logs.</p>
            </div>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="liquid-glass p-6 rounded-3xl border border-white/20 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => openLogForm(b)}>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg uppercase tracking-wider">
                    {b.resource?.name || 'Flight'}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">
                    {format(parseISO(b.start_time), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                  {format(parseISO(b.start_time), 'HH:mm')} - {format(parseISO(b.end_time), 'HH:mm')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-6">
                  {user.id === b.instructor_id ? `Student: ${b.student?.full_name || 'Solo'}` : `Instructor: ${b.instructor?.full_name || 'Solo'}`}
                </p>
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                  Submit Tech Log
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="liquid-glass p-8 rounded-3xl max-w-2xl mx-auto border border-white/20">
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-white/10 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tech Log: {selectedBooking.resource?.name}</h2>
              <p className="text-slate-500 mt-1">Scheduled: {format(parseISO(selectedBooking.start_time), 'HH:mm')} - {format(parseISO(selectedBooking.end_time), 'HH:mm')}</p>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600 transition-colors px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 shrink-0"/>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 shrink-0"/>
                Tech log submitted successfully! Returning...
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actual Block Off</label>
                <input 
                  type="time" 
                  value={formData.actual_start_time}
                  onChange={e => setFormData({...formData, actual_start_time: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actual Block On</label>
                <input 
                  type="time" 
                  value={formData.actual_end_time}
                  onChange={e => setFormData({...formData, actual_end_time: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hobbs Start</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_hobbs_start}
                  onChange={e => setFormData({...formData, actual_hobbs_start: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hobbs End</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_hobbs_end}
                  onChange={e => setFormData({...formData, actual_hobbs_end: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tach Start</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_tach_start}
                  onChange={e => setFormData({...formData, actual_tach_start: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tach End</label>
                <input 
                  type="number" step="0.1" 
                  value={formData.actual_tach_end}
                  onChange={e => setFormData({...formData, actual_tach_end: e.target.value})}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Squawks</label>
              <textarea
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                placeholder="Any issues or flight remarks..."
              ></textarea>
            </div>

            <button type="submit" disabled={submitting || submitSuccess} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
              {submitting ? <Loader2 className="w-5 h-5 mx-auto animate-spin"/> : 'Sign & Submit Tech Log'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TechLog;
