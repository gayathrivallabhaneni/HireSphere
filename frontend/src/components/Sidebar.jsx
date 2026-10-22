import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  User, 
  Building2, 
  Users, 
  PlusCircle, 
  ShieldCheck, 
  Layers,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiDocsUrl } from '../api/client';

export const Sidebar = () => {
  const { role, user } = useAuth();

  const candidateLinks = [
    { to: '/candidate/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/candidate/applications', label: 'My Applications', icon: FileText },
    { to: '/candidate/resumes', label: 'Resume Vault', icon: Layers },
    { to: '/candidate/profile', label: 'Profile Settings', icon: User },
    { to: '/jobs', label: 'Explore Jobs', icon: Search },
  ];

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Manage Jobs', icon: Briefcase },
    { to: '/recruiter/jobs/new', label: 'Post a New Job', icon: PlusCircle },
    { to: '/recruiter/applicants', label: 'All Applicants', icon: Users },
    { to: '/recruiter/company', label: 'Company Profile', icon: Building2 },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Platform Stats', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users Management', icon: Users },
    { to: '/admin/companies', label: 'Companies Review', icon: Building2 },
    { to: '/admin/jobs', label: 'Job Moderation', icon: Briefcase },
  ];

  let links = [];
  let portalTitle = 'Dashboard';

  if (role === 'CANDIDATE') {
    links = candidateLinks;
    portalTitle = 'Candidate Portal';
  } else if (role === 'RECRUITER') {
    links = recruiterLinks;
    portalTitle = user?.company_details?.name || 'Recruiter Portal';
  } else if (role === 'ADMIN' || user?.is_staff) {
    links = adminLinks;
    portalTitle = 'Administration';
  }

  return (
    <>
      {/* Mobile / Tablet Horizontal Navigation Scrollbar */}
      <div className="md:hidden bg-white border-b border-slate-200/90 px-4 py-2.5 overflow-x-auto flex items-center gap-2 sticky top-16 z-30 shadow-xs">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/candidate/dashboard' || item.to === '/recruiter/dashboard' || item.to === '/admin/dashboard' || item.to === '/recruiter/jobs'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/90 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="px-3 py-2 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {portalTitle}
            </p>
            <p className="text-xs text-slate-700 font-semibold truncate">
              {user?.full_name || user?.email}
            </p>
          </div>

          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/candidate/dashboard' || item.to === '/recruiter/dashboard' || item.to === '/admin/dashboard' || item.to === '/recruiter/jobs'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-0.5">Need help?</p>
          <p className="text-[11px] leading-relaxed">Check Swagger API documentation at <a href={getApiDocsUrl()} target="_blank" rel="noreferrer" className="text-indigo-600 underline">/api/docs</a></p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
