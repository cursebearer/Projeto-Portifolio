import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning';

const TONE_BORDER: Record<Tone, string> = {
  default: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
};

const TONE_VALUE: Record<Tone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
};

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: Tone;
}

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border border-l-4 bg-card p-5',
        TONE_BORDER[tone],
      )}
    >
      <div className="mb-2 text-[13px] font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'text-[30px] font-bold tracking-tight',
          TONE_VALUE[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}
