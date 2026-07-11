import React, { useState, useEffect } from 'react';
import { UserCircle, BookOpen, Clock, Award } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { API_BASE } from '../config';


export default function StudentProgress({ token, user }) {
 const [students, setStudents] = useState([]);
 const [bookings, setBookings] = useState([]);
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [loading, setLoading] = useState(true);

 const isStudent = user?.role === 'Student Pilot';

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const [resUsers, resBookings] = await Promise.all([
 fetch(`${API_BASE}/api/users/`, { headers: { 'Authorization': `Bearer ${token}` } }),
 fetch(`${API_BASE}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } })
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
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, [token, user, isStudent]);

 if (loading) return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading Logbooks...</div>;

 const studentBookings = selectedStudent 
 ? bookings.filter(b => b.student?.id === selectedStudent.id && b.status === 'Completed')
 : [];

 const totalMinutes = studentBookings.reduce((acc, b) => {
 const start = new Date(b.start_time);
 const end = new Date(b.end_time);
 return acc + differenceInMinutes(end, start);
 }, 0);

 const totalHours = (totalMinutes / 60).toFixed(1);

 return (
 <div className={`grid grid-cols-12 gap-6`}>
 {/* Student List Sidebar - HIDDEN if user is a Student */}
 {!isStudent && (
 <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-[calc(100vh-100px)] flex flex-col">
 <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900">
 <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
 <UserCircle className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400"/> Students
 </h2>
 </div>
 <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
 {students.map(student => (
 <button 
 key={student.id}
 onClick={() => setSelectedStudent(student)}
 className={`w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center ${selectedStudent?.id === student.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
 >
 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-4 text-slate-600 dark:text-slate-300 font-bold uppercase">
 {student.full_name.charAt(0)}
 </div>
 <div className="overflow-hidden">
 <p className="font-bold text-slate-800 dark:text-white truncate">{student.full_name}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Profile & Logbook View */}
 <div className={`col-span-12 ${!isStudent ? 'md:col-span-8' : ''} space-y-6`}>
 {selectedStudent ? (
 <>
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
 <div className="flex items-center">
 <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-6 text-blue-600 dark:text-blue-400 dark:text-blue-400 font-bold text-2xl uppercase">
 {selectedStudent.full_name.charAt(0)}
 </div>
 <div>
 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedStudent.full_name}</h2>
 <p className="text-slate-500 dark:text-slate-400">Student Pilot Candidate</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-1">Total Flight Time</p>
 <p className="text-3xl font-black text-blue-600 dark:text-blue-400 dark:text-blue-400 flex items-center justify-end">
 <Clock className="w-6 h-6 mr-2"/> {totalHours} <span className="text-lg font-medium text-slate-400 ml-1">hrs</span>
 </p>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
 <BookOpen className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400"/> Digital Logbook & Grades
 </h3>
 </div>
 {studentBookings.length === 0 ? (
 <div className="p-8 text-center text-slate-500 dark:text-slate-400">
 No completed flights found for this student.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
 <th className="px-6 py-4">Date</th>
 <th className="px-6 py-4">Aircraft</th>
 <th className="px-6 py-4">Instructor</th>
 <th className="px-6 py-4">Grade</th>
 <th className="px-6 py-4">Notes</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {studentBookings.map(b => (
 <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
 {new Date(b.start_time).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
 {b.resource?.name}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
 {b.instructor?.full_name || 'Solo'}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 {b.grade ? (
 <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 text-xs font-bold rounded-lg flex items-center w-max">
 <Award className="w-3 h-3 mr-1"/> {b.grade}
 </span>
 ) : '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
 {b.instructor_notes || '-'}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center p-12 text-center text-slate-400">
 <div>
 <UserCircle className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
 <p className="text-lg">Select a student from the sidebar to view their progress.</p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
