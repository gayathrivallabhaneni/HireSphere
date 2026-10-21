import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Shield, Terminal } from 'lucide-react';
import { GithubIcon } from './SocialIcons';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Hire<span className="text-indigo-600">Sphere</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Production-oriented multi-vendor recruitment and talent acquisition platform with dedicated candidate, recruiter, and moderation workflows.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">For Candidates</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/jobs" className="hover:text-indigo-600">Browse Openings</Link></li>
              <li><Link to="/candidate/dashboard" className="hover:text-indigo-600">Candidate Portal</Link></li>
              <li><Link to="/candidate/resumes" className="hover:text-indigo-600">Resume Vault</Link></li>
              <li><Link to="/candidate/applications" className="hover:text-indigo-600">Application Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">For Employers</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/recruiter/dashboard" className="hover:text-indigo-600">Employer Portal</Link></li>
              <li><Link to="/recruiter/jobs/new" className="hover:text-indigo-600">Post Job Opening</Link></li>
              <li><Link to="/recruiter/applicants" className="hover:text-indigo-600">Review Applications</Link></li>
              <li><Link to="/recruiter/company" className="hover:text-indigo-600">Company Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">API & Docs</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a href="http://localhost:8000/api/docs/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
                  <Terminal className="w-3.5 h-3.5" /> Swagger OpenAPI
                </a>
              </li>
              <li>
                <a href="http://localhost:8000/admin/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
                  <Shield className="w-3.5 h-3.5" /> Django Admin
                </a>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-indigo-600">
                  Platform Moderation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} HireSphere Multi-Vendor Job Board. Production Grade.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>PostgreSQL · Django REST · React Vite · Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
