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
  const [publicSettings, setPublicSettings] = useState({ app_name: 'FAMS', app_logo_url: '' });

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading profile...</p>
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
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
          active 
            ? 'bg-blue-600 text-white shadow-sm' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <div className="mesh-bg"></div>
      <div className="bg-noise"></div>
      
      <div className="min-h-screen flex relative z-10">    
        {/* Mobile Header */}
        <div className="print:hidden md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">FAMS</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div 
            className="print:hidden md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`print:hidden fixed md:relative z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">FAMS</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        
          {/* User Profile */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navigationGroups.map(group => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {/* Theme Switcher */}
            <div className="flex items-center justify-around bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setTheme('light')} 
                className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Light"
              >
                <Sun size={16} />
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`p-2 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="System"
              >
                <Monitor size={16} />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Dark"
              >
                <Moon size={16} />
              </button>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 print:p-0 print:max-w-none">
              <Toaster position="top-right" richColors className="print:hidden" />
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
                  <div className="glass-card p-12 rounded-xl text-center max-w-md mx-auto mt-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Plane size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
                    <p className="text-slate-600 dark:text-slate-400">This route does not exist.</p>
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
