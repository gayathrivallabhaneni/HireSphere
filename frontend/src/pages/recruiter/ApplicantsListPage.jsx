import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  MessageSquare, 
  ArrowRight,
  Briefcase 
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export const ApplicantsListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [applicants, setApplications] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

  // Fetch company jobs for the dropdown
  useEffect(() => {
    const fetchCompanyJobs = async () => {
      try {
        const res = await api.get('/jobs/recruiter/');
        setJobsList(res.data.results || res.data || []);
      } catch (err) {
        console.error("Failed to load company jobs list", err);
      }
    };
    fetchCompanyJobs();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedJob) params.append('job', selectedJob);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/applications/recruiter/applications/?${params.toString()}`);
      setApplications(res.data.results || res.data || []);
      setSearchParams(params);
    } catch (err) {
      console.error("Failed to load applicants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [selectedJob, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplicants();
  };

  const handleDownloadResume = async (resumeId, originalFilename) => {
    try {
      const res = await api.get(`/candidates/resumes/${resumeId}/download/`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = originalFilename || `resume-${resumeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Download failed or unauthorized.");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Applicant Pipeline</h1>
        <p className="text-xs text-slate-500">
          Review candidates across all your published job openings
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name or email..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="">All Jobs</option>
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
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

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex-shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Applicants List Table/Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No applicants found"
              description="No candidate applications match the selected filters."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applicants.map((app) => (
              <div key={app.id} className="p-6 hover:bg-slate-50/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/recruiter/applicants/${app.id}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {app.candidate_name}
                    </Link>
                    <StatusBadge status={app.status} />
                    {app.notes_count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <MessageSquare className="w-3 h-3" /> {app.notes_count} internal notes
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-700">
                    Applying for: <span className="text-indigo-600">{app.job_title}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{app.candidate_email}</span>
                    {app.candidate_headline && <span>· {app.candidate_headline}</span>}
                    <span>· Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {app.resume && (
                    <button
                      onClick={() => handleDownloadResume(app.resume.id, app.resume.original_filename)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition"
                      title="Download Authorized Resume"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    to={`/recruiter/applicants/${app.id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                  >
                    Review Profile →
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

export default ApplicantsListPage;
