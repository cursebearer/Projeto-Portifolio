'use client';

import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

interface CopyableFieldProps {
  label: string;
  value: string;
  copyLabel?: string;
  action?: React.ReactNode;
}

export function CopyableField({ label, value, copyLabel, action }: CopyableFieldProps) {
  return (
    <div className="py-2.5">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">{value}</code>
        {copyLabel && (
          <button
            type="button"
            onClick={() => void copyToClipboard(value, copyLabel)}
            className="text-muted-foreground hover:text-primary"
            aria-label={`Copiar ${copyLabel.toLowerCase()}`}
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
