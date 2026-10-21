import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

export const Navbar = () => {
  const { user, isAuthenticated, role, logout, login } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const handleQuickDemoLogin = async (email, password) => {
    try {
      await login(email, password);
      setDemoModalOpen(false);
      if (email.includes('candidate')) navigate('/candidate/dashboard');
      else if (email.includes('recruiter')) navigate('/recruiter/dashboard');
      else if (email.includes('admin')) navigate('/admin/dashboard');
    } catch (err) {
      console.error("Demo login error", err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Hire<span className="text-indigo-600">Sphere</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  to="/jobs" 
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
                >
                  Find Jobs
                </Link>
                <Link 
                  to="/jobs?is_featured=true" 
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
                >
                  Featured Roles
                </Link>
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Demo Accounts Pill */}
              <button
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200/70 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Demo Logins
              </button>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200/80"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
                      {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="text-left text-xs">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {user?.full_name || user?.email}
                      </div>
                      <div className="text-indigo-600 text-[10px] uppercase font-bold tracking-wider">
                        {role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="font-medium text-slate-900 truncate">{user?.email}</p>
                      </div>

                      {role === 'CANDIDATE' && (
                        <>
                          <Link 
                            to="/candidate/dashboard" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <User className="w-4 h-4" /> Candidate Dashboard
                          </Link>
                          <Link 
                            to="/candidate/applications" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <FileText className="w-4 h-4" /> My Applications
                          </Link>
                          <Link 
                            to="/candidate/resumes" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Briefcase className="w-4 h-4" /> Resume Manager
                          </Link>
                        </>
                      )}

                      {role === 'RECRUITER' && (
                        <>
                          <Link 
                            to="/recruiter/dashboard" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Building2 className="w-4 h-4" /> Recruiter Dashboard
                          </Link>
                          <Link 
                            to="/recruiter/jobs" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Briefcase className="w-4 h-4" /> Manage Jobs
                          </Link>
                          <Link 
                            to="/recruiter/applicants" 
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <User className="w-4 h-4" /> Review Applicants
                          </Link>
                        </>
                      )}

                      {(role === 'ADMIN' || user?.is_staff) && (
                        <Link 
                          to="/admin/dashboard" 
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <ShieldCheck className="w-4 h-4" /> Platform Admin
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200"
              >
                Demos
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 px-4 py-4 space-y-3 bg-white">
            <Link 
              to="/jobs" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block font-medium text-slate-700 py-1"
            >
              Find Jobs
            </Link>
            {isAuthenticated ? (
              <>
                {role === 'CANDIDATE' && (
                  <Link 
                    to="/candidate/dashboard" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block font-medium text-indigo-600 py-1"
                  >
                    Candidate Dashboard
                  </Link>
                )}
                {role === 'RECRUITER' && (
                  <Link 
                    to="/recruiter/dashboard" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block font-medium text-indigo-600 py-1"
                  >
                    Recruiter Dashboard
                  </Link>
                )}
                {(role === 'ADMIN' || user?.is_staff) && (
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block font-medium text-indigo-600 py-1"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block text-rose-600 font-medium py-1 w-full text-left"
                >
                  Sign Out ({user?.email})
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="w-full text-center py-2 text-slate-700 font-semibold border border-slate-200 rounded-xl"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="w-full text-center py-2 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Demo Accounts Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Instant 1-Click Demo Logins"
      >
        <p className="text-xs text-slate-500 mb-4">
          Click any persona below to authenticate automatically and explore role-specific workflows:
        </p>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700 mb-1">
                Candidate Seeker
              </span>
              <h4 className="font-semibold text-slate-900 text-sm">Alex Rivera</h4>
              <p className="text-xs text-slate-500">candidate1@example.com (Full Stack Dev)</p>
            </div>
            <button
              onClick={() => handleQuickDemoLogin('candidate1@example.com', 'CandidatePass123!')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Sign In As Alex
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-700 mb-1">
                Recruiter / Employer
              </span>
              <h4 className="font-semibold text-slate-900 text-sm">Marcus Brody</h4>
              <p className="text-xs text-slate-500">recruiter1@acme.com (Acme Cloud Systems)</p>
            </div>
            <button
              onClick={() => handleQuickDemoLogin('recruiter1@acme.com', 'RecruiterPass123!')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Sign In As Marcus
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-700 mb-1">
                Platform Administrator
              </span>
              <h4 className="font-semibold text-slate-900 text-sm">Eleanor Vance</h4>
              <p className="text-xs text-slate-500">admin@example.com (Platform Admin)</p>
            </div>
            <button
              onClick={() => handleQuickDemoLogin('admin@example.com', 'AdminPass123!')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Sign In As Admin
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
