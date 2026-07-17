import React, { useState, useEffect } from 'react';
import { UserCircle, BookOpen, Clock, Award, TrendingUp, Plane, Target, Star, History } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { API_BASE } from '../config';

export default function StudentProgress({ token, user }) {
  const isStudent = user?.role === 'Student Pilot';
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(isStudent ? user : null);
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resUsers, resBookings, resSyllabus] = await Promise.all([
          fetch(`${API_BASE}/api/users/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/syllabus/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (resUsers.ok && resBookings.ok) {
          const allUsers = await resUsers.json();
          setStudents(allUsers.filter(u => u.role === 'Student Pilot'));
          setBookings(await resBookings.json());

          if (isStudent) {
            const myself = allUsers.find(u => u.id === user.id) || user;
            setSelectedStudent(myself);
          }
        }

        if (resSyllabus.ok) {
          setSyllabus(await resSyllabus.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user, isStudent]);

  useEffect(() => {
    const fetchProgression = async () => {
      if (selectedStudent) {
        try {
          const res = await fetch(`${API_BASE}/api/students/${selectedStudent.id}/progression`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProgression(data.highest_completed_index || 0);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchProgression();
  }, [selectedStudent, token]);

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
      <p style={{ color: 'var(--text-muted)' }}>Loading student data...</p>
    </div>
  );

  const studentBookings = selectedStudent 
    ? bookings.filter(b => b.student?.id === selectedStudent.id && b.status === 'Completed')
    : [];

  const totalMinutes = studentBookings.reduce((acc, b) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return acc + differenceInMinutes(end, start);
  }, 0);

  const totalHours = (totalMinutes / 60).toFixed(1);

  // Calculate flight time breakdown
  const totalPIC = studentBookings.reduce((acc, b) => acc + (b.pic_time || 0), 0).toFixed(1);
  const totalDual = studentBookings.reduce((acc, b) => acc + (b.dual_time || 0), 0).toFixed(1);
  const totalNight = studentBookings.reduce((acc, b) => acc + (b.night_time || 0), 0).toFixed(1);
  const totalXC = studentBookings.reduce((acc, b) => acc + (b.cross_country || 0), 0).toFixed(1);

  // Syllabus progress calculation
  const completedSorties = studentBookings.filter(b => b.sortie && !b.is_extra).length;
  const totalSorties = syllabus.length;
  const progressPercentage = totalSorties > 0 ? ((completedSorties / totalSorties) * 100).toFixed(0) : 0;

  return (
    <div className="grid-layout grid-layout-sidebar">
      {/* Student List Sidebar - HIDDEN if user is a Student */}
      {!isStudent && (
        <div className="grid-col-form student-sidebar glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'max-content', maxHeight: '80vh' }}>
          <div className="sidebar-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <h2 className="text-subheading" style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'var(--text-main)', fontWeight: '800' }}>
              <UserCircle size={20} style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }}/> Cadets
            </h2>
          </div>
          <div className="content-scroll" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {students.map(student => (
              <button 
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`user-card ${selectedStudent?.id === student.id ? 'active' : ''}`}
                style={selectedStudent?.id === student.id ? { background: 'var(--bg-card-hover)', borderColor: 'var(--border-strong)' } : {}}
              >
                <div className="user-avatar" style={selectedStudent?.id === student.id ? { transform: 'scale(1.05)', boxShadow: 'var(--shadow-glow)' } : {}}>
                  {student.full_name.charAt(0)}
                </div>
                <div className="user-info">
                  <p className="user-name">{student.full_name}</p>
                  <p className="user-role">{student.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile & Logbook View */}
      <div className={`grid-col-list flex flex-col gap-6 ${isStudent ? 'grid-col-form grid-col-list' : ''}`} style={{ gridColumn: isStudent ? 'span 12' : undefined }}>
        {selectedStudent ? (
          <>
            <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-10%', top: '-20%', opacity: '0.03', pointerEvents: 'none' }}>
                <Target size={300} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 10 }}>
                <div className="user-avatar" style={{ width: '5rem', height: '5rem', fontSize: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-heading" style={{ marginBottom: '0.25rem' }}>{selectedStudent.full_name}</h2>
                  <p className="text-subheading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={16} style={{ color: 'var(--color-primary)' }}/> Cadet Pilot
                  </p>
                </div>
              </div>
              <div style={{ zIndex: 10, textAlign: 'right', background: 'var(--bg-card-hover)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Hours</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Clock size={28} style={{ color: 'var(--color-primary)' }}/> {totalHours}
                </p>
              </div>
            </div>

            {/* Flight Time Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="stat-card-indigo">
                <div className="stat-header">
                  <div className="stat-label" style={{ color: 'var(--text-muted)' }}>PIC Time</div>
                  <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                    <UserCircle size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#6366f1' }}>{totalPIC} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span></div>
              </div>
              <div className="stat-card-violet">
                <div className="stat-header">
                  <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Dual Time</div>
                  <div className="stat-icon-wrapper" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                    <BookOpen size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#a78bfa' }}>{totalDual} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span></div>
              </div>
              <div className="stat-card-amber">
                <div className="stat-header">
                  <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Night Flight</div>
                  <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Star size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#f59e0b' }}>{totalNight} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span></div>
              </div>
              <div className="stat-card-rose">
                <div className="stat-header">
                  <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Cross-Country</div>
                  <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                    <Plane size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#f43f5e' }}>{totalXC} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span></div>
              </div>
            </div>

            {/* Syllabus Progress */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="text-subheading" style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'var(--text-main)', fontWeight: '800' }}>
                  <Target size={20} style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }}/> Syllabus Tracking
                </h3>
                <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '700' }}>
                  {completedSorties} / {totalSorties} Sorties
                </span>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)' }}>Completion</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--color-primary)' }}>{progressPercentage}%</span>
                </div>
                <div className="progress-bar-bg" style={{ height: '1.25rem' }}>
                  <div className="progress-bar-fill progress-bar-indigo" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>

              {syllabus.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {syllabus.map(sortie => {
                    const isCompleted = sortie.order_index <= progression;
                    const isCurrent = sortie.order_index === progression + 1;
                    return (
                      <div 
                        key={sortie.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
                          borderRadius: 'var(--radius-lg)',
                          border: isCompleted ? '1px solid var(--color-success-bg)' : isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                          background: isCompleted ? 'var(--color-success-bg)' : isCurrent ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-app)',
                          opacity: isCompleted ? 0.8 : 1,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--bg-card)',
                            color: isCompleted || isCurrent ? 'white' : 'var(--text-muted)',
                            fontWeight: '800', fontSize: '0.875rem', boxShadow: isCompleted || isCurrent ? 'var(--shadow-sm)' : 'none'
                          }}>
                            {sortie.code}
                          </div>
                          <div>
                            <p style={{ fontWeight: '800', fontSize: '0.95rem', color: isCompleted || isCurrent ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '0.125rem' }}>
                              {sortie.name}
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {sortie.category} • {sortie.required_hours}h
                            </p>
                          </div>
                        </div>
                        {isCompleted && (
                          <div style={{ background: 'white', borderRadius: '50%', padding: '0.25rem', display: 'flex', color: 'var(--color-success)' }}>
                            <TrendingUp size={16} />
                          </div>
                        )}
                        {isCurrent && (
                          <div style={{ background: 'var(--bg-card)', borderRadius: '50%', padding: '0.25rem', display: 'flex', color: 'var(--color-primary)', boxShadow: 'var(--shadow-glow)' }}>
                            <Plane size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No syllabus configured.</p>
              )}
            </div>

            {/* Digital Logbook */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <History size={20} style={{ color: 'var(--color-primary)' }}/>
                <h3 className="text-subheading" style={{ margin: 0, color: 'var(--text-main)', fontWeight: '800' }}>
                  Digital Logbook & Grades
                </h3>
              </div>
              
              {studentBookings.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No completed flights found for this student.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Sortie</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Aircraft</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Instructor</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Duration</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Grade</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentBookings.map((b, i) => {
                        const duration = differenceInMinutes(new Date(b.end_time), new Date(b.start_time));
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return (
                          <tr key={b.id} style={{ borderBottom: i === studentBookings.length - 1 ? 'none' : '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                            <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {new Date(b.start_time).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {b.sortie ? (
                                <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                                  {b.sortie.code}
                                </span>
                              ) : b.is_extra ? (
                                <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                                  EXTRA
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                              {b.resource?.name}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                              {b.instructor?.full_name || 'Solo'}
                            </td>
                            <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {hours}h {minutes}m
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {b.grade ? (
                                <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Award size={14} /> {b.grade}
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.instructor_notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ height: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-app)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: 'inset var(--shadow-sm)' }}>
              <UserCircle size={80} style={{ color: 'var(--border-strong)' }}/>
            </div>
            <h3 className="text-heading" style={{ fontSize: '1.5rem' }}>Select a Cadet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: '500' }}>Choose a candidate from the sidebar to view their logbook and progression.</p>
          </div>
        )}
      </div>
    </div>
  );
}
