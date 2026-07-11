import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addHours, differenceInMinutes, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';


export default function DispatchCalendar({ token, user }) {
 const [bookings, setBookings] = useState([]);
 const [resources, setResources] = useState([]);
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

 // Modal State
 const [showBookingModal, setShowBookingModal] = useState(false);
 const [editingBookingId, setEditingBookingId] = useState(null);
 const [bookingError, setBookingError] = useState('');
 const [formData, setFormData] = useState({
 resource_id: '',
 instructor_id: '',
 student_id: '',
 start_time: '',
 end_time: ''
 });

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const [resBookings, resResources, resUsers] = await Promise.all([
 fetch(`${API_BASE}/api/bookings/`, {
 headers: { 'Authorization': `Bearer ${token}` }
 }),
 fetch(`${API_BASE}/api/resources/`, {
 headers: { 'Authorization': `Bearer ${token}` }
 }),
 fetch(`${API_BASE}/api/users/`, {
 headers: { 'Authorization': `Bearer ${token}` }
 })
 ]);
 
 if (resBookings.ok && resResources.ok && resUsers.ok) {
 setBookings(await resBookings.json());
 setResources(await resResources.json());
 setUsers(await resUsers.json());
 }
 } catch (error) {
 console.error("Failed to fetch data", error);
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, [token, currentDate]);

 // Timeline configuration
 const START_HOUR = 6; // 6 AM
 const END_HOUR = 22; // 10 PM
 const TOTAL_HOURS = END_HOUR - START_HOUR;
 const HOUR_WIDTH = 120; // pixels per hour

 const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

 const getBookingStyle = (booking) => {
 const start = parseISO(booking.start_time);
 const end = parseISO(booking.end_time);
 const dayStart = addHours(currentDate, START_HOUR);
 
 // Calculate pixels based on minutes from timeline start
 const offsetMinutes = differenceInMinutes(start, dayStart);
 const durationMinutes = differenceInMinutes(end, start);
 
 const left = (offsetMinutes / 60) * HOUR_WIDTH;
 const width = (durationMinutes / 60) * HOUR_WIDTH;

 return {
 left: `${Math.max(0, left)}px`,
 width: `${width}px`,
 };
 };

 const getStatusColor = (status) => {
 switch (status) {
 case 'Scheduled': return 'bg-blue-500 border-blue-600';
 case 'Completed': return 'bg-emerald-500 border-emerald-600';
 case 'Cancelled': return 'bg-slate-400 border-slate-500';
 default: return 'bg-indigo-50 dark:bg-indigo-900/400 border-indigo-600';
 }
 };

 const handleScheduleSubmit = async (e) => {
 e.preventDefault();
 setBookingError('');
 try {
 // Format dates to ISO
 const startIso = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${formData.start_time}`);
 const endIso = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${formData.end_time}`);
 
 if (startIso >= endIso) {
 setBookingError('End time must be after start time.');
 return;
 }

  const payload = {
    resource_id: parseInt(formData.resource_id),
    start_time: startIso.toISOString(),
    end_time: endIso.toISOString(),
    instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : null,
    student_id: formData.student_id ? parseInt(formData.student_id) : null,
  };

 const url = editingBookingId ? `/api/bookings/${editingBookingId}` : '/api/bookings/';
 const method = editingBookingId ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method: method,
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify(payload)
 });

 if (res.ok) {
 setShowBookingModal(false);
 setEditingBookingId(null);
 // Refresh bookings
 const resBookings = await fetch(`${API_BASE}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` }});
 if (resBookings.ok) setBookings(await resBookings.json());
 } else {
 const data = await res.json();
 setBookingError(data.detail || 'Failed to save flight.');
 }
 } catch (e) {
 setBookingError('Network error. Please try again.');
 }
 };

  const editBooking = (booking) => {
    setEditingBookingId(booking.id);
    setFormData({
      resource_id: booking.resource_id || '',
      instructor_id: booking.instructor_id || '',
      student_id: booking.student_id || '',
      start_time: format(parseISO(booking.start_time), 'HH:mm'),
      end_time: format(parseISO(booking.end_time), 'HH:mm')
    });
    setShowBookingModal(true);
  };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
 </div>
 );
 }

 // Filter bookings to only show current date
 const todaysBookings = bookings.filter(b => {
 const start = parseISO(b.start_time);
 return start >= currentDate && start < addDays(currentDate, 1);
 });

 return (
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 {/* Calendar Header */}
 <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-slate-50 dark:bg-slate-900">
 <div className="flex flex-wrap items-center gap-2">
 <button 
 onClick={() => setCurrentDate(subDays(currentDate, 1))}
 className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
 <ChevronLeft className="w-5 h-5"/>
 </button>
 <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-semibold text-lg">
 <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 dark:text-blue-400"/>
 <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
 </div>
 <button 
 onClick={() => setCurrentDate(addDays(currentDate, 1))}
 className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
 <ChevronRight className="w-5 h-5"/>
 </button>
 <button 
 onClick={() => setCurrentDate(startOfDay(new Date()))}
 className="ml-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
 Today
 </button>
 </div>
 <div className="flex flex-wrap items-center gap-3 text-sm">
 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Scheduled</div>
 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Completed</div>
 {['Administrator', 'Operations Officer', 'Instructor', 'Examiner'].includes(user?.role) && (
 <button 
 onClick={() => { setEditingBookingId(null); setFormData({resource_id: '', instructor_id: '', student_id: '', start_time: '', end_time: ''}); setShowBookingModal(true); }}
 className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-sm transition-colors text-sm font-medium">
 + Schedule Flight
 </button>
 )}
 </div>
 </div>

 {/* Gantt Timeline */}
 <div className="overflow-x-auto pb-2">
 <div className="min-w-max">
 {/* Time Header */}
 <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
 <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 p-4 font-semibold text-slate-600 dark:text-slate-300 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] relative z-10 bg-slate-50 dark:bg-slate-900">
 Resource / Aircraft
 </div>
 <div className="flex relative"style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
 {hours.map(hour => (
 <div key={hour} className="shrink-0 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium p-2"style={{ width: `${HOUR_WIDTH}px` }}>
 {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
 </div>
 ))}
 </div>
 </div>

 {/* Resource Rows */}
 {resources.map(resource => (
 <div key={resource.id} className="flex border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
 {/* Resource Label */}
 <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-center bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] relative z-10">
 <span className="font-bold text-slate-800 dark:text-white">{resource.name}</span>
 <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
 {resource.type === 'Aircraft' ? <MapPin className="w-3 h-3 mr-1"/> : <Clock className="w-3 h-3 mr-1"/>}
 {resource.type}
 </span>
 </div>
 
 {/* Timeline Row */}
 <div className="relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTE5LjUgMEwxMTkuNSAxMDAiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] bg-repeat"style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
 {todaysBookings
 .filter(b => b.resource_id === resource.id)
 .map(booking => (
 <div 
 key={booking.id}
 onClick={() => {
    if (['Administrator', 'Operations Officer', 'Instructor', 'Examiner'].includes(user?.role)) {
        editBooking(booking);
    }
 }}
 className={`absolute top-2 bottom-2 rounded-md shadow-sm border text-white p-2 text-xs overflow-hidden ${getStatusColor(booking.status)} hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 cursor-pointer transition-all`}
 style={getBookingStyle(booking)}
 title={`${booking.student?.full_name} with ${booking.instructor?.full_name}`}
 >
 <div className="font-semibold truncate">{booking.student ? booking.student.full_name : 'Solo Flight'}</div>
 <div className="text-white/80 truncate mt-0.5">{booking.instructor ? booking.instructor.full_name : 'No Instructor'}</div>
 <div className="text-white/60 text-[10px] mt-1 hidden sm:block">
 {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 
 {resources.length === 0 && (
 <div className="p-8 text-center text-slate-500 dark:text-slate-400">
 No resources found. Seed the database to display resources.
 </div>
 )}
 </div>
 </div>

 {/* Schedule Flight Modal */}
 {showBookingModal && (
 <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
 <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingBookingId ? 'Edit Flight' : 'Schedule Flight'}</h3>
 <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600">
 <svg className="w-6 h-6"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
 </svg>
 </button>
 </div>
 <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
 {bookingError && (
 <div className="p-3 bg-red-50 border border-red-200 text-red-600 dark:text-red-400 rounded-lg text-sm">
 {bookingError}
 </div>
 )}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource / Aircraft</label>
 <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
 value={formData.resource_id || ''}
 onChange={(e) => setFormData({...formData, resource_id: e.target.value})}>
 <option value="">Select a resource...</option>
 {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instructor (Optional)</label>
 <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
 value={formData.instructor_id || ''}
 onChange={(e) => setFormData({...formData, instructor_id: e.target.value})}>
 <option value="">None (Solo)</option>
 {users.filter(u => ['Instructor', 'Examiner'].includes(u.role)).map(u => 
 <option key={u.id} value={u.id}>{u.full_name}</option>
 )}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student (Optional)</label>
 <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
 value={formData.student_id || ''}
 onChange={(e) => setFormData({...formData, student_id: e.target.value})}>
 <option value="">None</option>
 {users.map(u => 
 <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
 )}
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
 <input required type="time"lang="en-GB"className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
 value={formData.start_time}
 onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
 <input required type="time"lang="en-GB"className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
 value={formData.end_time}
 onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
 </div>
 </div>
 
 <div className="pt-4 flex justify-end space-x-3">
 <button type="button"onClick={() => setShowBookingModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
 Cancel
 </button>
 <button type="submit"className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
 {editingBookingId ? 'Update' : 'Schedule'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
