import React, { useState, useEffect, useRef } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Calculator, FileSignature, Save, Printer } from 'lucide-react';
import { API_BASE } from '../config';
import { toast } from 'sonner';


export default function MassBalance({ token, user }) {
 const [resources, setResources] = useState([]);
 const [instructors, setInstructors] = useState([]);
 
 const [selectedResourceId, setSelectedResourceId] = useState('');
 const [activeResource, setActiveResource] = useState(null);
 
 const [selectedInstructorId, setSelectedInstructorId] = useState('');
 
 const [existingMb, setExistingMb] = useState(null);
 
 const [saving, setSaving] = useState(false);
 const [signing, setSigning] = useState(false);

 // Inputs
 const [inputs, setInputs] = useState({
    rearSeats: 0,
    baggage1: 0,
    fuelGallons: 0
 });

 const [calc, setCalc] = useState(null);
 const printRef = useRef();

 const fetchData = async () => {
 try {
 const [rRes, uRes] = await Promise.all([
 fetch(`${API_BASE}/api/resources/`, { headers: { 'Authorization': `Bearer ${token}` } }),
 fetch(`${API_BASE}/api/users/`, { headers: { 'Authorization': `Bearer ${token}` } })
 ]);
 
 if (rRes.ok) {
 const data = await rRes.json();
 setResources(data.filter(r => r.type === 'Aircraft'));
 }
 
 if (uRes.ok) {
 const uData = await uRes.json();
 setInstructors(uData.filter(u => u.role === 'Instructor' || u.role === 'Examiner'));
 }
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 fetchData();
 }, [token]);

 const fetchLatestMB = async (resourceId) => {
 try {
 const res = await fetch(`${API_BASE}/api/massbalance/${resourceId}`, {
 headers: { 'Authorization': `Bearer ${token}` }
 });
 if (res.ok) {
 const mb = await res.json();
 setExistingMb(mb);
 setInputs({
        rearSeats: mb.rear_seats_weight || 0,
        baggage1: mb.baggage_1_weight || 0,
        fuelGallons: mb.fuel_gallons || 0
 });
 if (mb.instructor_id) {
 setSelectedInstructorId(mb.instructor_id.toString());
 } else {
 setSelectedInstructorId('');
 }
        setExistingMb(null);
        setInputs({ rearSeats: 0, baggage1: 0, fuelGallons: 0 });
        setSelectedInstructorId('');
 }
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 if (selectedResourceId) {
 const resource = resources.find(r => r.id === parseInt(selectedResourceId));
 setActiveResource(resource);
 fetchLatestMB(selectedResourceId);
 } else {
 setActiveResource(null);
 setExistingMb(null);
 }
 }, [selectedResourceId, resources]);

 // Derived front seats based on user weights
 const getFrontSeatsWeight = () => {
 let weight = 0;
 
 // Add student weight (the current user if they are a student, or if we loaded an existing MB we use its student_id, but for now we just use current user if they are a student)
 if (user.role === 'Student Pilot') {
 weight += user.weight || 0;
 } else if (existingMb && existingMb.student) {
 weight += existingMb.student.weight || 0;
 } else if (user.role === 'Instructor' || user.role === 'Examiner') {
 // if user is instructor, add their weight as PIC
 if (!selectedInstructorId || parseInt(selectedInstructorId) === user.id) {
 weight += user.weight || 0;
 }
 }
 
 // Add instructor weight
 if (selectedInstructorId) {
 const instructor = instructors.find(i => i.id === parseInt(selectedInstructorId));
 if (instructor && instructor.id !== user.id) {
 weight += instructor.weight || 0;
 }
 }
 
 return weight;
 };

 useEffect(() => {
 if (activeResource) {
 calculateMB();
 }
 }, [inputs, activeResource, selectedInstructorId, user]);

 const handleInputChange = (e) => {
 const { name, value } = e.target;
 setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
 // Clear existingMb signature if inputs change
 if (existingMb && existingMb.signature_hash) {
 setExistingMb({...existingMb, signature_hash: null});
 }
 };

 const handleInstructorChange = (e) => {
 setSelectedInstructorId(e.target.value);
 if (existingMb && existingMb.signature_hash) {
 setExistingMb({...existingMb, signature_hash: null});
 }
 }

  const calculateMB = () => {
    if (!activeResource) return;

    const FUEL_KG_PER_GALLON = 2.72;
    const fuelWeight = inputs.fuelGallons * FUEL_KG_PER_GALLON;
    const frontSeats = getFrontSeatsWeight();

 const totalWeight = activeResource.basic_empty_weight + 
 frontSeats + 
 inputs.rearSeats + 
 inputs.baggage1 + 
 fuelWeight;

 const zfw = totalWeight - fuelWeight;

 const totalMoment = activeResource.empty_moment +
 (frontSeats * activeResource.arm_front_seats) +
 (inputs.rearSeats * activeResource.arm_rear_seats) +
 (inputs.baggage1 * activeResource.arm_baggage_1) +
 (fuelWeight * activeResource.arm_fuel);

 const cg = totalWeight > 0 ? (totalMoment / totalWeight) : 0;
 
 const isWithinMTOW = totalWeight <= activeResource.max_takeoff_weight;
 const isWithinCG = cg >= 35 && cg <= 47; // Generic limits

 setCalc({
 frontSeats,
 fuelWeight,
 totalWeight,
 zfw,
 totalMoment,
 cg,
 isWithinMTOW,
 isWithinCG,
 isValid: isWithinMTOW && isWithinCG
 });
 };

 const saveMassBalance = async () => {
 if (!activeResource || !calc) return;
 setSaving(true);
 
 const payload = {
 resource_id: activeResource.id,
 instructor_id: selectedInstructorId ? parseInt(selectedInstructorId) : null,
 student_id: user.role === 'Student Pilot' ? user.id : (existingMb ? existingMb.student_id : null),
 front_seats_weight: calc.frontSeats,
 rear_seats_weight: inputs.rearSeats,
      baggage_1_weight: inputs.baggage1,
      fuel_gallons: inputs.fuelGallons,
      zero_fuel_weight: calc.zfw,
 takeoff_weight: calc.totalWeight,
 takeoff_cg: calc.cg,
 is_valid: calc.isValid
 };

 try {
 const res = await fetch(`${API_BASE}/api/massbalance/`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 const newMb = await res.json();
 setExistingMb(newMb);
 toast.success('Mass & Balance saved successfully! It is now visible for this Aircraft.');
 }
 } catch (err) {
 console.error(err);
 } finally {
 setSaving(false);
 }
 };

 const signDocument = async () => {
 if (!existingMb) return;
 setSigning(true);
 try {
 const res = await fetch(`${API_BASE}/api/massbalance/${existingMb.id}/signoff`, {
 method: 'PATCH',
 headers: {
 'Authorization': `Bearer ${token}`
 }
 });
 if (res.ok) {
 const signedMb = await res.json();
 setExistingMb(signedMb);
 }
 } catch (err) {
 console.error(err);
 } finally {
 setSigning(false);
 }
 };

 const handlePrint = () => {
 window.print();
 };

 const isSigned = existingMb?.signature_hash != null;
 const isInstructor = user.role === 'Instructor' || user.role === 'Examiner';
 const canSign = isInstructor && existingMb && calc && calc.isValid && !isSigned && (user.id === existingMb.instructor_id || !existingMb.instructor_id);

 return (
  <div className="grid grid-cols-12 gap-6 pb-20 print:block print:p-0">
  <div className="flex justify-end mb-2 relative z-10 print:hidden">
  {activeResource && calc && (
  <button onClick={handlePrint} className="bg-slate-900/90 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center transition-all hover:scale-[1.02] shadow-lg shadow-slate-900/30 backdrop-blur-md relative z-10">
  <Printer className="w-5 h-5 mr-2"/> Print A5
  </button>
  )}
  </div>
 
  {/* Interactive Form Section */}
  <div className="col-span-12 md:col-span-4 space-y-6 print:hidden">
  <div className="liquid-glass rounded-3xl p-8 transition-all duration-300">
 <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">1. Select Aircraft</h2>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
 value={selectedResourceId}
 onChange={e => setSelectedResourceId(e.target.value)}
 >
 <option value="">-- Choose Aircraft --</option>
 {resources.map(r => (
 <option key={r.id} value={r.id}>
 {r.name}
 </option>
 ))}
 </select>

 {activeResource && (
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Instructor (PIC)</label>
 <select 
 className="w-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 text-indigo-900 rounded-lg px-3 py-2"
 value={selectedInstructorId}
 onChange={handleInstructorChange}
 >
 <option value="">-- No Instructor (Solo) --</option>
 {instructors.map(inst => (
 <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.weight} kg)</option>
 ))}
 </select>
 </div>

 <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
 <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Aircraft Limits</h3>
 <div className="space-y-1 text-sm text-indigo-800 dark:text-indigo-400">
 <p className="flex justify-between"><span>Basic Empty Wt:</span> <strong>{activeResource?.basic_empty_weight} kg</strong></p>
 <p className="flex justify-between"><span>Max Takeoff Wt:</span> <strong>{activeResource?.max_takeoff_weight} kg</strong></p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Load Data */}
  <div className={`liquid-glass rounded-3xl p-8 transition-all duration-300 ${!activeResource && 'opacity-50 pointer-events-none'}`}>
  <div className="flex justify-between items-center mb-6">
  <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">2. Enter Load Data</h2>
 {isSigned && <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded">Signed</span>}
 </div>
 
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Front Seats (Auto-calculated)</label>
 <input type="number"readOnly value={getFrontSeatsWeight()} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-md px-3 py-2 cursor-not-allowed"/>
 <p className="text-[10px] text-slate-400 mt-1">Based on selected users' profile weights</p>
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Rear Seats (Pax) [kg]</label>
 <input type="number"name="rearSeats"value={inputs.rearSeats} onChange={handleInputChange} className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 ${isSigned && 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 '}`} />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Baggage Area 1 [kg]</label>
 <input type="number"name="baggage1"value={inputs.baggage1} onChange={handleInputChange} className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 ${isSigned && 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 '}`} />
 </div>
  <div className="border-t border-white/20 dark:border-white/10 pt-6 mt-4">
  <label className="block text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 uppercase">Fuel Load [US Gal]</label>
  <input type="number" name="fuelGallons" value={inputs.fuelGallons} onChange={handleInputChange} className={`w-full bg-indigo-500/10 border-2 border-indigo-500/30 text-indigo-900 dark:text-indigo-300 rounded-xl px-4 py-3 font-black text-lg focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all ${isSigned && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'}`} />
  <p className="text-xs font-bold text-slate-500 mt-2 tracking-wide">Calculated weight: {calc?.fuelWeight?.toFixed(1) || 0} kg</p>
  </div>         </div>
 
  {(!isSigned || existingMb === null) && (
  <button 
  onClick={saveMassBalance}
  disabled={saving}
  className="w-full mt-8 bg-indigo-600/90 hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/30 backdrop-blur-md disabled:opacity-50"
  >
  <Save className="w-5 h-5 mr-2"/> {saving ? 'Saving...' : 'Save & Share'}
  </button>
  )}
  </div>
  </div>

 {/* Printable Area */}
 <div className={`col-span-12 md:col-span-8 space-y-6 print:block print:w-[148mm] print:h-[210mm] print:m-0 print:p-6 print:bg-white print:border-none print:shadow-none ${!activeResource && 'hidden'}`} ref={printRef}>
 
 {/* Printable Header */}
 <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
 <h1 className="text-2xl font-black text-slate-900 dark:text-white">FAMS.aero</h1>
 <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Official Mass & Balance computation</p>
 <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-800 dark:text-white">
 <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
 <div><strong>Aircraft:</strong> {activeResource?.name}</div>
 </div>
 </div>

  <div className="liquid-glass rounded-3xl overflow-hidden print:border-slate-400 print:shadow-none transition-all duration-300">
  <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-white/20 dark:border-white/10 print:bg-white print:border-slate-300">
  <h2 className="text-xl font-black text-slate-800 dark:text-white print:text-slate-900 flex items-center tracking-tight">
  <Calculator className="w-6 h-6 mr-3 text-indigo-500 print:hidden"/> Computation Sheet
  </h2>
 {existingMb && <span className="text-xs text-slate-400 print:text-slate-500">Saved: {new Date(existingMb.created_at).toLocaleTimeString()}</span>}
 </div>
 
  <div className="p-0 overflow-x-auto">
  <table className="w-full text-left whitespace-nowrap">
  <thead>
  <tr className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 print:bg-slate-50">
  <th className="px-6 py-3">Item</th>
  <th className="px-6 py-3">Weight (kg)</th>
  <th className="px-6 py-3">Arm (in)</th>
  <th className="px-6 py-3">Moment</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 text-sm print:divide-slate-200">
  <tr>
  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Basic Empty Weight</td>
  <td className="px-6 py-3">{activeResource?.basic_empty_weight}</td>
  <td className="px-6 py-3">-</td>
  <td className="px-6 py-3">{activeResource?.empty_moment}</td>
  </tr>
  <tr>
  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Front Seats</td>
  <td className="px-6 py-3">{calc?.frontSeats}</td>
  <td className="px-6 py-3">{activeResource?.arm_front_seats}</td>
  <td className="px-6 py-3">{(calc?.frontSeats * activeResource?.arm_front_seats || 0).toFixed(1)}</td>
  </tr>
  <tr>
  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Rear Seats</td>
  <td className="px-6 py-3">{inputs.rearSeats}</td>
  <td className="px-6 py-3">{activeResource?.arm_rear_seats}</td>
  <td className="px-6 py-3">{(inputs.rearSeats * activeResource?.arm_rear_seats || 0).toFixed(1)}</td>
  </tr>
  <tr>
  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Baggage 1</td>
  <td className="px-6 py-3">{inputs.baggage1}</td>
  <td className="px-6 py-3">{activeResource?.arm_baggage_1}</td>
  <td className="px-6 py-3">{(inputs.baggage1 * activeResource?.arm_baggage_1 || 0).toFixed(1)}</td>
  </tr>
  <tr className="bg-blue-50 dark:bg-blue-900/20 print:bg-slate-50">
  <td className="px-6 py-3 font-bold text-blue-900">Zero Fuel Weight</td>
  <td className="px-6 py-3 font-bold text-blue-900">{calc?.zfw?.toFixed(1)}</td>
  <td className="px-6 py-3">-</td>
  <td className="px-6 py-3">-</td>
  </tr>
  <tr>
  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Fuel ({inputs.fuelGallons} US Gal)</td>
  <td className="px-6 py-3">{calc?.fuelWeight?.toFixed(1)}</td>
  <td className="px-6 py-3">{activeResource?.arm_fuel}</td>
  <td className="px-6 py-3">{(calc?.fuelWeight * activeResource?.arm_fuel || 0).toFixed(1)}</td>
  </tr>
  <tr className="bg-slate-800 dark:bg-slate-700 text-white font-bold text-base border-t-2 border-slate-900 print:bg-white print:text-slate-900 print:border-slate-800">
  <td className="px-6 py-4">Takeoff Condition</td>
  <td className="px-6 py-4 text-blue-400 print:text-slate-900">{calc?.totalWeight.toFixed(1)} kg</td>
  <td className="px-6 py-4">CG: {calc?.cg.toFixed(2)}</td>
  <td className="px-6 py-4">{calc?.totalMoment.toFixed(1)}</td>
  </tr>
  </tbody>
  </table>
  </div>
  </div>

 {calc && (
 <div className="grid grid-cols-2 gap-6 print:gap-4 print:mt-4">
 <div className={`p-6 print:p-4 rounded-xl border ${calc.isWithinMTOW ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 print:bg-white print:border-slate-300 ' : 'bg-red-50 border-red-200'}`}>
 <div className="flex items-start">
 {calc.isWithinMTOW ? <CheckCircle2 className="w-8 h-8 text-emerald-500 mr-3 mt-1 print:hidden"/> : <AlertTriangle className="w-8 h-8 text-red-500 mr-3 mt-1"/>}
 <div>
 <h3 className={`font-bold text-lg ${calc.isWithinMTOW ? 'text-emerald-800 dark:text-emerald-300 print:text-slate-900 ' : 'text-red-800'}`}>Max Takeoff Weight</h3>
 <p className={`text-sm mt-1 ${calc.isWithinMTOW ? 'text-emerald-600 print:text-slate-600 ' : 'text-red-600 dark:text-red-400'}`}>
 {calc.isWithinMTOW ? `You are ${(activeResource.max_takeoff_weight - calc.totalWeight).toFixed(1)} kg under MTOW.` : `OVERWEIGHT BY ${(calc.totalWeight - activeResource.max_takeoff_weight).toFixed(1)} kg!`}
 </p>
 </div>
 </div>
 </div>

 <div className={`p-6 print:p-4 rounded-xl border ${calc.isWithinCG ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 print:bg-white print:border-slate-300 ' : 'bg-red-50 border-red-200'}`}>
 <div className="flex items-start">
 {calc.isWithinCG ? <CheckCircle2 className="w-8 h-8 text-emerald-500 mr-3 mt-1 print:hidden"/> : <AlertTriangle className="w-8 h-8 text-red-500 mr-3 mt-1"/>}
 <div>
 <h3 className={`font-bold text-lg ${calc.isWithinCG ? 'text-emerald-800 dark:text-emerald-300 print:text-slate-900 ' : 'text-red-800'}`}>Center of Gravity</h3>
 <p className={`text-sm mt-1 ${calc.isWithinCG ? 'text-emerald-600 print:text-slate-600 ' : 'text-red-600 dark:text-red-400'}`}>
 {calc.isWithinCG ? `CG at ${calc.cg.toFixed(2)} in. is within limits.` : `CG at ${calc.cg.toFixed(2)} in. is OUT OF LIMITS!`}
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Instructor Signature Area */}
  <div className="print:mt-8">
  {isSigned ? (
  <div className="bg-emerald-500/10 rounded-3xl border border-emerald-500/30 p-8 print:p-4 flex flex-col items-center justify-center shadow-sm py-12 text-center print:bg-white print:border-slate-300 print:shadow-none">
  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mb-6 print:hidden">
  <FileSignature className="w-10 h-10"/>
  </div>
  <h3 className="font-black text-emerald-800 dark:text-emerald-400 text-3xl tracking-tight mb-2 print:text-slate-900">Electronically Signed</h3>
  <p className="text-emerald-700 dark:text-emerald-500 font-bold tracking-wide print:text-slate-700">Signed by PIC for {activeResource.name}</p>
  <p className="text-xs text-emerald-600 dark:text-emerald-600/50 mt-4 font-mono print:text-slate-400">Hash: {existingMb.signature_hash}</p>
  </div>
  ) : canSign ? (
  <div className="liquid-glass rounded-3xl p-8 flex items-center justify-between print:hidden transition-all duration-300">
  <div>
  <h3 className="font-black text-slate-800 dark:text-white text-2xl tracking-tight mb-2">Pilot in Command E-Sign</h3>
  <p className="text-slate-500 dark:text-slate-400 font-medium">Verify the student's M&B calculation and sign below.</p>
  </div>
  <button 
  onClick={signDocument}
  disabled={signing}
  className="bg-indigo-600/90 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase flex items-center transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/30 backdrop-blur-md disabled:opacity-50"
  >
  <FileSignature className="w-5 h-5 mr-3"/> {signing ? 'Signing...' : 'Sign Document'}
  </button>
  </div>
  ) : null}
 
 {/* Print Only Empty Signature Block */}
 {!isSigned && (
 <div className="hidden print:block mt-12 border-t border-slate-400 pt-4 w-64">
 <p className="text-xs font-bold text-slate-800 dark:text-white uppercase text-center">PIC Signature</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
