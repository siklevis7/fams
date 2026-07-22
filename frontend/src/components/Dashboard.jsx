import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, Wrench, GraduationCap, Scale, Cloud, 
  FileText, BarChart3, ClipboardList, ShieldAlert, BookOpen 
} from 'lucide-react';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const modules = [
    {
      title: 'Dispatch Calendar',
      description: 'View and manage flight schedules and resources.',
      icon: Calendar,
      path: '/calendar',
      roles: null // Accessible to all
    },
    {
      title: 'Crew Roster',
      description: 'Manage assignments and track duty hours.',
      icon: ClipboardList,
      path: '/roster',
      roles: ['Administrator', 'Operations Officer', 'Instructor', 'Examiner']
    },
    {
      title: 'Management',
      description: 'Manage users and platform resources.',
      icon: Users,
      path: '/management',
      roles: ['Administrator', 'Operations Officer']
    },
    {
      title: 'Syllabus',
      description: 'Configure training sorties and curriculum.',
      icon: BookOpen,
      path: '/syllabus',
      roles: ['Administrator', 'Operations Officer']
    },
    {
      title: 'Aircraft Status',
      description: 'Track fleet maintenance and active squawks.',
      icon: Wrench,
      path: '/maintenance',
      roles: ['Administrator', 'Maintenance Engineer', 'Operations Officer', 'Instructor']
    },
    {
      title: 'Student Progress',
      description: 'Monitor flight grading and training milestones.',
      icon: GraduationCap,
      path: '/progress',
      roles: ['Administrator', 'Instructor', 'Examiner', 'Student Pilot']
    },
    {
      title: 'Mass & Balance',
      description: 'Calculate and sign off on aircraft loading.',
      icon: Scale,
      path: '/massbalance',
      roles: ['Instructor', 'Student Pilot', 'Examiner']
    },
    {
      title: 'Weather & NOTAMs',
      description: 'Review aviation weather and airport notices.',
      icon: Cloud,
      path: '/weather',
      roles: ['Administrator', 'Operations Officer', 'Instructor', 'Student Pilot', 'Examiner']
    },
    {
      title: 'Tech Log',
      description: 'Submit post-flight logs and track flight times.',
      icon: FileText,
      path: '/techlog',
      roles: ['Instructor', 'Student Pilot', 'Examiner']
    },
    {
      title: 'Documents',
      description: 'Manage medicals, licenses, and digital signatures.',
      icon: FileText,
      path: '/documents',
      roles: null // Accessible to all
    },
    {
      title: 'Audits & Findings',
      description: 'Track compliance and manage safety observations.',
      icon: ShieldAlert,
      path: '/compliance',
      roles: ['Administrator', 'Operations Officer']
    },
    {
      title: 'Analytics',
      description: 'View fleet utilization and operational reports.',
      icon: BarChart3,
      path: '/reports',
      roles: ['Administrator', 'Finance Officer', 'Operations Officer']
    }
  ];

  // Filter modules based on user role
  const accessibleModules = modules.filter(
    (mod) => !mod.roles || mod.roles.includes(user.role)
  );

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div 
        className={`fade-in-up`} 
        style={{ 
          opacity: mounted ? 1 : 0, 
          transform: mounted ? 'translateY(0)' : 'translateY(15px)', 
          transition: 'all 0.5s ease' 
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="text-heading">Welcome back, {user.full_name.split(' ')[0]}</h1>
          <p className="text-subheading">Select a module below to get started.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {accessibleModules.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <div 
                key={mod.path}
                className="glass-card"
                onClick={() => navigate(mod.path)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  animationDelay: `${index * 0.05}s`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(15px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.querySelector('.icon-wrapper').style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))';
                  e.currentTarget.querySelector('.icon-wrapper').style.color = 'white';
                  e.currentTarget.querySelector('.icon-wrapper').style.boxShadow = 'var(--shadow-glow)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.querySelector('.icon-wrapper').style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.querySelector('.icon-wrapper').style.color = 'var(--color-primary)';
                  e.currentTarget.querySelector('.icon-wrapper').style.boxShadow = 'none';
                }}
              >
                <div 
                  className="icon-wrapper"
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                    border: '1px solid var(--border-light)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {mod.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.5s ease forwards;
        }
      `}} />
    </div>
  );
};

export default Dashboard;
