'use client';

import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { etherscanTxUrl, with0x } from '@/lib/format';
import type { DocumentDto } from '@/types/document';

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('Não foi possível copiar');
  }
}

function Field({ label, value, copyLabel }: { label: string; value: string; copyLabel?: string }) {
  return (
    <div className="py-2.5">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">{value}</code>
        {copyLabel && (
          <button
            type="button"
            onClick={() => void copy(value, copyLabel)}
            className="text-muted-foreground hover:text-primary"
            aria-label={`Copiar ${copyLabel.toLowerCase()}`}
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function UploadResult({ document, onReset }: { document: DocumentDto; onReset: () => void }) {
  return (
    <div className="rounded-xl border border-success/40 bg-card p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <CheckCircle2 className="h-6 w-6 text-success" />
        <p className="text-base font-semibold text-success">Documento registrado na blockchain</p>
      </div>

      <div className="divide-y divide-border">
        <Field label="Arquivo" value={document.fileName} />
        <Field label="Hash SHA-256" value={with0x(document.hash)} copyLabel="Hash" />
        {document.txHash && (
          <Field label="Transação" value={with0x(document.txHash)} copyLabel="Tx hash" />
        )}
        {document.blockNumber !== null && (
          <Field label="Bloco" value={String(document.blockNumber)} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {document.txHash && (
          <Button asChild variant="outline">
            <a href={etherscanTxUrl(document.txHash, document.network)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Ver no Etherscan
            </a>
          </Button>
        )}
        <Button asChild>
          <Link href={`/documents/${document.id}`}>Ver documento</Link>
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Registrar outro
        </Button>
      </div>
    </div>
  );
}
