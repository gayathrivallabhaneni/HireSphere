import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  Eye,
  Users,
  ExternalLink,
  UploadCloud,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

export const JobDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCandidate } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application modal & form state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Upload new resume in modal state
  const [uploadMode, setUploadMode] = useState(false);
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const res = await api.get(`/jobs/${slug}/`);
        setJob(res.data);
      } catch (err) {
        setError("Job opening not found or has been closed.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [slug]);

  // When opening modal, fetch candidate resumes if candidate
  const handleOpenApplyModal = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsApplyModalOpen(true);
    setApplyError(null);
    try {
      const res = await api.get('/candidates/resumes/');
      const list = res.data.results || res.data || [];
      setResumes(list);
      // Default to primary resume
      const primary = list.find(r => r.is_primary) || list[0];
      if (primary) setSelectedResumeId(primary.id);
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    }
  };

  const handleUploadNewResume = async (e) => {
    e.preventDefault();
    if (!newResumeFile) {
      setApplyError("Please select a valid PDF or DOCX resume file.");
      return;
    }
    setIsUploadingResume(true);
    setApplyError(null);

    const formData = new FormData();
    formData.append('file', newResumeFile);
    formData.append('title', newResumeTitle || newResumeFile.name);

    try {
      const res = await api.post('/candidates/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedResume = res.data;
      setResumes([uploadedResume, ...resumes]);
      setSelectedResumeId(uploadedResume.id);
      setUploadMode(false);
      setNewResumeFile(null);
      setNewResumeTitle('');
    } catch (err) {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.error || "Failed to upload resume. PDF/DOCX under 5MB only.";
      setApplyError(msg);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setApplyError("Please select or upload a resume to submit your application.");
      return;
    }

    setIsSubmitting(true);
    setApplyError(null);

    try {
      await api.post('/applications/apply/', {
        job_id: job.id,
        resume_id: selectedResumeId,
        cover_letter: coverLetter,
      });

      setApplySuccess(true);
      setJob(prev => ({ ...prev, has_applied: true, applications_count: (prev.applications_count || 0) + 1 }));
      setTimeout(() => {
        setIsApplyModalOpen(false);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || "Could not submit application. You may have already applied.";
      setApplyError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Job Not Found</h2>
        <p className="text-sm text-slate-500">{error || "This posting is no longer active."}</p>
        <Link to="/jobs" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Competitive';
    const curr = currency === 'USD' ? '$' : currency;
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()} / year`;
    if (min) return `From ${curr}${min.toLocaleString()} / year`;
    return `Up to ${curr}${max.toLocaleString()} / year`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link 
        to="/jobs" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search Results
      </Link>

      {/* Main Job Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {job.company?.name ? job.company.name.charAt(0).toUpperCase() : 'J'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">{job.company?.name}</span>
                {job.company?.is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 fill-indigo-50" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-400" />
              {job.location} ({job.work_mode === 'ON_SITE' ? 'On-site' : job.work_mode === 'REMOTE' ? 'Remote' : 'Hybrid'})
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {job.employment_type?.replace('_', '-')} · {job.experience_level}
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-3 py-1.5 rounded-xl">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {formatSalary(job.min_salary, job.max_salary, job.currency)}
            </span>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-stretch md:items-end gap-2">
          {job.has_applied ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl text-center text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Application Submitted</span>
            </div>
          ) : (
            <button
              onClick={handleOpenApplyModal}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-200 text-center"
            >
              Apply for this Role
            </button>
          )}

          <div className="flex items-center gap-4 text-[11px] text-slate-400 justify-center md:justify-end px-1">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {job.views_count} views</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {job.applications_count} applicants</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Job Details & Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Job Description & Details */}
        <div className="md:col-span-2 space-y-8">
          {/* Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              About the Role
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Key Responsibilities
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Qualifications & Requirements
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Desired Skills & Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Company Snapshot */}
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              About {job.company?.name}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {job.company?.description}
            </p>

            <div className="space-y-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Industry:</span>
                <span className="font-medium text-slate-800">{job.company?.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Headquarters:</span>
                <span className="font-medium text-slate-800">{job.company?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Company Size:</span>
                <span className="font-medium text-slate-800">{job.company?.size} employees</span>
              </div>
              {job.company?.website && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Website:</span>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    Visit Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Application Submission Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply to ${job.title}`}
      >
        {applySuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Application Submitted!</h4>
            <p className="text-xs text-slate-500">
              The hiring team at {job.company?.name} has received your resume and application.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitApplication} className="space-y-5">
            {applyError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            {/* Resume Selection or Upload Switch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Resume
                </label>
                <button
                  type="button"
                  onClick={() => setUploadMode(!uploadMode)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadMode ? 'Pick from vault' : '+ Upload new resume'}
                </button>
              </div>

              {uploadMode ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Resume Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Resume 2026"
                      value={newResumeTitle}
                      onChange={(e) => setNewResumeTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">File (PDF or DOCX, max 5MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setNewResumeFile(e.target.files[0])}
                      className="text-xs text-slate-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadNewResume}
                    disabled={isUploadingResume || !newResumeFile}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                  >
                    {isUploadingResume ? 'Uploading...' : 'Save & Select Resume'}
                  </button>
                </div>
              ) : resumes.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-500">You have no resumes saved in your vault.</p>
                  <button
                    type="button"
                    onClick={() => setUploadMode(true)}
                    className="text-xs font-semibold text-indigo-600 underline"
                  >
                    Upload a resume now
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {resumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedResumeId === resume.id
                          ? 'border-indigo-600 bg-indigo-50/60'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="resume_choice"
                          value={resume.id}
                          checked={selectedResumeId === resume.id}
                          onChange={() => setSelectedResumeId(resume.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{resume.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {resume.original_filename} {resume.is_primary && '· (Primary)'}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cover Letter / Personal Note (Optional)
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Highlight your key achievements and why you are interested in this position..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedResumeId}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition"
              >
                {isSubmitting ? 'Submitting Application...' : 'Send Application'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default JobDetailPage;
