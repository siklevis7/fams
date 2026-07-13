import React, { useState, useEffect } from 'react';
import { UserCircle, BookOpen, Clock, Award, TrendingUp, Plane, Target } from 'lucide-react';
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
    <div className="grid grid-cols-12 gap-6 animate-pulse">
      {!isStudent && (
        <div className="col-span-12 md:col-span-4 bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 rounded-3xl h-[calc(100vh-100px)] p-6 space-y-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-800/50 rounded w-1/2 mb-4"></div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800/50 rounded-2xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800/50 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={`col-span-12 ${!isStudent ? 'md:col-span-8' : ''} space-y-6`}>
        <div className="bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 rounded-3xl p-8 h-36 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-slate-200 dark:bg-slate-800/50 rounded-3xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 dark:bg-slate-800/50 rounded w-48"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded w-32"></div>
            </div>
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800/50 rounded w-32"></div>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 rounded-3xl p-8 h-[350px] space-y-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-800/50 rounded w-1/4"></div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800/50 rounded-2xl w-full"></div>
          ))}
        </div>
      </div>
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
 <div className={`grid grid-cols-12 gap-6`}>
 {/* Student List Sidebar - HIDDEN if user is a Student */}
 {!isStudent && (
 <div className="col-span-12 md:col-span-4 liquid-glass rounded-3xl overflow-hidden h-[calc(100vh-100px)] flex flex-col transition-all duration-300">
 <div className="border-b border-white/20 dark:border-white/10 px-8 py-6 bg-white/40 dark:bg-black/20 backdrop-blur-md">
 <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center tracking-tight">
 <UserCircle className="w-6 h-6 mr-3 text-indigo-500"/> Students
 </h2>
 </div>
 <div className="divide-y divide-white/20 dark:divide-white/10 overflow-y-auto flex-1">
 {students.map(student => (
 <button 
 key={student.id}
 onClick={() => setSelectedStudent(student)}
 className={`w-full text-left px-8 py-5 hover:bg-white/40 dark:hover:bg-black/20 transition-all flex items-center group ${selectedStudent?.id === student.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500 shadow-inner' : 'border-l-4 border-transparent'}`}
 >
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 font-black text-lg transition-transform group-hover:scale-105 ${selectedStudent?.id === student.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
 {student.full_name.charAt(0)}
 </div>
 <div className="overflow-hidden">
 <p className="font-bold text-slate-800 dark:text-white truncate text-base">{student.full_name}</p>
 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Profile & Logbook View */}
 <div className={`col-span-12 ${!isStudent ? 'md:col-span-8' : ''} space-y-6 pb-20`}>
 {selectedStudent ? (
 <>
 <div className="liquid-glass rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 transition-all duration-300">
 <div className="flex items-center">
 <div className="w-20 h-20 rounded-3xl bg-indigo-500 text-white flex items-center justify-center mr-6 font-black text-3xl uppercase shadow-lg shadow-indigo-500/30 ring-4 ring-white/20 dark:ring-white/10">
 {selectedStudent.full_name.charAt(0)}
 </div>
 <div>
 <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{selectedStudent.full_name}</h2>
 <p className="text-sm font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mt-1">Student Pilot Candidate</p>
 </div>
 </div>
 <div className="text-left md:text-right w-full md:w-auto border-t border-white/20 dark:border-white/10 md:border-t-0 pt-6 md:pt-0">
 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black mb-2">Total Flight Time</p>
 <p className="text-4xl font-black text-gradient flex items-center justify-start md:justify-end">
 <Clock className="w-8 h-8 mr-3 text-indigo-500"/> {totalHours} <span className="text-xl font-bold text-slate-400 ml-2">hrs</span>
 </p>
 </div>
 </div>

 {/* Flight Time Breakdown */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="liquid-glass rounded-2xl p-6 text-center">
 <div className="text-xs uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2">PIC Time</div>
 <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalPIC}</div>
 <div className="text-xs text-slate-400 font-bold">hours</div>
 </div>
 <div className="liquid-glass rounded-2xl p-6 text-center">
 <div className="text-xs uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2">Dual Time</div>
 <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalDual}</div>
 <div className="text-xs text-slate-400 font-bold">hours</div>
 </div>
 <div className="liquid-glass rounded-2xl p-6 text-center">
 <div className="text-xs uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2">Night</div>
 <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{totalNight}</div>
 <div className="text-xs text-slate-400 font-bold">hours</div>
 </div>
 <div className="liquid-glass rounded-2xl p-6 text-center">
 <div className="text-xs uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2">Cross-Country</div>
 <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalXC}</div>
 <div className="text-xs text-slate-400 font-bold">hours</div>
 </div>
 </div>

 {/* Syllabus Progress */}
 <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300">
 <div className="border-b border-white/20 dark:border-white/10 px-8 py-6 bg-white/40 dark:bg-black/20 backdrop-blur-md flex justify-between items-center">
 <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center tracking-tight">
 <Target className="w-6 h-6 mr-3 text-indigo-500"/> Syllabus Progression
 </h3>
 <span className="text-sm font-black px-4 py-2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-500/30">
 {completedSorties} / {totalSorties} Complete
 </span>
 </div>
 <div className="p-8">
 <div className="mb-4">
 <div className="flex justify-between mb-2">
 <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Overall Progress</span>
 <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{progressPercentage}%</span>
 </div>
 <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
 <div 
 className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
 style={{ width: `${progressPercentage}%` }}
 ></div>
 </div>
 </div>
 {syllabus.length > 0 ? (
 <div className="space-y-2 max-h-64 overflow-y-auto">
 {syllabus.map(sortie => {
 const isCompleted = sortie.order_index <= progression;
 const isCurrent = sortie.order_index === progression + 1;
 return (
 <div 
 key={sortie.id}
 className={`flex items-center justify-between p-4 rounded-xl transition-all ${
 isCompleted 
 ? 'bg-emerald-500/10 border border-emerald-500/30' 
 : isCurrent
 ? 'bg-indigo-500/10 border border-indigo-500/30 ring-2 ring-indigo-500/20'
 : 'bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-white/10'
 }`}
 >
 <div className="flex items-center space-x-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
 isCompleted 
 ? 'bg-emerald-500 text-white' 
 : isCurrent
 ? 'bg-indigo-500 text-white'
 : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
 }`}>
 {sortie.code}
 </div>
 <div>
 <p className={`font-bold text-sm ${isCompleted || isCurrent ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
 {sortie.name}
 </p>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
 {sortie.category} • {sortie.required_hours}h
 </p>
 </div>
 </div>
 {isCompleted && (
 <TrendingUp className="w-5 h-5 text-emerald-500"/>
 )}
 {isCurrent && (
 <Plane className="w-5 h-5 text-indigo-500 animate-pulse"/>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-center text-slate-500 dark:text-slate-400 text-sm">No syllabus configured</p>
 )}
 </div>
 </div>

 {/* Digital Logbook */}
 <div className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300">
 <div className="border-b border-white/20 dark:border-white/10 px-8 py-6 bg-white/40 dark:bg-black/20 backdrop-blur-md flex justify-between items-center">
 <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center tracking-tight">
 <BookOpen className="w-6 h-6 mr-3 text-indigo-500"/> Digital Logbook & Grades
 </h3>
 </div>
 {studentBookings.length === 0 ? (
 <div className="p-8 text-center text-slate-500 dark:text-slate-400">
 No completed flights found for this student.
 </div>
 ) : (
 <div className="overflow-x-auto pb-2">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-white/40 dark:bg-black/20 border-b border-white/20 dark:border-white/10 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black">
 <th className="px-8 py-5">Date</th>
 <th className="px-8 py-5">Sortie</th>
 <th className="px-8 py-5">Aircraft</th>
 <th className="px-8 py-5">Instructor</th>
 <th className="px-8 py-5">Duration</th>
 <th className="px-8 py-5">Grade</th>
 <th className="px-8 py-5">Notes</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/20 dark:divide-white/10">
 {studentBookings.map(b => {
 const duration = differenceInMinutes(new Date(b.end_time), new Date(b.start_time));
 const hours = Math.floor(duration / 60);
 const minutes = duration % 60;
 return (
 <tr key={b.id} className="hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
 <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-white">
 {new Date(b.start_time).toLocaleDateString()}
 </td>
 <td className="px-8 py-5 whitespace-nowrap">
 {b.sortie ? (
 <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-black tracking-widest uppercase rounded-xl border border-indigo-500/30">
 {b.sortie.code}
 </span>
 ) : b.is_extra ? (
 <span className="px-3 py-1.5 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-black tracking-widest uppercase rounded-xl border border-purple-500/30">
 EXTRA
 </span>
 ) : '-'}
 </td>
 <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
 {b.resource?.name}
 </td>
 <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
 {b.instructor?.full_name || 'Solo'}
 </td>
 <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-white">
 {hours}h {minutes}m
 </td>
 <td className="px-8 py-5 whitespace-nowrap">
 {b.grade ? (
 <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black tracking-widest uppercase rounded-xl flex items-center w-max border border-emerald-500/30">
 <Award className="w-4 h-4 mr-2"/> {b.grade}
 </span>
 ) : '-'}
 </td>
 <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-300 max-w-xs truncate">
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
 <div className="liquid-glass rounded-3xl h-full flex flex-col items-center justify-center p-16 text-center text-slate-400 transition-all duration-300">
 <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-full mb-6">
 <UserCircle className="w-20 h-20 text-indigo-400/50"/>
 </div>
 <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 mb-2">Select a Student</h3>
 <p className="text-lg font-medium text-slate-500">Choose a candidate from the sidebar to view their logbook and progress.</p>
 </div>
 )}
 </div>
 </div>
 );
}
