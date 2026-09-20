import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  subtitle: string;
  width?: string;
  children: React.ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  width = 'w-[420px]',
  children,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-10 shadow-[0_20px_50px_rgba(0,0,0,0.45)]',
        width,
      )}
    >
      <div className="mb-7 flex items-center gap-2.5">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="text-[22px] font-bold text-primary tracking-tight">
          DocChain
        </span>
      </div>
      <h1 className="mb-1.5 text-[28px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mb-7 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}
