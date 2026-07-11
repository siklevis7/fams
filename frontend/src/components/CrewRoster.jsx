import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, UserPlus, Clock, ShieldAlert, CheckCircle2, UserCircle, Briefcase, Plus } from 'lucide-react';
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
  const getColor = (event) => {
  if (event.type === 'flight') return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/60';
  if (event.rawDutyType === 'Standby') return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/60';
    if (event.rawDutyType === 'Leave' || event.rawDutyType === 'Day Off') return 'bg-red-50 text-red-700 dark:text-red-400 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60';
    return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60'; // Ground Training
  };

 return (
 <div className="pb-20">
 <div className="col-span-12 liquid-glass p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-8">
 <div className="relative z-10">
 <h1 className="text-4xl font-black tracking-tighter text-gradient mb-2 flex items-center">
 <CalendarIcon className="w-8 h-8 mr-3 text-indigo-500"/> Crew Roster & Duty Tracking
 </h1>
 <p className="text-slate-500 dark:text-slate-400 font-medium">Manage staff assignments, standby shifts, and rest periods to comply with FTL.</p>
 </div>
 <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
 {(user.role === 'Administrator' || user.role === 'Operations Officer') && (
 <button 
 onClick={() => {
 setDutyInputs({ duty_type: 'Standby', start_time: '', end_time: '', notes: '' });
 setModalUserId(users[0]?.id || '');
 setErrorMsg('');
 setIsModalOpen(true);
 }}
  className="w-full md:w-auto mt-6 md:mt-0 px-6 py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/30 backdrop-blur-md relative z-10"
  >
  <UserPlus className="w-5 h-5 mr-2"/> Assign Duty
 </button>
 )}
 </div>

  <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300">
  <div className="flex flex-col md:flex-row justify-between items-center bg-white/40 dark:bg-black/20 p-6 border-b border-white/20 dark:border-white/10 backdrop-blur-md space-y-4 md:space-y-0">
  <button 
 onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 7); setViewDate(d); }}
 className="w-full md:w-auto text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-6 py-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
 >
 &larr; Previous Week
 </button>
 <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
 Week of {days[0].toLocaleDateString()}
 </h2>
 <button 
 onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 7); setViewDate(d); }}
 className="w-full md:w-auto text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-6 py-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
 >
 Next Week &rarr;
 </button>
  </div>

  <div className="overflow-x-auto pb-4">
  <table className="w-full text-left border-collapse min-w-[1000px]">
 <thead>
 <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/20 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-black">
 <th className="p-4 w-64 border-r border-white/20 dark:border-white/10 sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">Crew Member</th>
 {days.map(d => (
 <th key={d.toISOString()} className="p-4 text-center min-w-[160px] border-r border-white/20 dark:border-white/10 last:border-0">
 {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-white/20 dark:divide-white/10">
 {users.map(u => (
 <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
 <td className="p-4 border-r border-white/20 dark:border-white/10 sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
 <div className="flex items-center">
 <UserCircle className="w-8 h-8 text-indigo-400 mr-3"/>
 <div>
 <p className="font-bold text-slate-800 dark:text-white text-base">{u.full_name}</p>
 <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{u.role}</p>
 {u.medical_expiry && (
 <p className={`text-[10px] mt-1 font-black tracking-widest uppercase ${new Date(u.medical_expiry) < new Date() ? 'text-rose-500' : 'text-emerald-500'}`}>
 Med Exp: {new Date(u.medical_expiry).toLocaleDateString()}
 </p>
 )}
 </div>
 </div>
 </td>
 
 {days.map(d => {
 const events = getEventsForUserAndDay(u.id, d);
 return (
 <td key={d.toISOString()} className="p-3 border-r border-white/20 dark:border-white/10 align-top h-24 last:border-0">
 <div className="space-y-2">
 {events.length === 0 ? (
 <div className="text-xs text-slate-400/50 dark:text-slate-500/50 text-center mt-6 font-bold tracking-widest uppercase">Clear</div>
 ) : (
 events.map(ev => (
 <div 
 key={ev.id} 
 className={`p-3 rounded-xl border text-xs font-bold group relative shadow-sm transition-all hover:scale-[1.02] ${getColor(ev)}`}
 >
 <div className="flex justify-between items-start mb-1">
 <span className="font-black truncate pr-2 tracking-tight">{ev.title}</span>
 {ev.type === 'duty' && (user.role === 'Administrator' || user.role === 'Operations Officer') && (
 <button onClick={() => setConfirmModal({ isOpen: true, dutyId: ev.id.replace('d-', '') })} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 dark:text-rose-400 bg-white/50 dark:bg-slate-900/50 w-5 h-5 rounded flex items-center justify-center transition-all">
 &times;
 </button>
 )}
 </div>
 <div className="text-[10px] opacity-80 flex items-center font-medium">
 <Clock className="w-3 h-3 mr-1"/>
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
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-indigo-900/20 w-full max-w-lg overflow-hidden transition-all transform">
  <div className="bg-slate-900 p-6 flex justify-between items-center">
 <h3 className="text-xl font-bold text-white flex items-center">
 <Briefcase className="w-6 h-6 mr-3 text-indigo-400"/> Assign Duty
 </h3>
 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
 </div>
 
 <div className="p-6 space-y-5">
 {errorMsg && (
 <div className="bg-red-50 border border-red-200 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm font-medium flex items-start">
 <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5"/>
 {errorMsg}
 </div>
 )}

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Staff Member</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
 value={modalUserId}
 onChange={e => setModalUserId(e.target.value)}
 >
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
 </select>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duty Type</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
 value={dutyInputs.duty_type}
 onChange={e => setDutyInputs({...dutyInputs, duty_type: e.target.value})}
 >
 <option value="Standby">Standby (Reserve)</option>
 <option value="Ground Training">Ground Training</option>
 <option value="Leave">Annual Leave</option>
 <option value="Day Off">Day Off</option>
 </select>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
 <input 
 type="datetime-local"
 lang="en-GB"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
 value={dutyInputs.start_time}
 onChange={e => setDutyInputs({...dutyInputs, start_time: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">End Time</label>
 <input 
 type="datetime-local"
 lang="en-GB"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
 value={dutyInputs.end_time}
 onChange={e => setDutyInputs({...dutyInputs, end_time: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</label>
 <input 
 type="text"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
 value={dutyInputs.notes}
 onChange={e => setDutyInputs({...dutyInputs, notes: e.target.value})}
 placeholder="e.g. Airport Standby, Recurrent SEP"
 />
 </div>

  <button 
  onClick={saveDuty}
  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 shadow-md"
  >
  <CheckCircle2 className="w-5 h-5 mr-2"/> Confirm Duty Assignment
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
