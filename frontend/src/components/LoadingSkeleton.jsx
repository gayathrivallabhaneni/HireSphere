import React from 'react';

export const JobCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded-full" />
    </div>
    <div className="flex gap-4">
      <div className="h-4 w-24 bg-slate-100 rounded" />
      <div className="h-4 w-24 bg-slate-100 rounded" />
      <div className="h-4 w-28 bg-slate-100 rounded" />
    </div>
    <div className="flex gap-2 pt-2 border-t border-slate-100">
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="animate-pulse border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-slate-200 rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);
