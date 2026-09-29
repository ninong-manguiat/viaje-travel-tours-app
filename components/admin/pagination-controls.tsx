"use client";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  canPrevious,
  canNext,
  loading,
  page,
  pageSize,
  total,
  itemCount,
  onPrevious,
  onNext,
}: {
  canPrevious: boolean;
  canNext: boolean;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  itemCount?: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const showRange = typeof page === "number" && typeof pageSize === "number" && typeof total === "number" && typeof itemCount === "number";
  const start = showRange && total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = showRange ? Math.min(total, start + itemCount - 1) : 0;
  const previousCount = showRange ? Math.max(0, start - 1) : 0;
  const nextCount = showRange ? Math.max(0, total - end) : 0;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={loading || !canPrevious}>
        {showRange ? `← Previous ${previousCount}` : "Previous"}
      </Button>
      {showRange && (
        <span className="rounded-[8px] border border-viaje-line bg-white px-3 py-2 text-xs font-semibold text-viaje-soft">
          Page {page} &middot; {total > 0 ? `${start}-${end}` : "0"} of {total}
        </span>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={loading || !canNext}>
        {showRange ? `Next ${nextCount} →` : "Next"}
      </Button>
    </div>
  );
}
