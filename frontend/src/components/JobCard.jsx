import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export const JobCard = ({ job }) => {
  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Competitive';
    const curr = currency === 'USD' ? '$' : currency;
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
    if (min) return `From ${curr}${min.toLocaleString()}`;
    return `Up to ${curr}${max.toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const companyInitial = job.company?.name ? job.company.name.charAt(0).toUpperCase() : 'J';

  return (
    <div className="group bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
              {job.company?.logo ? (
                <img 
                  src={job.company.logo} 
                  alt={job.company.name} 
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                companyInitial
              )}
            </div>
            <div>
              <Link 
                to={`/jobs/${job.slug}`}
                className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1"
              >
                {job.title}
              </Link>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <span>{job.company?.name || 'Top Employer'}</span>
                {job.company?.is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 inline fill-indigo-50" />
                )}
              </div>
            </div>
          </div>

          {job.is_featured && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Featured
            </span>
          )}
        </div>

        {/* Badges / Key Attributes */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-slate-600 mb-4">
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {job.work_mode === 'ON_SITE' ? 'On-site' : job.work_mode === 'REMOTE' ? 'Remote' : 'Hybrid'} · {job.employment_type?.replace('_', '-')}
          </span>
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium px-2.5 py-1 rounded-lg">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            {formatSalary(job.min_salary, job.max_salary, job.currency)}
          </span>
        </div>

        {/* Skills Tags */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Posted {formatDate(job.created_at)}</span>
        </div>
        <Link
          to={`/jobs/${job.slug}`}
          className="font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
        >
          View Job →
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
