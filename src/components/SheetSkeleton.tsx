import React from 'react';

export const SheetSkeleton: React.FC = () => {
  return (
    <div className="w-full p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-token-sm skeleton shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 rounded-token-xs skeleton" />
          <div className="h-3 w-1/4 rounded-token-xs skeleton" />
        </div>
      </div>

      {/* Body Rows Skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-full rounded-token-sm skeleton" />
        <div className="h-24 w-full rounded-token-sm skeleton" />
        <div className="h-10 w-full rounded-token-sm skeleton" />
      </div>
    </div>
  );
};
