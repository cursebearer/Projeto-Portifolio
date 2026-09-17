'use client';

import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalLabel?: string;
}

function pagesToShow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'gap')[] = [1];
  if (page > 3) pages.push('gap');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push('gap');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  totalLabel,
}: PaginationProps) {
  if (totalPages <= 1 && !totalLabel) return null;
  const pages = pagesToShow(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-5 py-4">
      {totalLabel && (
        <div className="text-[13px] text-muted-foreground">{totalLabel}</div>
      )}
      <div className="ml-auto flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <span
              key={`gap-${i}`}
              className="px-2 py-1.5 text-[13px] text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-[13px]',
                p === page
                  ? 'border-primary bg-primary font-semibold text-primary-foreground'
                  : 'border-border bg-secondary text-foreground hover:bg-border',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
