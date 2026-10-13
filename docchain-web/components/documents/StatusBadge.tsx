import { Check, Loader2, X, Clock } from 'lucide-react';
import type { DocumentStatus } from '@/types/document';
import { cn } from '@/lib/utils';

const STYLES: Record<DocumentStatus, { label: string; className: string; Icon: typeof Check }> = {
  CONFIRMED: {
    label: 'Confirmado',
    className: 'bg-[hsl(var(--success)/0.15)] text-success',
    Icon: Check,
  },
  PROCESSING: {
    label: 'Processando',
    className: 'bg-[hsl(var(--info)/0.15)] text-info',
    Icon: Loader2,
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-[hsl(var(--warning)/0.15)] text-warning',
    Icon: Clock,
  },
  FAILED: {
    label: 'Falhou',
    className: 'bg-[hsl(var(--destructive)/0.15)] text-destructive',
    Icon: X,
  },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STYLES[status];
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        cfg.className,
      )}
    >
      <Icon
        className={cn('h-3 w-3', status === 'PROCESSING' && 'animate-spin')}
      />
      {cfg.label}
    </span>
  );
}
