import React, { useState, useEffect } from 'react';
import { Plane, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../config';

const Login = ({ onLogin, publicSettings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
         setError('Network error: Could not reach the server.');
      } else {
         setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Dynamic Background */}
      <div className="mesh-bg" style={{ opacity: 0.4 }}></div>
      <div className="bg-noise"></div>
      
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'var(--color-primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, animation: 'float 10s infinite ease-in-out' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '250px', height: '250px', background: 'var(--color-accent)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, animation: 'float 8s infinite ease-in-out reverse' }}></div>
      
      <div className={`login-card ${mounted ? 'fade-in-up' : ''}`} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="text-center mb-8">
          <div className="login-icon-container" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -5, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', borderRadius: 'inherit', filter: 'blur(10px)', opacity: 0.5 }}></div>
            <Plane className="login-icon" style={{ position: 'relative', zIndex: 2 }} />
          </div>
          <h1 className="login-title">Welcome to KFMS</h1>
          <p className="login-subtitle">Kigali Flight Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-alert fade-in-up" style={{ animationDuration: '0.3s' }}>
              <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
            
          <div className="form-group mb-6">
            <label htmlFor="email" className="form-label text-subheading" style={{ fontSize: '0.85rem' }}>
              Email Address
            </label>
            <div className="input-icon-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field input-with-icon"
                placeholder="admin@kfms.rw"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          
          <div className="form-group mb-8">
            <label htmlFor="password" className="form-label text-subheading" style={{ fontSize: '0.85rem' }}>
              Password
            </label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field input-with-icon"
                placeholder="Enter your password"
                style={{ paddingRight: '2.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              fontSize: '1rem', 
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ShieldCheck size={18} />
              </span>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p>Secure Operations Portal</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default Login;

