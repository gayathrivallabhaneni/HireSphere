import React, { useState, useEffect } from 'react';
import { Briefcase, Search, CheckCircle2, AlertCircle, Eye, Users } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin-portal/jobs/?${params.toString()}`);
      setJobs(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleModerate = async (jobId, newStatus) => {
    try {
      const res = await api.patch(`/admin-portal/jobs/${jobId}/moderate/`, {
        status: newStatus
      });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: res.data.status } : j));
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Failed to moderate job.");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Job Moderation</h1>
        <p className="text-xs text-slate-500">
          Audit listings, remove spam or inappropriate postings, and manage publication states
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, company name, or location..."
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Closed</option>
              <option value="ARCHIVED">Archived (Moderated)</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Briefcase} title="No jobs found" description="No postings match your query." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Job Opening</th>
                  <th className="py-3 px-6">Company & Recruiter</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Metrics</th>
                  <th className="py-3 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-medium">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-[11px] text-slate-400">{job.location} · {job.work_mode}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{job.company_name}</div>
                      <div className="text-[11px] text-slate-400">{job.recruiter_email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>{job.applications_count || 0} applicants</div>
                      <div className="text-[11px] text-slate-400">{job.views_count || 0} views</div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {job.status === 'ARCHIVED' ? (
                        <button
                          onClick={() => handleModerate(job.id, 'PUBLISHED')}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition"
                        >
                          Restore to Published
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerate(job.id, 'ARCHIVED')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition"
                        >
                          Archive / Moderate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJobsPage;
