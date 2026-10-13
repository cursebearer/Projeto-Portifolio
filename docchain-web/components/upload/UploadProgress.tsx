import { Check, Loader2, X } from 'lucide-react';
import { UPLOAD_STEPS, type StepState } from '@/lib/upload-steps';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  states: StepState[];
  sendProgress: number;
}

function stepStatusText(index: number, state: StepState, sendProgress: number): string {
  if (state === 'done') return 'Concluído';
  if (state === 'error') return 'Falhou';
  if (state === 'pending') return 'Pendente';
  if (index === 0) return `${Math.round(sendProgress * 100)}% enviado`;
  if (index >= 3) return 'Pode levar ~15 segundos';
  return 'Em andamento...';
}

export function UploadProgress({ states, sendProgress }: UploadProgressProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6" aria-live="polite">
      <p className="mb-5 text-base font-semibold text-foreground">
        Processando registro on-chain
      </p>
      <ol>
        {UPLOAD_STEPS.map((step, i) => {
          const state = states[i];
          return (
            <li key={step.key} className="flex items-start gap-3.5 py-3" data-state={state}>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                  state === 'done' && 'bg-success/15 text-success',
                  state === 'active' && 'bg-primary/15 text-primary',
                  state === 'pending' && 'bg-secondary text-muted-foreground',
                  state === 'error' && 'bg-destructive/15 text-destructive',
                )}
              >
                {state === 'done' && <Check className="h-4 w-4" />}
                {state === 'active' && <Loader2 className="h-4 w-4 animate-spin" />}
                {state === 'error' && <X className="h-4 w-4" />}
                {state === 'pending' && i + 1}
              </span>
              <div>
                <p
                  className={cn(
                    'text-sm font-medium text-foreground',
                    state === 'done' && 'text-success',
                    state === 'active' && 'font-semibold text-primary',
                    state === 'error' && 'text-destructive',
                  )}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stepStatusText(i, state, sendProgress)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 rounded-md border-l-[3px] border-warning bg-warning/10 px-4 py-3 text-[13px] text-warning">
        Não feche esta janela durante o processo.
      </div>
    </div>
  );
}
