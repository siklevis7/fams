import React, { useState } from 'react';
import { Plane, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../config';


const Login = ({ onLogin, publicSettings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      onLogin(data.access_token);
    } catch (err) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
         setError('Network error: Could not reach the server. Check your connection or API URL.');
      } else {
         setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/bg.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      <div className="mesh-bg opacity-30"></div>
      
      <div className="liquid-glass p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="bg-indigo-600/90 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/30 backdrop-blur-md transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Plane className="w-10 h-10 -rotate-12"/>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 text-gradient">FAMS.aero</h1>
          <p className="text-slate-300 font-medium">Flight & Aviation Management</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-2xl flex items-center backdrop-blur-md">
              <AlertCircle className="text-rose-400 w-6 h-6 mr-3 flex-shrink-0" />
              <p className="text-sm font-bold text-rose-200">{error}</p>
            </div>
          )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-black tracking-widest uppercase text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 text-white rounded-2xl font-bold placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  placeholder="pilot@fams.aero"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-black tracking-widest uppercase text-slate-300 mb-2">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-black/40 border border-white/10 text-white rounded-2xl font-bold placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 p-2"
                >
                  {showPassword ? (
                    <EyeOff className="h-6 w-6 text-slate-400 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-6 w-6 text-slate-400 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-600/30 text-base font-black tracking-widest uppercase text-white bg-indigo-600/90 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] backdrop-blur-md"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default Login;
