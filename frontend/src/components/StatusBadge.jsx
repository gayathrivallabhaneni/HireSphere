import React from 'react';

const statusConfig = {
  // Application statuses
  APPLIED: {
    label: 'Applied',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500'
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500'
  },
  OFFERED: {
    label: 'Offered',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  },

  // Job statuses
  PUBLISHED: {
    label: 'Published',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  DRAFT: {
    label: 'Draft',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  },
  CLOSED: {
    label: 'Closed',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  ARCHIVED: {
    label: 'Archived',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400'
  }
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.classes} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
