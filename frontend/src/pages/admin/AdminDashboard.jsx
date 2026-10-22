import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Terminal,
  ExternalLink
} from 'lucide-react';
import api, { getApiDocsUrl, getAdminUrl } from '../../api/client';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/admin-portal/stats/');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.users?.total || 0, sub: `${stats?.users?.candidates || 0} candidates · ${stats?.users?.recruiters || 0} recruiters`, icon: Users, color: 'text-blue-600 bg-blue-50', link: '/admin/users' },
    { label: 'Registered Companies', value: stats?.companies?.total || 0, sub: `${stats?.companies?.verified || 0} verified`, icon: Building2, color: 'text-purple-600 bg-purple-50', link: '/admin/companies' },
    { label: 'Active Jobs', value: stats?.jobs?.active || 0, sub: `${stats?.jobs?.total || 0} total listings`, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50', link: '/admin/jobs' },
    { label: 'Applications Submitted', value: stats?.applications?.total || 0, sub: 'Across all companies', icon: FileText, color: 'text-emerald-600 bg-emerald-50', link: '#' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Platform Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Platform Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Oversee user accounts, company verifications, job moderation, and system health.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={getAdminUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            Django Admin <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={getApiDocsUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" /> OpenAPI Docs
          </a>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                {card.link !== '#' && (
                  <Link to={card.link} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                    Manage <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{card.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/admin/users" 
          className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
            User Accounts Management
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review candidate and recruiter accounts. Activate or suspend accounts violating platform guidelines.
          </p>
        </Link>

        <Link 
          to="/admin/companies" 
          className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Company Moderation & Verification
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify employer credentials, issue verification badges, and moderate company profiles.
          </p>
        </Link>

        <Link 
          to="/admin/jobs" 
          className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Job Posting Moderation
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Audit job postings across all vendors. Archive or moderate inappropriate or misleading listings.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
