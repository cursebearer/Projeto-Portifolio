'use client';

import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyableField as Field } from '@/components/documents/CopyableField';
import { etherscanTxUrl, with0x } from '@/lib/format';
import type { DocumentDto } from '@/types/document';

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
