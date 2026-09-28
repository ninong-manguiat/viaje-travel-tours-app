"use client";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  canPrevious,
  canNext,
  loading,
  onPrevious,
  onNext,
}: {
  canPrevious: boolean;
  canNext: boolean;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={loading || !canPrevious}>
        Previous
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={loading || !canNext}>
        Next
      </Button>
    </div>
  );
}
