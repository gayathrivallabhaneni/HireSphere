import React, { useState, useEffect } from 'react';
import { Building2, Search, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import EmptyState from '../../components/EmptyState';

export const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [message, setMessage] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (verifiedFilter !== '') params.append('is_verified', verifiedFilter);

      const res = await api.get(`/admin-portal/companies/?${params.toString()}`);
      setCompanies(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [verifiedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleToggleVerify = async (companyId) => {
    try {
      const res = await api.patch(`/admin-portal/companies/${companyId}/verify/`);
      setCompanies(companies.map(c => c.id === companyId ? { ...c, is_verified: res.data.is_verified } : c));
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Failed to update company verification status.");
    }
  };

  const handleToggleActive = async (companyId) => {
    try {
      const res = await api.patch(`/admin-portal/companies/${companyId}/toggle-active/`);
      setCompanies(companies.map(c => c.id === companyId ? { ...c, is_active: res.data.is_active } : c));
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Failed to update company active status.");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registered Companies</h1>
        <p className="text-xs text-slate-500">
          Audit multi-vendor company registrations and manage employer verification badges
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
              placeholder="Search by company name, industry, or location..."
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="">All Companies</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
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

      {/* Companies Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Building2} title="No companies found" description="No company profiles match your query." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Company</th>
                  <th className="py-3 px-6">Industry & HQ</th>
                  <th className="py-3 px-6">Recruiters</th>
                  <th className="py-3 px-6">Jobs</th>
                  <th className="py-3 px-6">Verified</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-medium">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.website || 'No website'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{c.industry}</div>
                      <div className="text-[11px] text-slate-400">{c.location}</div>
                    </td>
                    <td className="py-4 px-6">{c.recruiters_count || 0}</td>
                    <td className="py-4 px-6">{c.jobs_count || 0}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 font-semibold ${c.is_verified ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {c.is_verified ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <XCircle className="w-3.5 h-3.5" />}
                        {c.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleVerify(c.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                          c.is_verified
                            ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                            : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {c.is_verified ? 'Unverify' : 'Verify Badge'}
                      </button>

                      <button
                        onClick={() => handleToggleActive(c.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                          c.is_active
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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

export default AdminCompaniesPage;
