import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Award, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/applications/recruiter/dashboard-stats/');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load recruiter stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_jobs: 0,
    active_jobs: 0,
    total_applications: 0,
    under_review: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    offers: 0,
  };

  const statCards = [
    { label: 'Active Jobs', value: metrics.active_jobs, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total Applicants', value: metrics.total_applications, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Under Review', value: metrics.under_review, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Shortlisted', value: metrics.shortlisted, icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' },
    { label: 'Interviews Scheduled', value: metrics.interview_scheduled, icon: Calendar, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Offers Extended', value: metrics.offers, icon: Award, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const recentApplicants = data?.recent_applications || [];
  const company = data?.company || user?.company_details;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {company?.name || 'Recruiter Portal'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Recruiter & Employer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Publish openings, review applicant profiles, schedule interviews, and collaborate on hiring.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/recruiter/jobs/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
          <Link
            to="/recruiter/company"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Company Profile
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
              <div className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Applicants Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applicants</h2>
            <p className="text-xs text-slate-500">Candidates awaiting review and screening</p>
          </div>
          <Link
            to="/recruiter/applicants"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All applicants ({metrics.total_applications}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApplicants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applicants yet"
            description="Applications submitted to your company's jobs will show up here."
            actionText="Manage Jobs"
            onAction={() => window.location.href = '/recruiter/jobs'}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentApplicants.map((app) => (
              <div key={app.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/recruiter/applicants/${app.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {app.candidate_name}
                    </Link>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Applied for <strong className="text-slate-700">{app.job_title}</strong> · {app.candidate_headline || app.candidate_email} · {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  to={`/recruiter/applicants/${app.id}`}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition flex-shrink-0"
                >
                  Review Candidate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
