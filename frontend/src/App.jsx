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
import SyllabusManagement from './components/SyllabusManagement.jsx'
import { Calendar, Users, Wrench, GraduationCap, Scale, Cloud, FileText, BarChart3, LogOut, Menu, X, ChevronLeft, ChevronRight, ClipboardList, ShieldAlert, Sun, Moon, Monitor, BookOpen } from 'lucide-react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { API_BASE } from './config';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('fams_token'));
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading profile...</div>
  }

  const renderNavItem = (path, Icon, label, allowedRoles) => {
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;
    
    const active = location.pathname === path || (path === '/' && location.pathname === '');
    return (
      <button 
        key={path}
        onClick={() => { navigate(path); setIsSidebarOpen(false); }}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'} rounded-xl mb-1 transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'}`}
        title={isCollapsed ? label : ''}
      >
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400'} flex-shrink-0`} />
        {!isCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
      </button>
    );
  };

  return (
    <>
    <div className="mesh-bg"></div>
    <div className="bg-noise"></div>
    <div className="min-h-screen flex flex-row font-sans transition-colors duration-500 relative z-10">    
      {/* Mobile Top Bar */}
      <div className="print:hidden md:hidden fixed top-0 left-0 right-0 h-16 liquid-glass-heavy z-40 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-800 dark:text-white p-2 -ml-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={24} />
          </button>
          {publicSettings.app_logo_url ? (
             <img src={publicSettings.app_logo_url} alt={publicSettings.app_name} className="h-6 ml-2 object-contain" />
          ) : (
             <span className="ml-2 font-bold text-slate-800 dark:text-white tracking-wider truncate max-w-[150px]">
               {publicSettings.app_name}
             </span>
          )}
        </div>
        <button 
           onClick={handleLogout}
           title="Logout"
           className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-xl transition-colors flex items-center font-bold text-sm border border-rose-500/30"
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="print:hidden md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`print:hidden fixed md:relative z-50 h-screen py-4 pl-4 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <aside className={`w-full h-full liquid-glass-sidebar rounded-3xl flex flex-col overflow-hidden`}>
          <div className={`p-6 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
            {!isCollapsed && (
              publicSettings.app_logo_url ? (
                <img src={publicSettings.app_logo_url} alt={publicSettings.app_name} className="h-8 max-w-[150px] object-contain" />
              ) : (
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight text-gradient">{publicSettings.app_name}</h1>
              )
            )}
            <div className="hidden md:block">
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-800 rounded-md">
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
               <X size={24} />
            </button>
          </div>
        
          <div className={`px-4 pb-4`}>
            <div 
              onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
              className={`flex items-center cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-300 ${isCollapsed ? 'justify-center p-2' : 'space-x-3 px-3 py-3'} rounded-2xl`}
              title="My Profile"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold uppercase shadow-sm shadow-indigo-500/30">
                {user.full_name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.full_name}</p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">{user.role}</p>
                </div>
              )}
            </div>
          </div>

          <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} overflow-y-auto sidebar-scrollbar mt-4 space-y-2`}>
            {renderNavItem('/', Calendar, 'Dispatch Calendar')}
            {renderNavItem('/roster', ClipboardList, 'Crew Roster', ["Administrator", "Operations Officer", "Instructor", "Examiner"])}
            {renderNavItem('/management', Users, 'Management', ["Administrator", "Operations Officer"])}
            {renderNavItem('/syllabus', BookOpen, 'Syllabus Management', ["Administrator", "Operations Officer"])}
            {renderNavItem('/maintenance', Wrench, 'Maintenance', ["Administrator", "Maintenance Engineer", "Operations Officer", "Instructor"])}
            {renderNavItem('/progress', GraduationCap, 'Student Progress', ["Administrator", "Instructor", "Examiner", "Student Pilot"])}
            
            <div className="pt-6 pb-2">
              {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Flight Ops</p>}
              {isCollapsed && <div className="border-t border-slate-200 dark:border-slate-800 mx-2 my-2"></div>}
            </div>
            {renderNavItem('/massbalance', Scale, 'Mass & Balance', ["Instructor", "Student Pilot", "Examiner"])}
            {renderNavItem('/weather', Cloud, 'Weather & NOTAMs', ["Administrator", "Operations Officer", "Instructor", "Student Pilot", "Examiner"])}
            
            <div className="pt-6 pb-2">
              {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Compliance</p>}
              {isCollapsed && <div className="border-t border-slate-200 dark:border-slate-800 mx-2 my-2"></div>}
            </div>
            {renderNavItem('/documents', FileText, 'Documents & E-Sign')}
            {renderNavItem('/compliance', ShieldAlert, 'Findings & Audits', ["Administrator", "Operations Officer"])}
            {renderNavItem('/reports', BarChart3, 'Reports & Analytics', ["Administrator", "Finance Officer", "Operations Officer"])}
          </nav>

          <div className={`p-4 mt-auto flex flex-col space-y-2`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col space-y-2' : 'justify-around'} bg-white/30 dark:bg-black/20 p-1 rounded-2xl text-slate-500 dark:text-slate-400 mb-2`}>
              <button onClick={() => setTheme('light')} className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'hover:text-indigo-600 dark:hover:text-white'}`} title="Light Theme"><Sun size={16} /></button>
              <button onClick={() => setTheme('system')} className={`p-2 rounded-xl transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'hover:text-indigo-600 dark:hover:text-white'}`} title="System Theme"><Monitor size={16} /></button>
              <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'hover:text-indigo-600 dark:hover:text-white'}`} title="Dark Theme"><Moon size={16} /></button>
            </div>
            <button 
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : ""}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-center space-x-2 py-3'} hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-2xl transition-all duration-300 font-bold`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
            </button>
          </div>
        </aside>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto pt-20 md:pt-4 px-4 md:px-8 pb-8 relative z-10 print:pt-0 print:px-0 print:h-auto print:overflow-visible">
        <Toaster position="top-right" richColors className="print:hidden" />
        <div className="max-w-7xl mx-auto w-full h-full print:max-w-none">
          <Routes>
            <Route path="/" element={<DispatchCalendar token={token} user={user} />} />
            <Route path="/roster" element={<CrewRoster token={token} user={user} />} />
            <Route path="/management" element={<Management token={token} user={user} />} />
            <Route path="/syllabus" element={<SyllabusManagement token={token} user={user} />} />
            <Route path="/maintenance" element={<Maintenance token={token} user={user} />} />
            <Route path="/progress" element={<StudentProgress token={token} user={user} />} />
            <Route path="/massbalance" element={<MassBalance token={token} user={user} />} />
            <Route path="/weather" element={<WeatherNotams token={token} user={user} />} />
            <Route path="/documents" element={<Documents token={token} user={user} />} />
            <Route path="/compliance" element={<ComplianceAudits token={token} user={user} />} />
            <Route path="/reports" element={<Reports token={token} user={user} />} />
            <Route path="/profile" element={<Profile token={token} user={user} />} />
            <Route path="*" element={
               <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-200 dark:border-slate-700 text-center mt-12 print:hidden">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
                     <Wrench size={32} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Page Not Found</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">This route does not exist.</p>
               </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
    </>
  )
}

export default App
