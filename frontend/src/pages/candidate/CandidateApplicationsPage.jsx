import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  MapPin, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

export const CandidateApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/applications/candidate/my-applications/?status=${statusFilter}`
        : '/applications/candidate/my-applications/';
      const res = await api.get(url);
      setApplications(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      await api.post(`/applications/candidate/my-applications/${selectedApp.id}/withdraw/`, {
        notes: withdrawReason || 'Withdrawn by candidate.'
      });
      setActionSuccess("Application withdrawn successfully.");
      setWithdrawModalOpen(false);
      setSelectedApp(null);
      setWithdrawReason('');
      fetchApplications();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to withdraw application.";
      setActionError(msg);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Job Applications</h1>
          <p className="text-xs text-slate-500">
            Monitor review stages, interview schedules, and hiring feedback
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="OFFERED">Offered</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
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

      {/* Applications List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title="No applications found"
              description={statusFilter ? `No applications with status '${statusFilter}'.` : "You haven't submitted any job applications yet."}
              actionText="Search Open Roles"
              onAction={() => window.location.href = '/jobs'}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const canWithdraw = ['APPLIED', 'UNDER_REVIEW'].includes(app.status);
              return (
                <div key={app.id} className="p-6 hover:bg-slate-50/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/candidate/applications/${app.id}`}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                      >
                        {app.job?.title}
                      </Link>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.job?.company?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {app.job?.location}
                      </span>
                      <span>Submitted on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>

                    {app.resume && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Resume attached:</span>
                        <span className="font-semibold text-slate-600">{app.resume.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
                    <Link
                      to={`/candidate/applications/${app.id}`}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-4 h-4" /> Timeline & Details
                    </Link>

                    {canWithdraw && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setWithdrawModalOpen(true);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw Application"
      >
        <form onSubmit={handleWithdraw} className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to withdraw your application for{' '}
            <strong className="text-slate-900">{selectedApp?.job?.title}</strong> at{' '}
            <strong className="text-slate-900">{selectedApp?.job?.company?.name}</strong>?
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reason / Comment (Optional)
            </label>
            <textarea
              rows={3}
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="e.g. Accepted another offer, relocation change..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Confirm Withdrawal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CandidateApplicationsPage;
