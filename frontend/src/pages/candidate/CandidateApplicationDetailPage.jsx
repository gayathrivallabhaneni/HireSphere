import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ArrowLeft, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const CandidateApplicationDetailPage = () => {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await api.get(`/applications/candidate/my-applications/${id}/`);
        setApp(res.data);
      } catch (err) {
        setError("Application not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
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

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-700">{error || "Could not load application."}</p>
        <Link to="/candidate/applications" className="text-xs font-semibold text-indigo-600 underline">
          Back to My Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link 
        to="/candidate/applications" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Applications List
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-500 uppercase">{app.job?.company?.name}</span>
              <StatusBadge status={app.status} size="lg" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {app.job?.title}
            </h1>
          </div>

          <Link
            to={`/jobs/${app.job?.slug}`}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition"
          >
            View Public Job Post →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-semibold text-slate-800">{app.job?.location}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Work Mode</span>
            <span className="font-semibold text-slate-800">{app.job?.work_mode}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Submission Date</span>
            <span className="font-semibold text-slate-800">{new Date(app.applied_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Last Updated</span>
            <span className="font-semibold text-slate-800">{new Date(app.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Attached Resume & Cover Letter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Attached Resume
          </h2>
          {app.resume ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{app.resume.title}</p>
                  <p className="text-[10px] text-slate-400">{app.resume.original_filename}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownloadResume(app.resume.id, app.resume.original_filename)}
                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition"
                title="Download Attached Resume"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No resume attached.</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Submitted Cover Letter
          </h2>
          <div className="text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto pr-1 whitespace-pre-line">
            {app.cover_letter ? app.cover_letter : <span className="text-slate-400 italic">No cover letter submitted.</span>}
          </div>
        </div>
      </div>

      {/* Status History Audit Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Application Status Timeline</h2>
          <p className="text-xs text-slate-500">Transparent audit history of your candidacy progression</p>
        </div>

        {app.status_history && app.status_history.length > 0 ? (
          <div className="relative pl-6 space-y-6 border-l-2 border-indigo-100 ml-2">
            {app.status_history.map((event, index) => (
              <div key={event.id || index} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm" />
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={event.to_status} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5 mt-1.5 leading-relaxed">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No history records logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default CandidateApplicationDetailPage;
