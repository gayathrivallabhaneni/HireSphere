import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Download, 
  Lock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Globe
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../../components/SocialIcons';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

export const ApplicantDetailPage = () => {
  const { id } = useParams();

  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Change State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');

  // Private Notes State
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [notesList, setNotesList] = useState([]);

  const fetchApplicantDetails = async () => {
    try {
      const res = await api.get(`/applications/recruiter/applications/${id}/`);
      setApplicant(res.data);
      setNewStatus(res.data.status);
      setNotesList(res.data.notes || []);
    } catch (err) {
      setError("Applicant profile not found or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicantDetails();
  }, [id]);

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

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    setStatusSuccess('');

    try {
      await api.post(`/applications/recruiter/applications/${id}/status/`, {
        status: newStatus,
        notes: statusNote
      });
      setStatusSuccess(`Application updated to ${newStatus}.`);
      setStatusModalOpen(false);
      setStatusNote('');
      fetchApplicantDetails();
    } catch (err) {
      alert("Failed to update candidate status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);

    try {
      const res = await api.post(`/applications/recruiter/applications/${id}/notes/`, {
        note: newNote.trim()
      });
      setNotesList([res.data, ...notesList]);
      setNewNote('');
    } catch (err) {
      alert("Failed to save internal note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-700">{error || "Could not load candidate profile."}</p>
        <Link to="/recruiter/applicants" className="text-xs font-semibold text-indigo-600 underline">
          Back to Applicants List
        </Link>
      </div>
    );
  }

  const profile = applicant.candidate_profile || {};

  return (
    <div className="max-w-5xl space-y-6">
      <Link 
        to="/recruiter/applicants" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>

      {statusSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusSuccess}</span>
        </div>
      )}

      {/* Main Candidate Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
              {applicant.candidate_name ? applicant.candidate_name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {applicant.candidate_name}
                </h1>
                <StatusBadge status={applicant.status} size="lg" />
              </div>
              <p className="text-xs font-semibold text-indigo-600">
                Applied for: {applicant.job_title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {applicant.candidate_email}
            </span>
            {applicant.candidate_phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {applicant.candidate_phone}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {profile.location}
              </span>
            )}
            <span className="text-slate-400">
              Applied {new Date(applicant.applied_at).toLocaleDateString()}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 pt-1">
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full md:w-auto flex flex-col gap-2.5">
          <button
            onClick={() => setStatusModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition text-center"
          >
            Update Application Stage
          </button>

          {applicant.resume && (
            <button
              onClick={() => handleDownloadResume(applicant.resume.id, applicant.resume.original_filename)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Download Resume ({applicant.resume.original_filename || 'PDF'})
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout: Profile Details & Private Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Candidate Overview & Cover Letter */}
        <div className="md:col-span-2 space-y-6">
          {/* Headline & Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Candidate Overview
            </h2>

            {profile.headline && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Headline</span>
                <p className="text-sm font-semibold text-slate-800">{profile.headline}</p>
              </div>
            )}

            {profile.summary && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Summary</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{profile.summary}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase mb-2">Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Experience</span>
                <span className="font-semibold text-slate-800">{profile.experience_years || 0} years</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Education</span>
                <span className="font-semibold text-slate-800">{profile.education || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Candidate Cover Letter
            </h2>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {applicant.cover_letter || <span className="text-slate-400 italic">No cover letter submitted.</span>}
            </div>
          </div>

          {/* Status Progression Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Status Change Audit History
            </h2>
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
              {applicant.status_history?.map((h, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.to_status} />
                    <span className="text-slate-400 text-[10px]">
                      {new Date(h.created_at).toLocaleString()} by {h.changed_by_name || 'System'}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="mt-1 text-slate-600 bg-slate-50 p-2 rounded-lg">{h.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Private Recruiter Notes Thread */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Internal Team Notes
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Confidential notes visible only to recruiters at your company. Candidates cannot see these notes.
          </p>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add feedback, screening notes, or interview observations..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={isAddingNote || !newNote.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isAddingNote ? 'Saving Note...' : 'Post Internal Note'}
            </button>
          </form>

          {/* Notes Feed */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 divide-y divide-slate-100">
            {notesList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No internal notes yet.</p>
            ) : (
              notesList.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800">{item.recruiter_name}</span>
                    <span className="text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {item.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Application Stage"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Stage
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Comment / Feedback
            </label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Completed initial tech screen with positive recommendation..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              {isUpdatingStatus ? 'Updating...' : 'Save Stage Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApplicantDetailPage;
