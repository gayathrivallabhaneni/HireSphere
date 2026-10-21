import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Star, 
  AlertCircle 
} from 'lucide-react';
import api from '../../api/client';
import EmptyState from '../../components/EmptyState';

export const CandidateResumesPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Upload form
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/candidates/resumes/');
      setResumes(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load resumes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF or DOCX file to upload.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 5MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim() || file.name);

    try {
      await api.post('/candidates/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess("Resume uploaded successfully to your secure vault.");
      setTitle('');
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('resume-file-input');
      if (fileInput) fileInput.value = '';
      fetchResumes();
    } catch (err) {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.error || "Upload failed. Please ensure file is a valid PDF or DOCX.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      await api.post(`/candidates/resumes/${resumeId}/set-primary/`);
      setResumes(resumes.map(r => ({
        ...r,
        is_primary: r.id === resumeId
      })));
      setSuccess("Primary resume updated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to set primary resume.");
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.delete(`/candidates/resumes/${resumeId}/`);
      setResumes(resumes.filter(r => r.id !== resumeId));
      setSuccess("Resume deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || "Could not delete resume. It may be attached to active applications.";
      setError(msg);
    }
  };

  const handleDownload = async (resumeId, originalFilename) => {
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
      setError("Download failed or unauthorized.");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Secure Resume Vault</h1>
        <p className="text-xs text-slate-500">
          Upload and manage your CVs. Only recruiters you apply to can download these files.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Upload New Resume
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resume Label / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Resume (2026)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                File (PDF or DOCX, max 5MB)
              </label>
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <UploadCloud className="w-4 h-4" />
              {uploading ? 'Validating & Uploading...' : 'Upload to Vault'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Resumes List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Stored Resumes ({resumes.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes uploaded yet"
            description="Upload your latest PDF or DOCX resume to start applying for jobs."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {resumes.map((resume) => (
              <div key={resume.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{resume.title}</span>
                      {resume.is_primary && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase rounded-md">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {resume.original_filename} · {formatFileSize(resume.file_size)} · Uploaded {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!resume.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(resume.id)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Make Primary
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(resume.id, resume.original_filename)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition"
                    title="Download Resume"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                    title="Delete Resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateResumesPage;
