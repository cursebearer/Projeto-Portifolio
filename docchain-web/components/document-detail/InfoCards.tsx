import { ExternalLink } from 'lucide-react';
import { CopyableField } from '@/components/documents/CopyableField';
import { etherscanTxUrl, formatBytes, formatDateTime, truncateHash, with0x } from '@/lib/format';
import type { DocumentDto } from '@/types/document';

export function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

export function MetadataCard({ document, ownerName }: { document: DocumentDto; ownerName: string }) {
  return (
    <DetailCard title="Metadados">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetaItem label="Tipo" value={document.mimeType} />
        <MetaItem label="Tamanho" value={formatBytes(document.fileSize)} />
        <MetaItem label="Data do upload" value={formatDateTime(document.uploadedAt)} />
        <MetaItem label="Proprietário" value={`${ownerName} (você)`} />
      </div>
    </DetailCard>
  );
}

export function ProofCard({ document }: { document: DocumentDto }) {
  return (
    <DetailCard title="Prova Blockchain">
      <CopyableField label="Hash SHA-256" value={with0x(document.hash)} copyLabel="Hash" />
      {document.txHash ? (
        <CopyableField
          label="Transaction Hash"
          value={with0x(document.txHash)}
          copyLabel="Tx hash"
          action={
            <a
              href={etherscanTxUrl(document.txHash, document.network)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Etherscan
            </a>
          }
        />
      ) : (
        <p className="py-2.5 text-sm text-muted-foreground">
          {document.status === 'FAILED'
            ? `Registro on-chain falhou${document.errorMessage ? `: ${document.errorMessage}` : '.'}`
            : 'Transação ainda não confirmada.'}
        </p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetaItem label="Bloco" value={document.blockNumber ?? '—'} />
        <MetaItem label="Rede" value={document.network ?? 'sepolia'} />
        <MetaItem
          label="Wallet (servidor)"
          value={document.walletAddress ? <code className="font-mono text-xs">{truncateHash(document.walletAddress)}</code> : '—'}
        />
        <MetaItem label="Confirmado em" value={formatDateTime(document.confirmedAt)} />
      </div>
    </DetailCard>
  );
}
