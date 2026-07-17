import React, { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import DispatchCalendar from './components/DispatchCalendar.jsx'
import Management from './components/Management.jsx'
import Maintenance from './components/Maintenance.jsx'
import StudentProgress from './components/StudentProgress.jsx'
import MassBalance from './components/MassBalance.jsx'
import Profile from './components/Profile.jsx'
import CrewRoster from './components/CrewRoster.jsx'
import WeatherNotams from './components/WeatherNotams.jsx'
import Documents from './components/Documents.jsx'
import ComplianceAudits from './components/ComplianceAudits.jsx'
import Reports from './components/Reports.jsx'
import TechLog from './components/TechLog.jsx'
import SyllabusManagement from './components/SyllabusManagement.jsx'
import { Calendar, Users, Wrench, GraduationCap, Scale, Cloud, FileText, BarChart3, LogOut, Menu, X, ClipboardList, ShieldAlert, Sun, Moon, Monitor, BookOpen, Plane } from 'lucide-react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { API_BASE } from './config';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('fams_token'));
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('fams_theme') || 'system');
  const [publicSettings, setPublicSettings] = useState({ app_name: 'KFMS', app_logo_url: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/public`)
      .then(res => res.json())
      .then(data => setPublicSettings(data))
      .catch(err => console.error("Could not fetch public settings:", err));
  }, []);

  useEffect(() => {
    const applyTheme = (t) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      if (t === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) root.classList.add('dark');
      } else {
        root.classList.add(t);
      }
    };
    applyTheme(theme);
    localStorage.setItem('fams_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          handleLogout();
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error(err));
    }
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('fams_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('fams_token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} publicSettings={publicSettings} />
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  const navigationGroups = [
    {
      title: "Operations",
      items: [
        { path: '/', icon: Calendar, label: 'Dispatch Calendar' },
        { path: '/roster', icon: ClipboardList, label: 'Crew Roster', roles: ["Administrator", "Operations Officer", "Instructor", "Examiner"] },
        { path: '/management', icon: Users, label: 'Management', roles: ["Administrator", "Operations Officer"] },
        { path: '/syllabus', icon: BookOpen, label: 'Syllabus', roles: ["Administrator", "Operations Officer"] },
      ]
    },
    {
      title: "Maintenance",
      items: [
        { path: '/maintenance', icon: Wrench, label: 'Aircraft Status', roles: ["Administrator", "Maintenance Engineer", "Operations Officer", "Instructor"] },
      ]
    },
    {
      title: "Training",
      items: [
        { path: '/progress', icon: GraduationCap, label: 'Student Progress', roles: ["Administrator", "Instructor", "Examiner", "Student Pilot"] },
        { path: '/massbalance', icon: Scale, label: 'Mass & Balance', roles: ["Instructor", "Student Pilot", "Examiner"] },
        { path: '/weather', icon: Cloud, label: 'Weather & NOTAMs', roles: ["Administrator", "Operations Officer", "Instructor", "Student Pilot", "Examiner"] },
        { path: '/techlog', icon: FileText, label: 'Tech Log', roles: ["Instructor", "Student Pilot", "Examiner"] },
      ]
    },
    {
      title: "Compliance",
      items: [
        { path: '/documents', icon: FileText, label: 'Documents' },
        { path: '/compliance', icon: ShieldAlert, label: 'Audits & Findings', roles: ["Administrator", "Operations Officer"] },
        { path: '/reports', icon: BarChart3, label: 'Analytics', roles: ["Administrator", "Finance Officer", "Operations Officer"] },
      ]
    }
  ];

  const renderNavItem = (item) => {
    if (item.roles && !item.roles.includes(user.role)) return null;
    
    const active = location.pathname === item.path || (item.path === '/' && location.pathname === '');
    const Icon = item.icon;
    
    return (
      <button 
        key={item.path}
        onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
        className={`nav-item ${active ? 'active' : ''}`}
      >
        <Icon size={18} className="nav-icon" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <div className="mesh-bg"></div>
      <div className="bg-noise"></div>
      
      <div className="app-container">    
        {/* Mobile Header */}
        <div className="app-header-mobile">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="icon-btn"
            >
              <Menu size={20} />
            </button>
            <div className="sidebar-logo" style={{ fontSize: '1rem' }}>
              <Plane size={20} color="var(--color-primary)" />
              <span>KFMS</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="icon-btn"
            style={{ color: 'var(--color-danger)' }}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* Logo Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Plane size={24} color="var(--color-primary)" />
              <span>KFMS</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="icon-btn md:hidden"
              style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}
            >
              <X size={18} />
            </button>
          </div>
        
          {/* User Profile */}
          <div className="sidebar-user">
            <button
              onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
              className="user-card"
            >
              <div className="user-avatar">
                {user.full_name.charAt(0)}
              </div>
              <div className="user-info">
                <p className="user-name">{user.full_name}</p>
                <p className="user-role">{user.role}</p>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {navigationGroups.map(group => {
              const items = group.items.map(renderNavItem).filter(Boolean);
              if (items.length === 0) return null;
              return (
                <div key={group.title} className="mb-6">
                  <h3 className="nav-group-title">{group.title}</h3>
                  <div className="flex flex-col">
                    {items}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            {/* Theme Switcher */}
            <div className="theme-switcher">
              <button 
                onClick={() => setTheme('light')} 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                title="Light"
              >
                <Sun size={16} />
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                title="System"
              >
                <Monitor size={16} />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                title="Dark"
              >
                <Moon size={16} />
              </button>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      
        {/* Main Content */}
        <main className="main-content">
          <div className="content-scroll">
            <div className="content-inner">
              <Toaster position="top-right" richColors />
              <Routes>
                <Route path="/" element={<DispatchCalendar token={token} user={user} />} />
                <Route path="/roster" element={<CrewRoster token={token} user={user} />} />
                <Route path="/management" element={<Management token={token} user={user} />} />
                <Route path="/syllabus" element={<SyllabusManagement token={token} user={user} />} />
                <Route path="/maintenance" element={<Maintenance token={token} user={user} />} />
                <Route path="/progress" element={<StudentProgress token={token} user={user} />} />
                <Route path="/massbalance" element={<MassBalance token={token} user={user} />} />
                <Route path="/weather" element={<WeatherNotams token={token} user={user} />} />
                <Route path="/techlog" element={<TechLog token={token} user={user} />} />
                <Route path="/documents" element={<Documents token={token} user={user} />} />
                <Route path="/compliance" element={<ComplianceAudits token={token} user={user} />} />
                <Route path="/reports" element={<Reports token={token} user={user} />} />
                <Route path="/profile" element={<Profile token={token} user={user} />} />
                <Route path="*" element={
                  <div className="glass-card text-center" style={{ maxWidth: '400px', margin: '3rem auto' }}>
                    <div style={{ width: '4rem', height: '4rem', background: 'var(--bg-card-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      <Plane size={32} color="var(--text-muted)" />
                    </div>
                    <h2 className="text-heading" style={{ fontSize: '1.25rem' }}>Page Not Found</h2>
                    <p style={{ color: 'var(--text-muted)' }}>This route does not exist.</p>
                  </div>
                } />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
