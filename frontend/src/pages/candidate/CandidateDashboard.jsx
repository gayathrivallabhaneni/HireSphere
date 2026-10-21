import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Award, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/applications/candidate/dashboard-stats/');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load candidate stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = stats?.metrics || {
    total_applications: 0,
    under_review: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    offers_received: 0,
    rejected: 0,
  };

  const statCards = [
    { label: 'Total Submitted', value: metrics.total_applications, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Under Review', value: metrics.under_review, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Shortlisted', value: metrics.shortlisted, icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Interviews Scheduled', value: metrics.interview_scheduled, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    { label: 'Job Offers', value: metrics.offers_received, icon: Award, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Not Selected', value: metrics.rejected, icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  ];

  const recentApps = stats?.recent_applications || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Candidate Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Welcome back, {user?.first_name || 'Candidate'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Track your pipeline status, manage resumes, and explore recommended opportunities.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/jobs"
            className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-slate-100 font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Find New Roles
          </Link>
          <Link
            to="/candidate/resumes"
            className="px-4 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 text-white border border-indigo-400/40 font-semibold text-xs rounded-xl transition"
          >
            Upload Resume
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
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

      {/* Recent Applications Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-500">Live status updates from hiring companies</p>
          </div>
          <Link
            to="/candidate/applications"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all ({metrics.total_applications}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications submitted yet"
            description="Browse published job openings to submit your first application."
            actionText="Browse Jobs"
            onAction={() => window.location.href = '/jobs'}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentApps.map((app) => (
              <div key={app.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/candidate/applications/${app.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {app.job?.title}
                    </Link>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {app.job?.company?.name} · {app.job?.location} · Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  to={`/candidate/applications/${app.id}`}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition flex-shrink-0"
                >
                  View Details & History
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;
