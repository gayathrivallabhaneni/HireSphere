import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  PlusCircle, 
  Eye, 
  Users, 
  Edit3, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export const ManageJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/jobs/recruiter/?status=${statusFilter}`
        : '/jobs/recruiter/';
      const res = await api.get(url);
      setJobs(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load recruiter jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/recruiter/${jobId}/status/`, { status: newStatus });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      setActionSuccess(`Job status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError("Failed to update status.");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company Job Openings</h1>
          <p className="text-xs text-slate-500">
            Publish, edit, pause, and review candidate pipelines for your listings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Get started by posting your first job opening to attract top candidates."
              actionText="Post a New Job"
              onAction={() => window.location.href = '/recruiter/jobs/new'}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-slate-50/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/jobs/${job.slug}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location} ({job.work_mode})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {job.applications_count || 0} applicants
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {job.views_count || 0} views
                    </span>
                    <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {/* Status Toggle Dropdown */}
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <Link
                    to={`/recruiter/applicants?job=${job.id}`}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> Applicants
                  </Link>

                  <Link
                    to={`/recruiter/jobs/${job.id}/edit`}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                    title="Edit Job"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJobsPage;
