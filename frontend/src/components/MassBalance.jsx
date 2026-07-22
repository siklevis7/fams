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
 } else {
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
  <div className="grid-layout print-area">
  <div className="print-hidden" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
  {activeResource && calc && (
  <button onClick={handlePrint} className="btn btn-secondary">
  <Printer size={20} style={{ marginRight: '0.5rem' }}/> Print A5
  </button>
  )}
  </div>
 
  {/* Interactive Form Section */}
  <div className="grid-col-form space-y-6 print-hidden">
  <div className="glass-card">
 <h2 className="form-title" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Select Aircraft</h2>
 <select 
 className="input-field mb-4"
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
 <label className="form-label">Instructor (PIC)</label>
 <select 
 className="input-field"
 value={selectedInstructorId}
 onChange={handleInstructorChange}
 >
 <option value="">-- No Instructor (Solo) --</option>
 {instructors.map(inst => (
 <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.weight} kg)</option>
 ))}
 </select>
 </div>

 <div className="mb-limits-box">
 <h3 className="mb-limits-title">Aircraft Limits</h3>
 <div className="mb-limit-row"><span>Basic Empty Wt:</span> <strong>{activeResource?.basic_empty_weight} kg</strong></div>
 <div className="mb-limit-row"><span>Max Takeoff Wt:</span> <strong>{activeResource?.max_takeoff_weight} kg</strong></div>
 </div>
 </div>
 )}
 </div>

 {/* Load Data */}
  <div className="glass-card" style={{ opacity: !activeResource ? 0.5 : 1, pointerEvents: !activeResource ? 'none' : 'auto' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
  <h2 className="form-title" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>2. Enter Load Data</h2>
 {isSigned && <span className="badge badge-success">Signed</span>}
 </div>
 
 <div className="space-y-4">
 <div>
 <label className="form-label">Front Seats (Auto-calculated)</label>
 <input type="number" readOnly value={getFrontSeatsWeight()} className="input-field" style={{ opacity: 0.7, cursor: 'not-allowed' }}/>
 <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Based on selected users' profile weights</p>
 </div>
 <div>
 <label className="form-label">Rear Seats (Pax) [kg]</label>
 <input type="number" name="rearSeats" value={inputs.rearSeats} onChange={handleInputChange} className="input-field" style={isSigned ? { borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' } : {}} />
 </div>
 <div>
 <label className="form-label">Baggage Area 1 [kg]</label>
 <input type="number" name="baggage1" value={inputs.baggage1} onChange={handleInputChange} className="input-field" style={isSigned ? { borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' } : {}} />
 </div>
  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1rem' }}>
  <label className="form-label" style={{ color: 'var(--color-primary)' }}>Fuel Load [US Gal]</label>
  <input type="number" name="fuelGallons" value={inputs.fuelGallons} onChange={handleInputChange} className={`mb-fuel-input ${isSigned ? 'signed' : ''}`} />
  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Calculated weight: {calc?.fuelWeight?.toFixed(1) || 0} kg</p>
  </div>         </div>
 
  {(!isSigned || existingMb === null) && (
  <button 
  onClick={saveMassBalance}
  disabled={saving}
  className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1rem' }}
  >
  <Save size={20} style={{ marginRight: '0.5rem' }}/> {saving ? 'Saving...' : 'Save & Share'}
  </button>
  )}
  </div>
  </div>

 {/* Printable Area */}
 <div className={`grid-col-list space-y-6 ${!activeResource && 'print-hidden'}`} style={!activeResource ? { display: 'none' } : {}}>
 
 {/* Printable Header */}
 <div className="mb-print-header">
 <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>KFMS</h1>
 <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'gray', textTransform: 'uppercase', margin: 0 }}>Official Mass & Balance computation</p>
 <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
 <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
 <div><strong>Aircraft:</strong> {activeResource?.name}</div>
 </div>
 </div>

  <div className=" glass-card" style={{ padding: 0 }}>
  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h2 className="form-title" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
  <Calculator size={24} style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }} className="print-hidden"/> Computation Sheet
  </h2>
 {existingMb && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved: {new Date(existingMb.created_at).toLocaleTimeString()}</span>}
 </div>
 
  <div style={{ overflowX: 'auto' }}>
  <table className="data-table">
  <thead>
  <tr>
  <th className="data-th">Item</th>
  <th className="data-th">Weight (kg)</th>
  <th className="data-th">Arm (in)</th>
  <th className="data-th">Moment</th>
  </tr>
  </thead>
  <tbody>
  <tr className="data-tr">
  <td className="data-td" style={{ fontWeight: '500' }}>Basic Empty Weight</td>
  <td className="data-td">{activeResource?.basic_empty_weight}</td>
  <td className="data-td">-</td>
  <td className="data-td">{activeResource?.empty_moment}</td>
  </tr>
  <tr className="data-tr">
  <td className="data-td" style={{ fontWeight: '500' }}>Front Seats</td>
  <td className="data-td">{calc?.frontSeats}</td>
  <td className="data-td">{activeResource?.arm_front_seats}</td>
  <td className="data-td">{(calc?.frontSeats * activeResource?.arm_front_seats || 0).toFixed(1)}</td>
  </tr>
  <tr className="data-tr">
  <td className="data-td" style={{ fontWeight: '500' }}>Rear Seats</td>
  <td className="data-td">{inputs.rearSeats}</td>
  <td className="data-td">{activeResource?.arm_rear_seats}</td>
  <td className="data-td">{(inputs.rearSeats * activeResource?.arm_rear_seats || 0).toFixed(1)}</td>
  </tr>
  <tr className="data-tr">
  <td className="data-td" style={{ fontWeight: '500' }}>Baggage 1</td>
  <td className="data-td">{inputs.baggage1}</td>
  <td className="data-td">{activeResource?.arm_baggage_1}</td>
  <td className="data-td">{(inputs.baggage1 * activeResource?.arm_baggage_1 || 0).toFixed(1)}</td>
  </tr>
  <tr className="data-tr" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
  <td className="data-td" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Zero Fuel Weight</td>
  <td className="data-td" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{calc?.zfw?.toFixed(1)}</td>
  <td className="data-td">-</td>
  <td className="data-td">-</td>
  </tr>
  <tr className="data-tr">
  <td className="data-td" style={{ fontWeight: '500' }}>Fuel ({inputs.fuelGallons} US Gal)</td>
  <td className="data-td">{calc?.fuelWeight?.toFixed(1)}</td>
  <td className="data-td">{activeResource?.arm_fuel}</td>
  <td className="data-td">{(calc?.fuelWeight * activeResource?.arm_fuel || 0).toFixed(1)}</td>
  </tr>
  <tr style={{ background: 'var(--bg-base)', borderTop: '2px solid var(--text-main)' }}>
  <td className="data-td" style={{ fontWeight: '700', padding: '1rem' }}>Takeoff Condition</td>
  <td className="data-td" style={{ fontWeight: '700', padding: '1rem', color: 'var(--color-primary)' }}>{calc?.totalWeight.toFixed(1)} kg</td>
  <td className="data-td" style={{ fontWeight: '700', padding: '1rem' }}>CG: {calc?.cg.toFixed(2)}</td>
  <td className="data-td" style={{ fontWeight: '700', padding: '1rem' }}>{calc?.totalMoment.toFixed(1)}</td>
  </tr>
  </tbody>
  </table>
  </div>
  </div>

 {calc && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
 <div className={`mb-limit-alert ${calc.isWithinMTOW ? 'success' : 'danger'}`}>
 {calc.isWithinMTOW ? <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} className="print-hidden"/> : <AlertTriangle size={32} style={{ color: 'var(--color-danger)' }}/>}
 <div>
 <h3 className="mb-limit-alert-title">Max Takeoff Weight</h3>
 <p className="mb-limit-alert-text">
 {calc.isWithinMTOW ? `You are ${(activeResource.max_takeoff_weight - calc.totalWeight).toFixed(1)} kg under MTOW.` : `OVERWEIGHT BY ${(calc.totalWeight - activeResource.max_takeoff_weight).toFixed(1)} kg!`}
 </p>
 </div>
 </div>

 <div className={`mb-limit-alert ${calc.isWithinCG ? 'success' : 'danger'}`}>
 {calc.isWithinCG ? <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} className="print-hidden"/> : <AlertTriangle size={32} style={{ color: 'var(--color-danger)' }}/>}
 <div>
 <h3 className="mb-limit-alert-title">Center of Gravity</h3>
 <p className="mb-limit-alert-text">
 {calc.isWithinCG ? `CG at ${calc.cg.toFixed(2)} in. is within limits.` : `CG at ${calc.cg.toFixed(2)} in. is OUT OF LIMITS!`}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Instructor Signature Area */}
  <div style={{ marginTop: '2rem' }}>
  {isSigned ? (
  <div className="mb-signature-block">
  <div className="mb-signature-icon-bg print-hidden">
  <FileSignature size={40}/>
  </div>
  <h3 style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--color-success)', marginBottom: '0.5rem' }}>Electronically Signed</h3>
  <p style={{ fontWeight: '700', color: 'var(--color-success)', opacity: 0.8 }}>Signed by PIC for {activeResource.name}</p>
  <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', opacity: 0.6, fontFamily: 'monospace', marginTop: '1rem' }}>Hash: {existingMb.signature_hash}</p>
  </div>
  ) : canSign ? (
  <div className=" print-hidden glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <div>
  <h3 className="form-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pilot in Command E-Sign</h3>
  <p style={{ color: 'var(--text-muted)' }}>Verify the student's M&B calculation and sign below.</p>
  </div>
  <button 
  onClick={signDocument}
  disabled={signing}
  className="btn btn-primary" style={{ padding: '1rem 2rem' }}
  >
  <FileSignature size={20} style={{ marginRight: '0.75rem' }}/> {signing ? 'Signing...' : 'Sign Document'}
  </button>
  </div>
  ) : null}
 
 {/* Print Only Empty Signature Block */}
 {!isSigned && (
 <div className="print-hidden" style={{ display: 'none' /* Handled by print css logic */ }}></div>
 )}
 </div>
 </div>
 </div>
 );
}
