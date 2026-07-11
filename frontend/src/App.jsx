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
import { Calendar, Users, Wrench, GraduationCap, Scale, Cloud, FileText, BarChart3, LogOut, Menu, X, ChevronLeft, ChevronRight, ClipboardList, ShieldAlert, Sun, Moon, Monitor } from 'lucide-react'
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
        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'} rounded-lg mb-1 transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        title={isCollapsed ? label : ''}
      >
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400'} flex-shrink-0`} />
        {!isCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-row font-sans transition-colors duration-200">
      
      {/* Mobile Overlay button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-md shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 ${isCollapsed ? 'w-20' : 'w-72'} h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className={`p-6 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
          {!isCollapsed && (
            publicSettings.app_logo_url ? (
              <img src={publicSettings.app_logo_url} alt={publicSettings.app_name} className="h-8 max-w-[150px] object-contain" />
            ) : (
              <h1 className="text-2xl font-bold text-white tracking-wider">{publicSettings.app_name}</h1>
            )
          )}
          <div className="hidden md:block">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-800 rounded-md">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
             <X size={24} />
          </button>
        </div>
        
        <div className={`px-4 pb-4`}>
          <div 
            onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
            className={`flex items-center cursor-pointer hover:bg-slate-700 transition-colors ${isCollapsed ? 'justify-center p-2' : 'space-x-3 px-3 py-3'} bg-slate-800 rounded-lg border border-slate-700`}
            title="My Profile"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold uppercase">
              {user.full_name.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-xs text-blue-400 truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} overflow-y-auto sidebar-scrollbar mt-2 space-y-1`}>
          {renderNavItem('/', Calendar, 'Dispatch Calendar')}
          {renderNavItem('/roster', ClipboardList, 'Crew Roster', ["Administrator", "Operations Officer", "Instructor", "Examiner"])}
          {renderNavItem('/management', Users, 'Management', ["Administrator", "Operations Officer"])}
          {renderNavItem('/maintenance', Wrench, 'Maintenance', ["Administrator", "Maintenance Engineer", "Operations Officer", "Instructor"])}
          {renderNavItem('/progress', GraduationCap, 'Student Progress', ["Administrator", "Instructor", "Examiner", "Student Pilot"])}
          
          <div className="pt-4 pb-2">
            {!isCollapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Flight Ops</p>}
            {isCollapsed && <div className="border-t border-slate-800 mx-2 my-2"></div>}
          </div>
          {renderNavItem('/massbalance', Scale, 'Mass & Balance', ["Instructor", "Student Pilot", "Examiner"])}
          {renderNavItem('/weather', Cloud, 'Weather & NOTAMs', ["Administrator", "Operations Officer", "Instructor", "Student Pilot", "Examiner"])}
          
          <div className="pt-4 pb-2">
            {!isCollapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance</p>}
            {isCollapsed && <div className="border-t border-slate-800 mx-2 my-2"></div>}
          </div>
          {renderNavItem('/documents', FileText, 'Documents & E-Sign')}
          {renderNavItem('/compliance', ShieldAlert, 'Findings & Audits', ["Administrator", "Operations Officer"])}
          {renderNavItem('/reports', BarChart3, 'Reports & Analytics', ["Administrator", "Finance Officer", "Operations Officer"])}
        </nav>

        <div className={`p-4 border-t border-slate-800 flex flex-col space-y-2`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col space-y-2' : 'justify-around'} bg-slate-800 p-1 rounded-lg text-slate-400 mb-2`}>
            <button onClick={() => setTheme('light')} className={`p-2 rounded-md ${theme === 'light' ? 'bg-slate-700 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'}`} title="Light Theme"><Sun size={16} /></button>
            <button onClick={() => setTheme('system')} className={`p-2 rounded-md ${theme === 'system' ? 'bg-slate-700 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'}`} title="System Theme"><Monitor size={16} /></button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'}`} title="Dark Theme"><Moon size={16} /></button>
          </div>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-center space-x-2 py-3'} bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 print:pt-0 print:h-auto print:overflow-visible relative">
        <Toaster position="top-right" richColors />
        <div className="p-4 md:p-8 max-w-7xl mx-auto print:p-0">
          <Routes>
            <Route path="/" element={<DispatchCalendar token={token} user={user} />} />
            <Route path="/roster" element={<CrewRoster token={token} user={user} />} />
            <Route path="/management" element={<Management token={token} user={user} />} />
            <Route path="/maintenance" element={<Maintenance token={token} user={user} />} />
            <Route path="/progress" element={<StudentProgress token={token} user={user} />} />
            <Route path="/massbalance" element={<MassBalance token={token} user={user} />} />
            <Route path="/weather" element={<WeatherNotams token={token} user={user} />} />
            <Route path="/documents" element={<Documents token={token} user={user} />} />
            <Route path="/compliance" element={<ComplianceAudits token={token} user={user} />} />
            <Route path="/reports" element={<Reports token={token} user={user} />} />
            <Route path="/profile" element={<Profile token={token} user={user} />} />
            <Route path="*" element={
               <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center mt-12 print:hidden">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-4">
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
  )
}

export default App
