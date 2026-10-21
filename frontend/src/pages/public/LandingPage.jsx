import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Building2, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import api from '../../api/client';
import JobCard from '../../components/JobCard';
import { JobCardSkeleton } from '../../components/LoadingSkeleton';

export const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const res = await api.get('/jobs/?is_featured=true&page_size=4');
        setFeaturedJobs(res.data.results || []);
      } catch (err) {
        console.error("Error loading featured jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (locationTerm) params.append('location', locationTerm);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Next-Generation Multi-Vendor Recruitment Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Discover your next high-impact role at <span className="text-indigo-600">vetted tech companies</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Direct access to verified tech employers. Secure resume vault, transparent real-time application pipelines, and multi-vendor recruitment portals.
          </p>

          {/* Search Bar Form */}
          <form 
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-3 px-3 py-2 w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-slate-100">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, keywords, or skills..."
                className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 px-3 py-2 w-full sm:w-1/2">
              <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Location or 'Remote'..."
                className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-indigo-200 flex-shrink-0"
            >
              Search Jobs
            </button>
          </form>

          {/* Popular tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Popular searches:</span>
            {['React.js', 'Python', 'DevOps', 'PostgreSQL', 'Machine Learning', 'Remote'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigate(`/jobs?search=${tag}`)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Top Opportunities</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Featured Openings</h2>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Browse all openings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Platform Features / Roles Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Role-Based Architecture</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">Built for Candidates, Employers, and Administrators</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Candidate Experience</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Upload multiple resumes in PDF or DOCX format. Track every stage of your application with transparent audit timelines and instant status changes.
            </p>
            <Link to="/register" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Create Candidate Account →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Recruiter & Employer Portal</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Manage your company profile, post job openings, filter candidates by skills and experience, schedule interviews, and record private recruiter notes.
            </p>
            <Link to="/register" className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              Register as Employer →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Security & Isolation</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Strict multi-tenant company data isolation. Protected resume download endpoints preventing unauthorized data leaks and unauthenticated access.
            </p>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Enterprise-grade RBAC
            </span>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find top talent or your dream job?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Join leading cloud infrastructure, artificial intelligence, and digital health companies hiring right now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/jobs"
              className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition shadow-sm"
            >
              Browse All Jobs
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm"
            >
              Register Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
