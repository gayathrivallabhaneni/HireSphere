import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/public/LandingPage';
import JobListingsPage from './pages/public/JobListingsPage';
import JobDetailPage from './pages/public/JobDetailPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Candidate pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import CandidateResumesPage from './pages/candidate/CandidateResumesPage';
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage';
import CandidateApplicationDetailPage from './pages/candidate/CandidateApplicationDetailPage';

// Recruiter pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CompanyProfilePage from './pages/recruiter/CompanyProfilePage';
import ManageJobsPage from './pages/recruiter/ManageJobsPage';
import CreateEditJobPage from './pages/recruiter/CreateEditJobPage';
import ApplicantsListPage from './pages/recruiter/ApplicantsListPage';
import ApplicantDetailPage from './pages/recruiter/ApplicantDetailPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCompaniesPage from './pages/admin/AdminCompaniesPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';

// Dashboard Layout with Sidebar
const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

// Public Layout
const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/jobs" element={<JobListingsPage />} />
            <Route path="/jobs/:slug" element={<JobDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Candidate Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/candidate/profile" element={<CandidateProfilePage />} />
              <Route path="/candidate/resumes" element={<CandidateResumesPage />} />
              <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
              <Route path="/candidate/applications/:id" element={<CandidateApplicationDetailPage />} />
            </Route>
          </Route>

          {/* Recruiter Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/company" element={<CompanyProfilePage />} />
              <Route path="/recruiter/jobs" element={<ManageJobsPage />} />
              <Route path="/recruiter/jobs/new" element={<CreateEditJobPage />} />
              <Route path="/recruiter/jobs/:id/edit" element={<CreateEditJobPage />} />
              <Route path="/recruiter/applicants" element={<ApplicantsListPage />} />
              <Route path="/recruiter/applicants/:id" element={<ApplicantDetailPage />} />
            </Route>
          </Route>

          {/* Admin Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/companies" element={<AdminCompaniesPage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={
              <div className="py-24 text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
                <p className="text-sm text-slate-500">Page not found.</p>
                <a href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
                  Go to Homepage
                </a>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
