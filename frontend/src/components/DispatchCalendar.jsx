import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addHours, differenceInMinutes, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, Loader2, X, Plus } from 'lucide-react';
import { API_BASE } from '../config';

export default function DispatchCalendar({ token, user }) {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [studentProgression, setStudentProgression] = useState(0);
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
    end_time: '',
    sortie_id: '',
    is_extra: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resBookings, resResources, resUsers, resSyllabus] = await Promise.all([
          fetch(`${API_BASE}/api/bookings/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/resources/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/syllabus/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        // Set each piece of state independently — one failure must NOT blank all others
        if (resBookings.ok) setBookings(await resBookings.json());
        if (resResources.ok) setResources(await resResources.json());
        if (resUsers.ok) setUsers(await resUsers.json());
        if (resSyllabus.ok) setSyllabus(await resSyllabus.json());

      } catch (error) {
        console.error("Failed to fetch calendar data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, currentDate]);

  useEffect(() => {
    if (formData.student_id) {
        fetch(`${API_BASE}/api/students/${formData.student_id}/progression`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setStudentProgression(data.highest_completed_index || 0);
            if(!formData.sortie_id && !editingBookingId) {
                 // Auto select next sortie
                 const nextSorties = syllabus.filter(s => s.order_index <= (data.highest_completed_index || 0) + 1);
                 if (nextSorties.length > 0) {
                     setFormData(prev => ({...prev, sortie_id: nextSorties[nextSorties.length-1].id}));
                 }
            }
        })
        .catch(err => console.error(err));
    } else {
        setStudentProgression(0);
    }
  }, [formData.student_id, token, syllabus]);

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

  const getStatusColorClass = (booking) => {
    const status = booking.status;
    if (status === 'Completed') return 'booking-status-completed';
    if (status === 'Cancelled') return 'booking-status-cancelled';
    
    // Check if it's currently active (Scheduled but time has reached)
    const now = new Date();
    const start = parseISO(booking.start_time);
    const end = parseISO(booking.end_time);
    
    if (status === 'Scheduled') {
      if (now >= start && now <= end) {
        return 'booking-status-active';
      } else {
        // Future/Past Scheduled
        return 'booking-status-scheduled';
      }
    }
    return 'booking-status-scheduled';
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
        sortie_id: formData.sortie_id ? parseInt(formData.sortie_id) : null,
        is_extra: formData.is_extra
      };

      const url = editingBookingId ? `${API_BASE}/api/bookings/${editingBookingId}` : `${API_BASE}/api/bookings/`;
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
      end_time: format(parseISO(booking.end_time), 'HH:mm'),
      sortie_id: booking.sortie_id || '',
      is_extra: booking.is_extra || false
    });
    setShowBookingModal(true);
  };

 if (loading) {
   return (
     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '2.5rem' }}>
       <Loader2 size={32} className="spinner" style={{ color: 'var(--color-primary)' }}/>
     </div>
   );
 }

 // Filter bookings to only show current date
 const todaysBookings = bookings.filter(b => {
   const start = parseISO(b.start_time);
   return start >= currentDate && start < addDays(currentDate, 1);
 });

 return (
   <div className="page-container">
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon style={{ color: 'var(--color-primary)' }}/> Dispatch
        </h1>
        {['Administrator', 'Operations Officer', 'Instructor', 'Examiner'].includes(user?.role) && (
          <button 
            onClick={() => { setEditingBookingId(null); setFormData({resource_id: '', instructor_id: '', student_id: '', start_time: '', end_time: '', is_extra: false}); setShowBookingModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={18} /> Schedule Flight
          </button>
        )}
      </div>

     <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
       {/* Calendar Header */}
       <div className="calendar-toolbar" style={{ borderBottom: '1px solid var(--border-light)', padding: '1rem 1.5rem', background: 'var(--bg-card-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
         <div className="calendar-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <button 
             onClick={() => setCurrentDate(subDays(currentDate, 1))}
             className="icon-btn" style={{ padding: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
             <ChevronLeft size={20} />
           </button>
           <div className="text-subheading" style={{ margin: '0 0.5rem', fontWeight: '800' }}>
             <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
           </div>
           <button 
             onClick={() => setCurrentDate(addDays(currentDate, 1))}
             className="icon-btn" style={{ padding: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
             <ChevronRight size={20} />
           </button>
           <button 
             onClick={() => setCurrentDate(startOfDay(new Date()))}
             className="btn btn-secondary" style={{ marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
             Today
           </button>
         </div>
         <div className="calendar-legend" style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>
           <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="legend-dot dot-scheduled" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }}></div> Scheduled</div>
           <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="legend-dot dot-completed" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }}></div> Completed</div>
         </div>
       </div>

       {/* Gantt Timeline */}
       <div className="timeline-wrapper" style={{ overflowX: 'auto' }}>
         <div style={{ minWidth: 'max-content' }}>
           {/* Time Header */}
           <div className="timeline-header" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-body)' }}>
             <div className="resource-col-header" style={{ width: '250px', padding: '1rem 1.5rem', fontWeight: '800', borderRight: '1px solid var(--border-light)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-body)' }}>
               Resource
             </div>
             <div className="flex relative" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px`, display: 'flex' }}>
               {hours.map(hour => (
                 <div key={hour} className="time-col-header" style={{ width: `${HOUR_WIDTH}px`, padding: '1rem 0.5rem', fontWeight: '800', borderRight: '1px dashed var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                   {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                 </div>
               ))}
             </div>
           </div>

           {/* Resource Rows */}
           {resources.map(resource => (
             <div key={resource.id} className="resource-row" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s', ':hover': { background: 'var(--bg-card-hover)' } }}>
               {/* Resource Label */}
               <div className="resource-label" style={{ width: '250px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRight: '1px solid var(--border-light)', background: 'var(--bg-card)', position: 'sticky', left: 0, zIndex: 5 }}>
                 {resource.type === 'Aircraft' ? <MapPin size={18} style={{ color: 'var(--color-primary)' }} /> : <Clock size={18} style={{ color: 'var(--color-primary)' }} />}
                 <span className="resource-name" title={resource.name} style={{ fontWeight: '700', color: 'var(--text-main)' }}>{resource.name}</span>
               </div>
               
               {/* Timeline Row */}
               <div className="timeline-grid" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px`, position: 'relative', background: 'var(--bg-card)', minHeight: '60px' }}>
                 {/* Hour dividers */}
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
                   {hours.map(hour => (
                     <div key={hour} style={{ width: `${HOUR_WIDTH}px`, borderRight: '1px dashed var(--border-light)', opacity: 0.5 }}></div>
                   ))}
                 </div>
                 
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
                       className={`booking-block ${getStatusColorClass(booking)}`}
                       style={{...getBookingStyle(booking), position: 'absolute', top: '10px', height: '40px', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap', zIndex: 2, transition: 'transform 0.2s, box-shadow 0.2s' }}
                       title={`${booking.student ? booking.student.full_name : 'Solo'} with ${booking.instructor ? booking.instructor.full_name : 'No Instructor'}`}
                     >
                       <div className="booking-content" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {booking.sortie ? <span className="booking-badge" style={{ background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.25rem', borderRadius: '2px', fontWeight: '800' }}>{booking.sortie.code}</span> : null}
                         {booking.is_extra ? <span className="booking-badge" style={{ background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.25rem', borderRadius: '2px', fontWeight: '800' }}>EXTRA</span> : null}
                         <span>{booking.student ? booking.student.full_name : 'Solo Flight'}</span>
                         {booking.instructor ? <span style={{ opacity: 0.8 }}>w/ {booking.instructor.full_name.split(' ')[0]}</span> : null}
                       </div>
                     </div>
                   ))}
               </div>
             </div>
           ))}
           
           {resources.length === 0 && (
             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
               No resources found. Seed the database to display resources.
             </div>
           )}
         </div>
       </div>
     </div>

     {/* Schedule Flight Modal */}
     {showBookingModal && (
       <div className="modal-overlay">
         <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
           <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 className="text-heading" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <CalendarIcon size={24} style={{ color: 'var(--color-primary)' }}/> 
               {editingBookingId ? 'Edit Flight' : 'Schedule Flight'}
             </h3>
             <button onClick={() => setShowBookingModal(false)} className="icon-btn">
               <X size={24} />
             </button>
           </div>
           <form onSubmit={handleScheduleSubmit} className="modal-body space-y-4">
             {bookingError && (
               <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', marginBottom: '1rem' }}>
                 {bookingError}
               </div>
             )}
             <div className="form-group mb-0">
               <label className="form-label">Resource / Aircraft</label>
               <select required className="input-field"
                 value={formData.resource_id || ''}
                 onChange={(e) => setFormData({...formData, resource_id: e.target.value})}>
                 <option value="">Select a resource...</option>
                 {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
               </select>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div className="form-group mb-0">
                 <label className="form-label">Instructor (Optional)</label>
                 <select className="input-field"
                   value={formData.instructor_id || ''}
                   onChange={(e) => setFormData({...formData, instructor_id: e.target.value})}>
                   <option value="">None (Solo)</option>
                   {users.filter(u => ['Instructor', 'Examiner'].includes(u.role)).map(u => 
                     <option key={u.id} value={u.id}>{u.full_name}</option>
                   )}
                 </select>
               </div>
               <div className="form-group mb-0">
                 <label className="form-label">Student (Optional)</label>
                 <select className="input-field"
                   value={formData.student_id || ''}
                   onChange={(e) => setFormData({...formData, student_id: e.target.value})}>
                   <option value="">None</option>
                   {users.map(u => 
                     <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                   )}
                 </select>
               </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div className="form-group mb-0">
                 <label className="form-label">Syllabus Sortie</label>
                 <select className="input-field"
                   value={formData.sortie_id || ''}
                   disabled={formData.is_extra}
                   onChange={(e) => setFormData({...formData, sortie_id: e.target.value})}>
                   <option value="">None</option>
                   {syllabus.map(s => {
                     const isAllowed = s.order_index <= studentProgression + 1;
                     return (
                         <option key={s.id} value={s.id} disabled={!isAllowed} style={!isAllowed ? {color: 'var(--text-muted)'} : {}}>
                             {s.code} - {s.name} {!isAllowed ? "(Locked)" : ""}
                         </option>
                     )
                   })}
                 </select>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                     <input type="checkbox" style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
                            checked={formData.is_extra}
                            onChange={(e) => setFormData({...formData, is_extra: e.target.checked, sortie_id: e.target.checked ? '' : formData.sortie_id})} />
                     <span>EXTRA Flight (Doesn't advance syllabus)</span>
                 </label>
               </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div className="form-group mb-0">
                 <label className="form-label">Start Time</label>
                 <input required type="time" lang="en-GB" className="input-field"
                   value={formData.start_time}
                   onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
               </div>
               <div className="form-group mb-0">
                 <label className="form-label">End Time</label>
                 <input required type="time" lang="en-GB" className="input-field"
                   value={formData.end_time}
                   onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
               <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}>
                 {editingBookingId ? 'Update Flight' : 'Schedule Flight'}
               </button>
               <button type="button" onClick={() => setShowBookingModal(false)} className="btn btn-secondary" style={{ padding: '1rem' }}>
                 Cancel
               </button>
             </div>
           </form>
         </div>
       </div>
     )}
   </div>
 );
}
